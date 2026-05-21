export default function LogoMark({ size = 36 }) {
  const c = '#C9952A';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="9" fill={c} fillOpacity="0.14"/>
      <rect x="7.5" y="14.5" width="21" height="16" rx="3" stroke={c} strokeWidth="2"/>
      <path d="M13 14.5C13 11 23 11 23 14.5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="20.5" r="1.8" fill={c}/>
      <circle cx="13.5" cy="25" r="1.4" fill={c} fillOpacity="0.8"/>
      <circle cx="22.5" cy="25" r="1.4" fill={c} fillOpacity="0.8"/>
      <line x1="18" y1="20.5" x2="13.5" y2="25" stroke={c} strokeWidth="1.2" strokeOpacity="0.55"/>
      <line x1="18" y1="20.5" x2="22.5" y2="25" stroke={c} strokeWidth="1.2" strokeOpacity="0.55"/>
    </svg>
  );
}
