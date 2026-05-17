"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { ROLES } from "@/config/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUserSchema, type InviteUserInput } from "@/lib/validations/user";

export function InviteUserForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: ROLES.USER },
  });

  async function onSubmit(values: InviteUserInput) {
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError("root", { message: typeof json.error === "string" ? json.error : "Invite failed" });
      return;
    }

    router.push("/company/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-md space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="colleague@company.com" {...register("email")} />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          {...register("role")}
        >
          <option value={ROLES.USER}>User</option>
          <option value={ROLES.COMPANY_ADMIN}>Company Admin</option>
        </select>
        {errors.role ? <p className="text-xs text-destructive">{errors.role.message}</p> : null}
      </div>

      {errors.root ? <p className="text-sm text-destructive">{errors.root.message}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending invite...
          </>
        ) : (
          "Send invitation"
        )}
      </Button>
    </form>
  );
}
