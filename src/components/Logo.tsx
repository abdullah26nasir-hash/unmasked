// Brand lockup: cobalt mask mark + lowercase wordmark. See docs/BRAND.md.
const MASK = 'M4 18C4 7 18 3 32 7c10 3 19 10 28 10s18-7 28-10c14-4 28 0 28 11 0 26-16 50-38 50-9 0-14-7-18-7s-9 7-18 7C20 68 4 44 4 18Zm18 12c3-7 14-10 22-5 2 5-2 12-10 13-6 1-11-3-12-8Zm76 0c-3-7-14-10-22-5-2 5 2 12 10 13 6 1 11-3 12-8Z';

export function Mark({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
      <path fill="var(--color-tray, #2A3CF2)" fillRule="evenodd" d={MASK} />
    </svg>
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const text = { sm: 'text-[1em]', md: 'text-2xl', lg: 'text-[56px] sm:text-[72px]' }[size];
  const mark = { sm: 'h-[0.8em]', md: 'h-[0.8em]', lg: 'h-[0.78em]' }[size];
  return (
    <span className={`inline-flex items-center gap-[0.18em] font-display font-extrabold lowercase leading-none tracking-[-0.045em] ${text}`}>
      <Mark className={`${mark} w-auto shrink-0`} />
      <span>unmasked</span>
    </span>
  );
}
