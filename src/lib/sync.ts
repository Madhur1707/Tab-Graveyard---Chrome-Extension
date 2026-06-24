import { supabase } from './supabase'
import { embedText } from './embeddings'

declare const chrome: any

// Text we feed the embedding model for each tab. The page's meta description
// carries the real meaning (what the site is about) — without it we only have a
// short, often brand-only title. Domain adds a little extra context.
function embedInput(t: { title: string; domain: string; description?: string }) {
  return `${t.title}. ${t.description ?? ''} ${t.domain}`.replace(/\s+/g, ' ').trim()
}

const SYNCED_IDS_KEY = 'syncedTabIds'

export type SyncTab = {
  id: number
  title: string
  url: string
  domain: string
  favIconUrl: string
  closedAt: number
  description?: string
}

async function getSyncedIds(): Promise<Set<number>> {
  try {
    const result = await chrome.storage.local.get(SYNCED_IDS_KEY)
    return new Set<number>(result[SYNCED_IDS_KEY] || [])
  } catch {
    return new Set<number>()
  }
}

async function addSyncedIds(ids: number[]): Promise<void> {
  const current = await getSyncedIds()
  ids.forEach((id) => current.add(id))
  await chrome.storage.local.set({ [SYNCED_IDS_KEY]: Array.from(current) })
}

/**
 * Pushes any not-yet-synced local closed tabs to the user's closed_tabs rows,
 * computing each tab's embedding locally so AI search works. Dedupe is tracked
 * locally via syncedTabIds (the local tab id, a Date.now() timestamp) so we
 * never insert the same tab twice.
 */
export async function syncClosedTabs(userId: string, tabs: SyncTab[]) {
  if (!supabase) return { synced: 0 }

  const syncedIds = await getSyncedIds()
  const unsynced = tabs.filter((t) => !syncedIds.has(t.id))
  if (unsynced.length === 0) return { synced: 0 }

  const rows = []
  for (const t of unsynced) {
    let embedding: number[] | null = null
    try {
      embedding = await embedText(embedInput(t))
    } catch (e) {
      // If embedding fails (e.g. model still downloading), sync the row anyway;
      // backfillEmbeddings() can fill it in later.
      console.error('Embedding failed for tab, syncing without it:', e)
    }
    rows.push({
      user_id: userId,
      title: t.title,
      url: t.url,
      domain: t.domain,
      fav_icon_url: t.favIconUrl,
      description: t.description ?? '',
      closed_at: t.closedAt,
      embedding,
    })
  }

  const { error } = await supabase.from('closed_tabs').insert(rows)
  if (error) return { error }

  await addSyncedIds(unsynced.map((t) => t.id))
  return { synced: unsynced.length }
}

/**
 * Computes embeddings for the user's already-synced rows that don't have one
 * yet (e.g. tabs synced before AI search existed). Safe to call repeatedly —
 * it only touches rows where embedding is null. Returns how many it filled in.
 */
export async function backfillEmbeddings(userId: string) {
  if (!supabase) return { filled: 0 }

  const { data, error } = await supabase
    .from('closed_tabs')
    .select('id, title, domain, description')
    .eq('user_id', userId)
    .is('embedding', null)

  if (error) return { error }
  if (!data || data.length === 0) return { filled: 0 }

  let filled = 0
  for (const row of data) {
    try {
      const embedding = await embedText(embedInput(row as any))
      const { error: updErr } = await supabase
        .from('closed_tabs')
        .update({ embedding })
        .eq('id', row.id)
      if (!updErr) filled++
    } catch (e) {
      console.error('Backfill embedding failed for row', row.id, e)
    }
  }
  return { filled }
}

/**
 * Semantic (AI) search: embeds the query locally, then asks pgvector (via the
 * match_closed_tabs SQL function) for the closest tabs by meaning. RLS + the
 * function's auth.uid() filter ensure a user only ever searches their own tabs.
 */
export async function semanticSearch(
  query: string,
  { matchThreshold = 0.2, matchCount = 12 }: { matchThreshold?: number; matchCount?: number } = {},
): Promise<SyncTab[]> {
  if (!supabase || !query.trim()) return []

  const queryEmbedding = await embedText(query)
  const { data, error } = await supabase.rpc('match_closed_tabs', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  })
  if (error) {
    console.error('Semantic search failed:', error)
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: Number(row.id),
    title: row.title ?? '',
    url: row.url ?? '',
    domain: row.domain ?? '',
    favIconUrl: row.fav_icon_url ?? '',
    closedAt: Number(row.closed_at) || 0,
  }))
}
