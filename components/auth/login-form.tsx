"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { ROLES, type Role } from "@/config/roles";
import { getDashboardPath } from "@/lib/auth/session";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ErrorBanner } from "@/components/auth/ErrorBanner";
import { FormDivider } from "@/components/auth/FormDivider";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="auth-field-error animate-field-error-in mt-1.5">{message}</p>;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const inviteToken = searchParams.get("invite");
  const emailParam = searchParams.get("email");
  const verified = searchParams.get("verified") === "1";
  const checkEmail = searchParams.get("check_email") === "1";
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState(emailParam ?? "");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailParam ?? "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setBannerError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setBannerError("Invalid email or password. Please try again.");
      return;
    }

    if (inviteToken) {
      const acceptRes = await fetch("/api/users/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      });
      const acceptJson = (await acceptRes.json()) as { error?: string };
      if (!acceptRes.ok) {
        setBannerError(
          typeof acceptJson.error === "string"
            ? acceptJson.error
            : "Could not accept invitation. Try again or contact your admin.",
        );
        return;
      }
    }

    const session = await getSession();
    const role = (session?.user?.role as Role | undefined) ?? ROLES.USER;
    const destination =
      callbackUrl && !callbackUrl.startsWith("/login")
        ? callbackUrl
        : getDashboardPath(role);
    router.push(destination);
    router.refresh();
  }

  async function handleGoogle() {
    setOauthLoading(true);
    setBannerError(null);
    await signIn("google", { callbackUrl: callbackUrl ?? "/app/dashboard" });
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        inviteToken
          ? "Sign in to accept your team invitation"
          : "Sign in to your account"
      }
    >
      {verified ? (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Email verified successfully. You can sign in now.
        </p>
      ) : null}
      {checkEmail ? (
        <p className="mb-4 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-2 text-sm text-[#A5B4FC]">
          Check your inbox for a verification link before signing in.
        </p>
      ) : null}
      {inviteToken ? (
        <p className="mb-4 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-2 text-sm text-[#A5B4FC]">
          You have a pending invitation. Sign in with the invited email to join your team.
        </p>
      ) : null}
      {bannerError ? (
        <ErrorBanner message={bannerError} onDismiss={() => setBannerError(null)} />
      ) : null}

      <OAuthButton
        provider="google"
        label="Continue with Google"
        loading={oauthLoading}
        onClick={handleGoogle}
      />

      <FormDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="auth-label">
            Email
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

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <Link href="/forgot-password" className="auth-link text-xs">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1.5"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {checkEmail ? (
      <div className="mt-6 space-y-3 rounded-lg border border-[hsl(var(--auth-border))] p-4">
        <p className="text-xs text-[hsl(var(--auth-muted))]">
          Didn&apos;t receive a verification email?
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="your@email.com"
            className="auth-input flex-1 text-sm"
            readOnly={Boolean(emailParam)}
          />
          <button
            type="button"
            disabled={resending || !resendEmail}
            className="auth-submit shrink-0 px-4 text-sm"
            onClick={async () => {
              setResending(true);
              setResendMessage(null);
              const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resendEmail }),
              });
              setResending(false);
              setResendMessage(
                res.ok
                  ? "If your account is unverified, we sent a new link."
                  : "Could not send verification email.",
              );
            }}
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        </div>
        {resendMessage ? (
          <p className="text-xs text-[hsl(var(--auth-muted))]">{resendMessage}</p>
        ) : null}
      </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-[hsl(var(--auth-muted))]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="auth-link">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
