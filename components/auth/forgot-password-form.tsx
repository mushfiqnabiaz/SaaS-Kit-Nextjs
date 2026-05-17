"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PASSWORD_RESET_TOKEN_EXPIRY_HOURS } from "@/config/constants";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ErrorBanner } from "@/components/auth/ErrorBanner";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

const RESET_STEPS = [
  "Open the email from us (check spam if needed)",
  "Click the secure reset link",
  "Choose a new password and sign in",
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="auth-field-error mt-1.5">{message}</p>;
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setBannerError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const json = (await res.json()) as {
        error?: string | Record<string, string[]>;
      };
      setBannerError(
        typeof json.error === "string"
          ? json.error
          : "Could not send reset email. Please try again.",
      );
      return;
    }

    setSubmittedEmail(values.email);
    setSent(true);
  }

  function handleSendAgain() {
    setSent(false);
    setBannerError(null);
    reset({ email: submittedEmail });
  }

  const expiryLabel =
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS === 1
      ? "1 hour"
      : `${PASSWORD_RESET_TOKEN_EXPIRY_HOURS} hours`;

  return (
    <AuthLayout
      title={sent ? "Check your inbox" : "Forgot password?"}
      subtitle={
        sent
          ? `If an account exists for ${submittedEmail}, you'll receive a reset link shortly.`
          : "No worries — we'll email you a secure link to get back in."
      }
    >
      {!sent ? (
        <>
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-3xl bg-[hsl(var(--auth-accent)/0.12)] blur-2xl"
              />
              <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-[hsl(var(--auth-accent)/0.35)] bg-gradient-to-br from-[hsl(var(--auth-accent)/0.14)] to-[hsl(var(--auth-surface-elevated))] shadow-[0_0_40px_-8px_hsl(var(--auth-accent)/0.45)]">
                <Mail
                  className="h-8 w-8 text-[hsl(var(--auth-accent))]"
                  strokeWidth={1.75}
                />
              </div>
            </div>
          </div>

          {bannerError ? (
            <ErrorBanner
              message={bannerError}
              onDismiss={() => setBannerError(null)}
            />
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="auth-label">
                Work email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="auth-input mt-1.5"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <button type="submit" className="auth-submit group" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Sending link…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-[hsl(var(--auth-border))] bg-[hsl(var(--auth-surface-elevated)/0.6)] px-3.5 py-3">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--auth-accent))]"
              aria-hidden
            />
            <p className="text-xs leading-relaxed text-[hsl(var(--auth-muted))]">
              For your security, reset links expire after {expiryLabel}. We never
              share your password by email.
            </p>
          </div>

          <Link
            href="/login"
            className="auth-link mt-8 inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to sign in
          </Link>
        </>
      ) : (
        <div className="auth-fade-up space-y-8">
          <div className="flex justify-center">
            <div className="auth-success-ring flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/35 bg-emerald-500/10">
              <Check
                className="h-9 w-9 text-emerald-400"
                strokeWidth={2.5}
                aria-hidden
              />
            </div>
          </div>

          <ol className="space-y-0 overflow-hidden rounded-xl border border-[hsl(var(--auth-border))] bg-[hsl(var(--auth-surface-elevated)/0.5)]">
            {RESET_STEPS.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 border-b border-[hsl(var(--auth-border))] px-4 py-3.5 last:border-b-0"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--auth-accent)/0.15)] font-mono text-xs font-semibold text-[hsl(var(--auth-accent))]">
                  {index + 1}
                </span>
                <span className="text-sm leading-snug text-[hsl(var(--auth-fg)/0.88)]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSendAgain}
              className="auth-btn-secondary"
            >
              Send again
            </button>
            <Link href="/login" className="auth-submit text-center no-underline">
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
