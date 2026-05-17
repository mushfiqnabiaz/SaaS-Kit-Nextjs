"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const LABELS: Record<StrengthLevel, string> = {
  0: "Weak",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const SEGMENT_COLORS: Record<StrengthLevel, string> = {
  0: "bg-red-500",
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-emerald-500",
};

function scorePassword(password: string): StrengthLevel {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score += 1;

  return score as StrengthLevel;
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = useMemo(() => scorePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {([0, 1, 2, 3] as const).map((index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              index < level
                ? SEGMENT_COLORS[level]
                : "bg-[hsl(var(--auth-border))]",
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs font-medium",
          level <= 1 && "text-red-400",
          level === 2 && "text-orange-400",
          level === 3 && "text-yellow-400",
          level === 4 && "text-emerald-400",
        )}
      >
        {LABELS[level]}
      </p>
    </div>
  );
}
