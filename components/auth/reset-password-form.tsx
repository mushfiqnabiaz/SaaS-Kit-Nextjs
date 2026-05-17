"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { resetPasswordSchema } from "@/lib/validations/auth";

type ResetInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl, password: "" },
  });

  async function onSubmit(values: ResetInput) {
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Reset failed");
      return;
    }

    setDone(true);
  }

  if (!tokenFromUrl) {
    return (
      <p className="text-sm text-[hsl(var(--auth-muted))]">
        Invalid reset link.{" "}
        <Link href="/forgot-password" className="auth-link">
          Request a new one
        </Link>
      </p>
    );
  }

  return done ? (
    <p className="text-sm text-[hsl(var(--auth-muted))]">
      Password reset complete.{" "}
      <Link href="/login" className="auth-link">
        Sign in
      </Link>
    </p>
  ) : (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("token")} value={tokenFromUrl} />
      <div className="space-y-2">
        <PasswordInput
          id="password"
          placeholder="New password"
          autoComplete="new-password"
          {...register("password")}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" className="auth-btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Reset password"
        )}
      </Button>
      <Link href="/login" className="auth-link block text-center text-sm">
        Back to sign in
      </Link>
    </form>
  );
}
