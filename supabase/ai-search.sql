-- Tab Graveyard — AI semantic search (pgvector).
-- Run this in Supabase → SQL Editor AFTER schema.sql. Safe to re-run.
-- Requires the `vector` extension (already enabled by schema.sql).

-- ---------------------------------------------------------------------------
-- Approximate-nearest-neighbour index for fast similarity search.
-- HNSW + cosine distance (we store normalized embeddings, so cosine is ideal).
-- ---------------------------------------------------------------------------
create index if not exists closed_tabs_embedding_idx
  on public.closed_tabs
  using hnsw (embedding vector_cosine_ops);

-- Drop older versions so re-running doesn't leave ambiguous overloads.
drop function if exists public.match_closed_tabs(vector, int);
drop function if exists public.match_closed_tabs(vector, float, int);

-- ---------------------------------------------------------------------------
-- match_closed_tabs: the caller's tabs closest in meaning to a query embedding.
--
-- match_threshold drops weak matches: similarity = 1 - cosine_distance, so 1.0
-- is identical, ~0 is unrelated. Without it, the function would return the top
-- N rows no matter how irrelevant. 0.3 is a sensible default for MiniLM.
--
-- SECURITY: runs as the caller (security invoker) and filters by auth.uid(), so
-- a user can only ever match their own rows; RLS applies on top.
-- ---------------------------------------------------------------------------
create or replace function public.match_closed_tabs(
  query_embedding vector(384),
  match_threshold float default 0.3,
  match_count int default 20
)
returns table (
  id bigint,
  title text,
  url text,
  domain text,
  fav_icon_url text,
  closed_at bigint,
  similarity float
)
language sql
stable
as $$
  select
    ct.id,
    ct.title,
    ct.url,
    ct.domain,
    ct.fav_icon_url,
    ct.closed_at,
    1 - (ct.embedding <=> query_embedding) as similarity
  from public.closed_tabs ct
  where ct.user_id = auth.uid()
    and ct.embedding is not null
    and 1 - (ct.embedding <=> query_embedding) >= match_threshold
  order by ct.embedding <=> query_embedding
  limit match_count;
$$;
