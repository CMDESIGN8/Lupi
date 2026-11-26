<<<<<<< HEAD
type Icon = 'shirt' | 'card' | 'bolt' | 'club' | 'ball' | 'pack' | 'trophy' | 'people' | 'chat';
export function LobbyActionIcon({ kind }: { kind: Icon }) {
  return <svg className="gh-lobby-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === 'shirt' ? <path d="m8 3-5 3-2 5 5 2v8h12v-8l5-2-2-5-5-3c0 4-8 4-8 0Z"/> : kind === 'card' ? <><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="8" r="2.5"/><path d="M8 16c0-5 8-5 8 0M8 19h8"/></> : kind === 'club' ? <><path d="M12 2c-3 3-6 3-9 3v8c0 5 9 9 9 9s9-4 9-9V5c-3 0-6 0-9-3Z"/><path d="m12 7 1.4 3 3.3.4-2.4 2.3.6 3.3-2.9-1.6L9.1 16l.6-3.3-2.4-2.3 3.3-.4Z"/></> : kind === 'ball' ? <><circle cx="12" cy="12" r="10"/><path d="m12 7 5 3-2 6H9l-2-6 5-3ZM12 7V2M17 10l4-2M15 16l3 4M9 16l-3 4M7 10 3 8"/></> : kind === 'pack' ? <><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v10h14V12M12 8v14M12 8C3 8 5 0 9 3l3 5ZM12 8c9 0 7-8 3-5l-3 5Z"/></> : kind === 'trophy' ? <><path d="M7 3h10v7a5 5 0 0 1-10 0ZM12 15v5M8 22h8M7 5H3v4a4 4 0 0 0 4 4M17 5h4v4a4 4 0 0 1-4 4"/></> : kind === 'people' ? <><circle cx="8" cy="7" r="4"/><path d="M1 22v-4a7 7 0 0 1 14 0v4M16 3a4 4 0 0 1 0 8M18 15a6 6 0 0 1 5 6"/></> : kind === 'chat' ? <><path d="M21 11c0 5-4 8-9 8H7l-5 3 2-6a8 8 0 0 1-2-5c0-5 4-9 10-9s9 4 9 9Z"/><path d="M7 10h.1M12 10h.1M17 10h.1" strokeWidth="3"/></> : <path d="m14 1-11 13h8l-1 9 11-14h-8l1-8Z"/>}
  </svg>;
=======

type Icon =
  | 'shirt'
  | 'card'
  | 'bolt'
  | 'club'
  | 'ball'
  | 'pack'
  | 'trophy'
  | 'people'
  | 'chat';

type LobbyActionIconProps = {
  kind: Icon | Icon[] | string;
};

const validIcons: Icon[] = [
  'shirt',
  'card',
  'bolt',
  'club',
  'ball',
  'pack',
  'trophy',
  'people',
  'chat',
];

function renderIcon(kind: Icon) {
  return (
    <svg
      key={kind}
      className={`gh-lobby-action-icon gh-lobby-action-icon--${kind}`}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'shirt' ? (
        <>
          <path d="M17 7 7 13 3 25l10 4 3-6v17h16V23l3 6 10-4-4-12-10-6c-2 6-12 6-14 0Z" />
          <path d="M17 7c1 7 13 7 14 0" />
          <path d="M18 13h12" opacity=".5" />
          <path d="M20 28h8" opacity=".5" />
        </>
      ) : kind === 'card' ? (
        <>
          <path d="M13 4h22l5 5v29l-5 5H13l-5-5V9l5-5Z" />
          <path d="M13 4v8h22V4" />
          <circle cx="24" cy="21" r="6" />
          <path d="M13 36c1-8 21-8 22 0" />
          <path d="m32 8 3 3" opacity=".6" />
        </>
      ) : kind === 'club' ? (
        <>
          <path d="M24 3 42 10v12c0 11-8 18-18 23C14 40 6 33 6 22V10L24 3Z" />
          <path d="M24 9 36 14v8c0 8-5 13-12 17-7-4-12-9-12-17v-8l12-5Z" opacity=".45" />
          <path d="m24 13 3.4 7 7.6 1.1-5.5 5.4 1.3 7.5-6.8-3.6-6.8 3.6 1.3-7.5-5.5-5.4 7.6-1.1 3.4-7Z" />
        </>
      ) : kind === 'ball' ? (
        <>
          <circle cx="24" cy="24" r="20" />
          <path d="m24 12 10 7-4 12H18l-4-12 10-7Z" />
          <path d="m24 12 0-8M34 19l10-4M30 31l7 11M18 31l-7 11M14 19 4 15" />
          <path d="M4 24h4M40 24h4" opacity=".5" />
        </>
      ) : kind === 'pack' ? (
        <>
          <path d="M5 18h38v9H5z" />
          <path d="M8 27v14h32V27" />
          <path d="M24 18v23" />
          <path d="M24 18C8 18 10 5 17 5c4 0 7 13 7 13Z" />
          <path d="M24 18c16 0 14-13 7-13-4 0-7 13-7 13Z" />
          <path d="M19 32h10" opacity=".5" />
        </>
      ) : kind === 'trophy' ? (
        <>
          <path d="M14 5h20v13a10 10 0 0 1-20 0V5Z" />
          <path d="M14 10H5v6a10 10 0 0 0 11 10M34 10h9v6a10 10 0 0 1-11 10" />
          <path d="M24 28v10M15 43h18M19 38h10" />
          <path d="m24 9 2 5 5 .7-3.6 3.5.9 5-4.3-2.5-4.3 2.5.9-5-3.6-3.5 5-.7 2-5Z" />
        </>
      ) : kind === 'people' ? (
        <>
          <circle cx="18" cy="15" r="7" />
          <path d="M4 41v-5a14 14 0 0 1 28 0v5H4Z" />
          <path d="M32 9a7 7 0 0 1 0 13" />
          <path d="M37 28a12 12 0 0 1 8 11v2H35" />
        </>
      ) : kind === 'chat' ? (
        <>
          <path d="M7 7h34v25H22L10 41v-9H7V7Z" />
          <path d="M15 19h.1M24 19h.1M33 19h.1" strokeWidth="4" />
          <path d="M14 27h20" opacity=".4" />
        </>
      ) : (
        <>
          <path d="m27 3-19 24h14l-2 18L41 18H26l1-15Z" />
          <path d="m27 3-5 24" opacity=".4" />
        </>
      )}
    </svg>
  );
}

export function LobbyActionIcon({ kind }: LobbyActionIconProps) {
  const icons = (
    Array.isArray(kind) ? kind : kind.split(',')
  )
    .map(icon => icon.trim())
    .filter((icon): icon is Icon =>
      validIcons.includes(icon as Icon)
    );

  if (icons.length === 0) return null;

  if (icons.length === 1) {
    return renderIcon(icons[0]);
  }

  return (
    <span className="gh-lobby-action-icons">
      {icons.map((icon, index) => (
        <span key={`${icon}-${index}`}>
          {renderIcon(icon)}
        </span>
      ))}
    </span>
  );
>>>>>>> 5a26a2f4 (version final 1)
}
