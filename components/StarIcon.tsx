export default function StarIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true"><path d="M12 1.5C13 9.2 14.8 11 22.5 12 14.8 13 13 14.8 12 22.5 11 14.8 9.2 13 1.5 12 9.2 11 11 9.2 12 1.5Z" fill="currentColor" /></svg>;
}
