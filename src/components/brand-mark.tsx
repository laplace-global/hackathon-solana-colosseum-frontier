import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      src="/Laplace_logo_transparent.png"
      alt="Laplace"
      className={cn('h-8 w-auto', className)}
    />
  );
}
