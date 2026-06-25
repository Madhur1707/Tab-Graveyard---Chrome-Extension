import React, { useState, useEffect, useMemo } from 'react';
import { Search, Settings, Ghost, ExternalLink, Sparkles, Check, Trash2, ArrowLeft, Mail, LogOut, FlaskConical } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { DEV_MODE } from '../../lib/supabase';
import { syncClosedTabs, semanticSearch, backfillEmbeddings } from '../../lib/sync';

declare const chrome: any;

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
  description?: string;
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

function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 12px 4px' }}>
      <button
        onClick={onOpenSettings}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Settings"
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

function ProModal({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
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
        <button onClick={onUpgrade} style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 8, padding: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {DEV_MODE ? 'Activate Pro (test)' : 'Upgrade — $3 / month'}
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: -6 }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

type AuthState = ReturnType<typeof useAuth>;

function SettingsScreen({ auth, onBack, onUpgrade }: { auth: AuthState; onBack: () => void; onUpgrade: () => void }) {
  const { user, loading, signInWithEmail, signInWithPassword, verifyOtp, signOut, setPro } = auth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'codeSent' | 'verifying'>('idle');
  const [error, setError] = useState('');
  const [backHovered, setBackHovered] = useState(false);
  const [proBusy, setProBusy] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const isPro = Boolean(user?.is_pro);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSigningIn(true);
    setError('');
    const { error } = await signInWithPassword(email, password);
    if (error) {
      setError(error.message || 'Could not sign in. Check the email/password.');
    }
    setSigningIn(false);
    // On success, onAuthStateChange populates `user` and this view re-renders.
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('sending');
    setError('');
    const { error } = await signInWithEmail(trimmed);
    if (error) {
      setError(error.message || 'Could not send the code. Please try again.');
      setStatus('idle');
    } else {
      setStatus('codeSent');
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (trimmedCode.length < 6) return;
    setStatus('verifying');
    setError('');
    const { error } = await verifyOtp(email.trim(), trimmedCode);
    if (error) {
      setError(error.message || 'Invalid or expired code. Please try again.');
      setStatus('codeSent');
    }
    // On success, onAuthStateChange populates `user` and this view re-renders.
  }

  async function handleTogglePro() {
    setProBusy(true);
    setError('');
    const { error } = await setPro(!isPro);
    if (error) setError(error.message || 'Could not update plan.');
    setProBusy(false);
  }

  return (
    <div style={{ ...popupStyle, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 8px' }}>
        <button
          onClick={onBack}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          title="Back"
          style={{ background: backHovered ? C.surface : 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', color: backHovered ? C.whiteDim : C.muted, transition: 'background 0.12s, color 0.12s' }}
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
        </button>
        <span style={{ color: C.white, fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Account section */}
        <div>
          <div style={{ color: C.whiteDim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Account</div>

          {loading ? (
            <div style={{ color: C.muted, fontSize: 12 }}>Loading…</div>
          ) : user ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent + '1a', border: `1px solid ${C.accent}38`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.accent, fontSize: 13, fontWeight: 700 }}>
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.white, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>Signed in</div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                style={{ width: '100%', marginTop: 14, background: 'none', border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '9px 0', color: C.whiteDim, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <LogOut size={13} strokeWidth={2} /> Sign out
              </button>
            </div>
          ) : DEV_MODE ? (
            <form onSubmit={handlePasswordSignIn}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.whiteDim, fontSize: 11, marginBottom: 10 }}>
                <FlaskConical size={12} strokeWidth={1.75} /> Test sign-in (email + password)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', marginBottom: 8 }}>
                <Mail size={13} color={C.muted} strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                  placeholder="test@example.com"
                  autoComplete="username"
                  style={{ background: 'none', border: 'none', outline: 'none', color: C.white, fontSize: 13, flex: 1, fontFamily: 'inherit' }}
                />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                placeholder="Password"
                autoComplete="current-password"
                style={{ width: '100%', boxSizing: 'border-box', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', color: C.white, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 10 }}
              />
              {error && <div style={{ color: '#f87171', fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>{error}</div>}
              <button
                type="submit"
                disabled={signingIn || !email.trim() || !password}
                style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 8, padding: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: signingIn || !email.trim() || !password ? 'default' : 'pointer', opacity: signingIn || !email.trim() || !password ? 0.6 : 1 }}
              >
                {signingIn ? 'Signing in…' : 'Sign in (test)'}
              </button>
              <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
                Create this user in Supabase → Authentication → Users → Add user (Auto Confirm ON).
              </div>
            </form>
          ) : status === 'codeSent' || status === 'verifying' ? (
            <form onSubmit={handleVerify}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 16px', textAlign: 'center', marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.accent + '18', border: `1px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: C.accent }}>
                  <Mail size={18} strokeWidth={1.75} />
                </div>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 500, marginBottom: 5 }}>Enter your code</div>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>We emailed a 6-digit code to<br /><span style={{ color: C.whiteDim }}>{email.trim()}</span></div>
              </div>
              <input
                inputMode="numeric"
                autoFocus
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (error) setError(''); }}
                placeholder="123456"
                style={{ width: '100%', boxSizing: 'border-box', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.white, fontSize: 18, letterSpacing: '0.35em', textAlign: 'center', outline: 'none', fontFamily: 'inherit', marginBottom: 10 }}
              />
              {error && <div style={{ color: '#f87171', fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>{error}</div>}
              <button
                type="submit"
                disabled={status === 'verifying' || code.length < 6}
                style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 8, padding: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: status === 'verifying' || code.length < 6 ? 'default' : 'pointer', opacity: status === 'verifying' || code.length < 6 ? 0.6 : 1 }}
              >
                {status === 'verifying' ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button
                type="button"
                onClick={() => { setStatus('idle'); setCode(''); setError(''); }}
                style={{ width: '100%', background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', marginTop: 10, padding: 0 }}
              >
                Use a different email
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendCode}>
              <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                Sign in with an emailed code to sync your tabs across devices.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', marginBottom: 10 }}>
                <Mail size={13} color={C.muted} strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{ background: 'none', border: 'none', outline: 'none', color: C.white, fontSize: 13, flex: 1, fontFamily: 'inherit' }}
                />
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>{error}</div>}
              <button
                type="submit"
                disabled={status === 'sending' || !email.trim()}
                style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 8, padding: 11, color: '#fff', fontSize: 13, fontWeight: 600, cursor: status === 'sending' || !email.trim() ? 'default' : 'pointer', opacity: status === 'sending' || !email.trim() ? 0.6 : 1 }}
              >
                {status === 'sending' ? 'Sending…' : 'Email me a code'}
              </button>
            </form>
          )}
        </div>

        {/* Plan section */}
        <div>
          <div style={{ color: C.whiteDim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Plan</div>
          <div style={{ background: C.surface, border: `1px solid ${isPro ? C.accent + '40' : C.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isPro && <Sparkles size={14} color={C.accent} strokeWidth={1.75} />}
                <span style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{isPro ? 'Tab Graveyard Pro' : 'Free plan'}</span>
              </div>
              <span style={{ color: isPro ? C.accent : C.muted, fontSize: 11, fontWeight: 500 }}>{isPro ? 'Active' : 'Current'}</span>
            </div>
            <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
              {isPro
                ? 'Unlimited history, multi-device sync, and AI search are enabled.'
                : '30 days of local history on this device, with keyword search.'}
            </div>
            {!isPro && (
              <button
                onClick={onUpgrade}
                style={{ width: '100%', marginTop: 12, background: C.accent, border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Dev/test-only Pro toggle — gated by VITE_DEV_MODE, hidden in production */}
          {DEV_MODE && user && (
            <div style={{ marginTop: 10, background: 'transparent', border: `1px dashed ${C.borderLight}`, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.whiteDim, fontSize: 11, marginBottom: 8 }}>
                <FlaskConical size={12} strokeWidth={1.75} /> Test mode — no payment
              </div>
              <button
                onClick={handleTogglePro}
                disabled={proBusy}
                style={{ width: '100%', background: 'none', border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '8px 0', color: C.white, fontSize: 12, fontWeight: 500, cursor: proBusy ? 'default' : 'pointer', opacity: proBusy ? 0.6 : 1 }}
              >
                {proBusy ? 'Updating…' : isPro ? 'Deactivate Pro (test)' : 'Activate Pro (test)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TabGraveyardApp() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [query, setQuery] = useState('');
  const [showPro, setShowPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [aiMode, setAiMode] = useState(false);
  const [aiSemanticResults, setAiSemanticResults] = useState<Tab[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreparing, setAiPreparing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [modelReady, setModelReady] = useState(true); // assume cached; corrected on mount
  const auth = useAuth();

  const isPro = Boolean(auth.user?.is_pro);

  // Has the AI model already been downloaded+cached on this device before?
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('aiModelReady').then((r: any) => setModelReady(Boolean(r.aiModelReady)));
    }
  }, []);

  // Free users (or signed-out) can never be in AI mode.
  useEffect(() => {
    if (!isPro && aiMode) setAiMode(false);
  }, [isPro, aiMode]);

  // When AI search is turned on, make sure every synced tab has an embedding
  // (fills in older rows that were synced before they had one).
  useEffect(() => {
    if (!aiMode || !auth.user?.is_pro) return;
    let cancelled = false;
    setAiPreparing(true);
    setAiError('');
    backfillEmbeddings(auth.user.id)
      .then((res) => {
        if (cancelled) return;
        if (res && 'error' in res && res.error) {
          setAiError(`Database error: ${res.error.message ?? res.error}`);
        } else if (res && 'filled' in res) {
          console.log(`[TabGraveyard] backfilled embeddings for ${res.filled} tab(s)`);
        }
      })
      .catch((e) => {
        console.error('Backfill failed:', e);
        if (!cancelled) setAiError(`AI model failed to load: ${e?.message ?? e}. See console (right-click panel → Inspect).`);
      })
      .finally(() => { if (!cancelled) { setAiPreparing(false); setModelReady(true); } });
    return () => { cancelled = true; };
  }, [aiMode, auth.user?.id, auth.user?.is_pro]);

  // Debounced semantic search: embed the query locally, then ask pgvector.
  // The keyword half of hybrid search is computed synchronously in `aiResults`.
  useEffect(() => {
    if (!aiMode || !isPro) return;
    const q = query.trim();
    if (!q) { setAiSemanticResults([]); setAiLoading(false); return; }
    let cancelled = false;
    setAiLoading(true);
    setAiError('');
    const handle = setTimeout(async () => {
      try {
        // Adaptive threshold: if keyword search already matched something, keep
        // semantic strict (only add strongly-related). If keyword found nothing,
        // loosen it so conceptual queries ("job platform" → naukri) still surface.
        const ql = q.toLowerCase();
        const hasKeyword = tabs.some(
          t => t.title.toLowerCase().includes(ql) || t.domain.toLowerCase().includes(ql),
        );
        const matchThreshold = hasKeyword ? 0.35 : 0.12;
        const results = await semanticSearch(q, { matchThreshold, matchCount: 10 });
        if (!cancelled) setAiSemanticResults(results);
      } catch (e: any) {
        console.error('AI search failed:', e);
        if (!cancelled) { setAiSemanticResults([]); setAiError(`Search failed: ${e?.message ?? e}`); }
      }
      if (!cancelled) setAiLoading(false);
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query, aiMode, isPro, tabs]);

  // Hybrid results: exact keyword matches (from local tabs) first, then any
  // AI/semantic matches not already covered. Deduped by URL. Keeping keyword
  // matches local means their restore/delete still use the local tab id.
  const aiResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const keywordMatches = tabs.filter(
      t => t.title.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q),
    );
    const seen = new Set<string>();
    const merged: Tab[] = [];
    for (const t of keywordMatches) {
      if (!seen.has(t.url)) { seen.add(t.url); merged.push(t); }
    }
    for (const s of aiSemanticResults) {
      if (!seen.has(s.url)) { seen.add(s.url); merged.push(s); }
    }
    return merged;
  }, [query, tabs, aiSemanticResults]);

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

  // Pro sync: push closed tabs to Supabase whenever the list changes for a
  // signed-in Pro user. Dedupe is handled inside syncClosedTabs.
  useEffect(() => {
    if (!auth.user?.is_pro || tabs.length === 0) return;
    syncClosedTabs(auth.user.id, tabs).then((res) => {
      if (res?.error) console.error('Tab sync failed:', res.error);
      else if (res?.synced) console.log(`Synced ${res.synced} tab(s) to Supabase`);
    });
  }, [tabs, auth.user?.id, auth.user?.is_pro]);

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

  if (view === 'settings') {
    return (
      <SettingsScreen
        auth={auth}
        onBack={() => setView('main')}
        onUpgrade={() => { setView('main'); setShowPro(true); }}
      />
    );
  }

  return (
    <div style={{ ...popupStyle, position: 'relative' }}>
      <TopBar onOpenSettings={() => setView('settings')} />

      {/* Search bar */}
      <div style={{ padding: '0 12px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${aiMode ? C.accent + '70' : query ? C.borderLight : C.border}`, borderRadius: 8, padding: '8px 12px' }}>
          <Search size={13} color={aiMode ? C.accent : query ? C.whiteDim : C.muted} strokeWidth={2} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={aiMode ? 'Search by meaning…' : 'Search your closed tabs...'}
            style={{ background: 'none', border: 'none', outline: 'none', color: C.white, fontSize: 13, flex: 1, fontFamily: 'inherit' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, fontSize: 11 }}>esc</button>
          )}
          {isPro && (
            <button
              onClick={() => setAiMode(m => !m)}
              title={aiMode ? 'AI search on — click for keyword search' : 'Switch to AI search'}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: aiMode ? C.accent : 'none', border: aiMode ? 'none' : `1px solid ${C.borderLight}`, borderRadius: 6, padding: '3px 7px', color: aiMode ? '#fff' : C.muted, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}
            >
              <Sparkles size={11} strokeWidth={2} /> AI
            </button>
          )}
        </div>
      </div>

      {/* Results count when searching */}
      {query && !aiMode && (
        <div style={{ padding: '0 16px 6px' }}>
          <span style={{ color: C.muted, fontSize: 11 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      {aiMode && (
        <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={11} color={aiError ? '#f87171' : C.accent} strokeWidth={2} />
          <span style={{ color: aiError ? '#f87171' : C.muted, fontSize: 11, lineHeight: 1.4 }}>
            {aiError
              ? aiError
              : aiPreparing ? (modelReady ? 'Preparing AI search…' : 'Downloading AI model (one-time, ~25 MB)…') : aiLoading ? 'Searching by meaning…' : query ? `${aiResults.length} match${aiResults.length !== 1 ? 'es' : ''}` : 'AI search — type to find tabs by meaning'}
          </span>
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
        ) : aiMode ? (
          // Show the model-download/prepare screen only when we have nothing to show yet.
          (aiPreparing && aiResults.length === 0) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', padding: '0 24px', textAlign: 'center' }}>
              <span style={{ color: C.muted, fontSize: 13 }}>{modelReady ? 'Preparing AI search…' : 'Downloading AI model (one-time, ~25 MB)… this only happens once'}</span>
            </div>
          ) : !query ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10, padding: '0 32px', textAlign: 'center' }}>
              <Sparkles size={30} color={C.border} strokeWidth={1.25} />
              <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.65 }}>Describe what you're looking for — e.g. "that article about saving money"</div>
            </div>
          ) : aiResults.length > 0 ? (
            aiResults.map((tab, i) => (
              <React.Fragment key={`${tab.id}-${tab.url}`}>
                <TabRow tab={tab} query={query} onRestore={handleRestore} onDelete={handleDelete} />
                {i < aiResults.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (aiLoading || aiPreparing) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Thinking…</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10 }}>
              <div style={{ color: C.muted, fontSize: 13 }}>No tabs found for "{query}"</div>
            </div>
          )
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
        {auth.user?.is_pro ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.accent, fontSize: 11, fontWeight: 600 }}>
            <Sparkles size={12} strokeWidth={1.75} /> Pro
          </span>
        ) : (
          <button
            onClick={() => setShowPro(true)}
            style={{ background: C.accent, border: 'none', borderRadius: 20, padding: '5px 13px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Upgrade to Pro
          </button>
        )}
      </div>

      {showPro && (
        <ProModal
          onClose={() => setShowPro(false)}
          onUpgrade={async () => {
            if (DEV_MODE && auth.user) {
              await auth.setPro(true);
              setShowPro(false);
            } else if (!auth.user) {
              // Not signed in yet — send them to Settings to sign in first.
              setShowPro(false);
              setView('settings');
            }
            // Production (signed in, no dev mode): Stripe checkout goes here later.
          }}
        />
      )}
    </div>
  );
}