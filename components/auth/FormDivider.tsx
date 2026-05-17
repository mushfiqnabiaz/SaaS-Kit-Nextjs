interface FormDividerProps {
  label?: string;
}

export function FormDivider({ label = "or continue with email" }: FormDividerProps) {
  return (
    <div className="relative my-6" role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-[hsl(var(--auth-border))]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[hsl(var(--auth-bg))] px-3 text-xs uppercase tracking-wider text-[hsl(var(--auth-muted))]">
          {label}
        </span>
      </div>
    </div>
  );
}
