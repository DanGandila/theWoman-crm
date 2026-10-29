import type { ReactNode } from 'react';

export const inputClass =
  'w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50';

export const inputDisabledClass =
  'w-full px-3 py-2 border rounded-md text-sm bg-muted text-muted-foreground cursor-not-allowed';

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-muted-foreground text-xs mt-1">{hint}</p>}
    </div>
  );
}
