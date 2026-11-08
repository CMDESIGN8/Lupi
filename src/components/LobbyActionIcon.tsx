type Icon = 'shirt' | 'card' | 'bolt';
export function LobbyActionIcon({ kind }: { kind: Icon }) {
  return <svg className="gh-lobby-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === 'shirt' ? <path d="m8 3-5 3-2 5 5 2v8h12v-8l5-2-2-5-5-3c0 4-8 4-8 0Z"/> : kind === 'card' ? <><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="8" r="2.5"/><path d="M8 16c0-5 8-5 8 0M8 19h8"/></> : <path d="m14 1-11 13h8l-1 9 11-14h-8l1-8Z"/>}
  </svg>;
}
