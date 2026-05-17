"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ROLES } from "@/config/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CompanyRoleOption {
  id: string;
  name: string;
}

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(ROLES.USER);
  const [companyRoleId, setCompanyRoleId] = useState<string>("");
  const [companyRoles, setCompanyRoles] = useState<CompanyRoleOption[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/company/roles")
      .then((res) => res.json())
      .then((json: { data?: CompanyRoleOption[] }) => {
        if (json.data) setCompanyRoles(json.data.map((r) => ({ id: r.id, name: r.name })));
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        role,
        companyRoleId:
          role === ROLES.USER && companyRoleId ? companyRoleId : null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setSubmitting(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Invite failed");
      return;
    }
    setEmail("");
    setCompanyRoleId("");
    setMessage("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#C9D1D9]">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          className="company-input"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[#C9D1D9]">Access level</Label>
        <div className="flex gap-2 rounded-lg border border-[#30363D] p-1">
          {[ROLES.USER, ROLES.COMPANY_ADMIN].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                if (r === ROLES.COMPANY_ADMIN) setCompanyRoleId("");
              }}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                role === r
                  ? "bg-[#6366F1] text-white"
                  : "text-[#8B949E] hover:text-[#C9D1D9]",
              )}
            >
              {r === ROLES.COMPANY_ADMIN ? "Company Admin" : "Team member"}
            </button>
          ))}
        </div>
      </div>

      {role === ROLES.USER && companyRoles.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="companyRole" className="text-[#C9D1D9]">
            Custom role <span className="text-[#6E7681]">(optional)</span>
          </Label>
          <select
            id="companyRole"
            value={companyRoleId}
            onChange={(e) => setCompanyRoleId(e.target.value)}
            className="company-input w-full"
          >
            <option value="">Default member permissions</option>
            {companyRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="message" className="text-[#C9D1D9]">
          Personal message <span className="text-[#6E7681]">(optional)</span>
        </Label>
        <textarea
          id="message"
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="company-input resize-none"
          placeholder="Welcome to the team!"
        />
        <p className="text-right text-[10px] text-[#6E7681]">{message.length}/200</p>
      </div>

      {error ? <p className="text-sm text-[#F87171]">{error}</p> : null}

      <Button type="submit" disabled={submitting} className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send invite"}
      </Button>
    </form>
  );
}
