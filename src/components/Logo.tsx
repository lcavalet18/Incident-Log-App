import { cn } from '@/lib/utils';

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-tile-sm', glyph: 'text-lg' },
  md: { box: 'h-10 w-10 rounded-tile-sm', glyph: 'text-xl' },
  lg: { box: 'h-24 w-24 rounded-tile', glyph: 'text-5xl' },
} as const;

export function Logo({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-brand-600 text-white',
        s.box
      )}
      aria-hidden="true"
    >
      <span className={cn('font-script leading-none', s.glyph)}>a</span>
    </span>
  );
}
