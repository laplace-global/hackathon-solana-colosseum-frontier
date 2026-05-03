import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  textClassName?: string;
}

export function BrandMark({ className, textClassName }: BrandMarkProps) {
  return (
    <div
      className={cn(
        'inline-flex h-7 items-center gap-1.5 bg-black px-4 text-[13px] font-light normal-case tracking-normal text-white',
        className
      )}
    >
      <span className={cn('font-serif leading-none', textClassName)}>Laplace</span>
      <span aria-hidden="true" className="mt-[-7px] h-1 w-1 bg-primary" />
    </div>
  );
}
