import React, { useState, useEffect } from 'react';
import { Search, Settings, Ghost, ExternalLink, Sparkles, Check, Trash2 } from 'lucide-react';

const C = {
  bg: '#0f0f10',
  surface: '#1a1a1f',
  surfaceHover: '#202028',
  border: '#242430',
  borderLight: '#2e2e3a',
  accent: '#6366f1',
  muted: '#6b7280',
  mutedDim: '#4b5563',
  white: '#f1f1f3',
  whiteDim: '#a1a1aa',
};

interface Tab {
  id: number;
  title: string;
  url: string;
  domain: string;
  favIconUrl: string;
  closedAt: number;
}

const FEATURES = [
  'Unlimited tab history',
  'Sync across all devices',
  'AI-powered search & chat',
];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getInitial(domain: string): string {
  return domain.charAt(0).toUpperCase();
}

function getDomainColor(domain: string): string {
  const colors = ['#61dafb', '#f97316', '#e5e7eb', '#38bdf8', '#3b82f6', '#a855f7', '#6b7280', '#10b981', '#f59e0b', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const popupStyle: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  background: C.bg,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

function Favicon({ domain, favIconUrl }: { domain: string; favIconUrl: string }) {
  const [imgError, setImgError] = useState(false);
  const color = getDomainColor(domain);

  if (favIconUrl && !imgError) {
    return (
      <img
        src={favIconUrl}
        width={26} height={26}
        style={{ borderRadius: 5, flexShrink: 0 }}
        onError={() => setImgError(true)}
        alt=""
      />
    );
  }

  return (
    <div style={{
      width: 26, height: 26, borderRadius: 5,
      background: color + '18', border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: 10, fontWeight: 700, color,
    }}>
      {getInitial(domain)}
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <span key={i} style={{ color: C.accent, fontWeight: 600 }}>{part}</span>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

function TopBar() {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ghost size={15} color={C.accent} strokeWidth={1.75} />
        <span style={{ color: C.white, fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em' }}>Tab Graveyard</span>
      </div>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? C.surface : 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', color: hovered ? C.whiteDim : C.muted, transition: 'background 0.12s, color 0.12s' }}
      >
        <Settings size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function TabRow({ tab, query, onRestore, onDelete }: { tab: Tab; query: string; onRestore: (tab: Tab) => void; onDelete: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 56, background: hovered ? C.surfaceHover : 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}
    >
      <div onClick={() => onRestore(tab)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <Favicon domain={tab.domain} favIconUrl={tab.favIconUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.white, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
            <HighlightText text={tab.title} query={query} />
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{tab.domain}</div>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {hovered ? (
          <>
            <ExternalLink size={13} color={C.accent} strokeWidth={2} onClick={() => onRestore(tab)} />
            <Trash2 size={13} color={C.muted} strokeWidth={2} onClick={() => onDelete(tab.id)} />
          </>
        ) : (
          <span style={{ color: C.mutedDim, fontSize: 11 }}>{timeAgo(tab.closedAt)}</span>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '0 16px' }} />;
}

function ProModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: 310, background: C.surface, borderRadius: 12, border: `1px solid ${C.borderLight}`, padding: '28px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: C.accent + '1a', border: `1px solid ${C.accent}38`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={22} color={C.accent} strokeWidth={1.75} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.white, fontSize: 15, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 7 }}>Unlock Tab Graveyard Pro</div>
          <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.65, maxWidth: 220, margin: '0 auto' }}>Unlimited history, multi-device sync, and AI search</div>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.accent + '18', border: `1px solid ${C.accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={10} color={C.accent} strokeWidth={2.5} />
              </div>
              <span style={{ color: C.white, fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 8, padding: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Upgrade — $3 / month
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: -6 }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

export default function TabGraveyardApp() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [query, setQuery] = useState('');
  const [showPro, setShowPro] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tabs from Chrome storage
  useEffect(() => {
    loadTabs();

    // Listen for storage changes (new tabs added by background.js)
    const handleStorage = (changes: any) => {
      if (changes.closedTabs) {
        setTabs(changes.closedTabs.newValue || []);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorage);
      return () => chrome.storage.onChanged.removeListener(handleStorage);
    }
  }, []);

  async function loadTabs() {
    setLoading(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get('closedTabs');
        setTabs(result.closedTabs || []);
      }
    } catch (e) {
      console.error('Failed to load tabs:', e);
    }
    setLoading(false);
  }

  async function handleRestore(tab: Tab) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      await chrome.tabs.create({ url: tab.url });
    }
  }

  async function handleDelete(id: number) {
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ closedTabs: updated });
    }
  }

  const filtered = query
    ? tabs.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.domain.toLowerCase().includes(query.toLowerCase())
      )
    : tabs;

  const isEmpty = tabs.length === 0;

  return (
    <div style={{ ...popupStyle, position: 'relative' }}>
      <TopBar />

      {/* Search bar */}
      <div style={{ padding: '0 12px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${query ? C.borderLight : C.border}`, borderRadius: 8, padding: '8px 12px' }}>
          <Search size={13} color={query ? C.whiteDim : C.muted} strokeWidth={2} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your closed tabs..."
            style={{ background: 'none', border: 'none', outline: 'none', color: C.white, fontSize: 13, flex: 1, fontFamily: 'inherit' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, fontSize: 11 }}>esc</button>
          )}
        </div>
      </div>

      {/* Results count when searching */}
      {query && (
        <div style={{ padding: '0 16px 6px' }}>
          <span style={{ color: C.muted, fontSize: 11 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Tab list / empty state */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Loading...</span>
          </div>
        ) : isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, padding: '0 32px' }}>
            <Ghost size={38} color={C.border} strokeWidth={1.25} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.white, fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Your graveyard is empty</div>
              <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.65 }}>Close a tab and it will appear here</div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10 }}>
            <div style={{ color: C.muted, fontSize: 13 }}>No tabs match "{query}"</div>
          </div>
        ) : (
          filtered.map((tab, i) => (
            <React.Fragment key={tab.id}>
              <TabRow tab={tab} query={query} onRestore={handleRestore} onDelete={handleDelete} />
              {i < filtered.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted, fontSize: 11 }}>{tabs.length} tabs saved</span>
        <button
          onClick={() => setShowPro(true)}
          style={{ background: C.accent, border: 'none', borderRadius: 20, padding: '5px 13px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          Upgrade to Pro
        </button>
      </div>

      {showPro && <ProModal onClose={() => setShowPro(false)} />}
    </div>
  );
}