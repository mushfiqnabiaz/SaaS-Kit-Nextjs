"use client";

import type { PermissionKey } from "@/config/roles";
import { PERMISSION_GROUPS } from "@/lib/company/rolePermissions";
import { cn } from "@/lib/utils";

interface PermissionPickerProps {
  selected: PermissionKey[];
  onChange: (permissions: PermissionKey[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({ selected, onChange, disabled }: PermissionPickerProps) {
  function toggle(key: PermissionKey) {
    if (disabled) return;
    if (selected.includes(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(PERMISSION_GROUPS).map(([group, items]) => (
        <div key={group} className="rounded-lg border border-[#30363D] bg-[#0D1117] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6E7681]">
            {group}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map(({ key, label }) => {
              const checked = selected.includes(key);
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    checked
                      ? "border-[#6366F1]/50 bg-[#6366F1]/10 text-[#C7D2FE]"
                      : "border-[#30363D] text-[#8B949E] hover:border-[#6366F1]/30",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-[#6366F1]"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(key)}
                  />
                  <span>{label}</span>
                  <span className="ml-auto font-mono text-[10px] text-[#6E7681]">{key}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
