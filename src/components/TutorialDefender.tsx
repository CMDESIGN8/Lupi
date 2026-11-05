import { useId } from 'react';
import { AvatarFace } from './AvatarFace';
import { useAvatarAppearance } from '../hooks/useAvatarAppearance';
import './TutorialDefender.css';

/** Practice-only kit: never changes the user's equipped inventory. */
export function TutorialDefender({ userId }: { userId: string }) {
  const kitId = useId();
  const { appearance, loading } = useAvatarAppearance(userId);
  if (loading) return <div className="tutorial-defender" aria-busy="true" />;
  return <div className="tutorial-defender" aria-label="Tu personaje listo para defender">
    <svg viewBox="0 0 200 330" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={kitId} x2="1" y2="1"><stop stopColor="#f3ffff"/><stop offset="1" stopColor="#8fbfc7"/></linearGradient>
      </defs>
      <ellipse cx="100" cy="316" rx="77" ry="8" fill="#00131d" opacity=".4"/>
      <g stroke="#173d4c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {/* Bent legs and planted feet give the same ground line as the rival. */}
        <path d="M76 197 51 245 44 294 66 295 77 253 98 219M113 204 144 246 151 295 173 291 163 238 139 192" fill={appearance.skin}/>
        <path d="m46 271 24 4-5 24-23-3zm102 4 23-5 5 23-24 5z" fill="#e6fcff"/>
        <path d="m43 288 23 3 4 17-12 6-32-1-3-8zm107 4 23-5 11 15 8 6-2 6-36-1z" fill="#073d50"/>
        <path d="m29 306 28 1m105 0 20-2" stroke="#53e8dc" strokeWidth="4"/>
        <path d="m70 174-10 38 29 15 16-29 16 28 29-13-16-40z" fill="#076878"/>
        <path d="m67 207 19 9m41 1 15-6" stroke="#dcffff"/>
        <path d="m67 98-23 10-22 38-12 14 12 11 20-18 24-29m68-28 23 12 22 36 13 13-10 13-23-18-25-29" fill={appearance.skin}/>
        <path d="m72 91-26 12-12 23 25 13 13-18-9 58q37 12 77 0l-9-58 12 18 25-13-14-24-28-11z" fill={`url(#${kitId})`}/>
        <path d="m82 86 18 15 18-15-4-20H86z" fill={appearance.skin}/>
        <path d="m77 92 23 23 24-23M69 134l-4 37m67-37 5 37" fill="none" stroke="#05878d" strokeWidth="5"/>
        <path d="m82 158 18 7 19-7" fill="none" stroke="#b5d9df"/>
      </g>
      <text x="100" y="143" textAnchor="middle" fill="#095966" fontSize="12" fontWeight="900" fontFamily="sans-serif">LUPI</text>
    </svg>
    <div className="tutorial-defender__face"><AvatarFace appearance={{ ...appearance, expression: 'determined' }} /></div>
  </div>;
}
