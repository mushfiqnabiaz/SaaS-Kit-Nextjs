"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TeammateCard } from "@/components/app/TeammateCard";
import { Input } from "@/components/ui/input";
import type { TeammatePreview } from "@/lib/data/app";

interface TeamPageClientProps {
  companyName: string;
  members: TeammatePreview[];
  total: number;
  initialSearch: string;
}

export function TeamPageClient({
  companyName,
  members,
  total,
  initialSearch,
}: TeamPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        startTransition(() => router.push(`/app/team?${params.toString()}`));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchParams, router]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#F8FAFC]">
          Your team at {companyName}
        </h2>
        <span className="mt-2 inline-block rounded-lg bg-[#818CF8]/15 px-2.5 py-0.5 text-xs font-medium text-[#A5B4FC]">
          {total} members
        </span>
      </div>

      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm border-[#1E293B] bg-[#111827]"
      />

      <div className={pending ? "opacity-60" : undefined}>
        {members.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#64748B]">No teammates found</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <TeammateCard
                key={m.id}
                name={m.name}
                email={m.email}
                role={m.role}
                isAdmin={m.isAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
