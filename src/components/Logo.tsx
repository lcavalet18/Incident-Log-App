import { cn } from '@/lib/utils';

const SIZES = {
  md: { box: 38, radius: 9, glyph: 28, glyphOffset: -4 },
  lg: { box: 64, radius: 15, glyph: 47, glyphOffset: -7 },
} as const;

export function Logo({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center bg-brand-600 shadow-[0_2px_6px_rgba(193,44,104,.35)]')}
      style={{ width: s.box, height: s.box, borderRadius: s.radius }}
      aria-hidden="true"
    >
      <span
        className="font-script leading-none text-white"
        style={{ fontSize: s.glyph, marginTop: s.glyphOffset }}
      >
        a
      </span>
    </span>
  );
}
