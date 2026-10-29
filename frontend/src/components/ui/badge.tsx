import { cn } from '@/lib/utils';

export default function Badge({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
        className ?? 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}
