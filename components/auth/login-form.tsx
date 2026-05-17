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
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
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

      <p className="mt-8 text-center text-sm text-[hsl(var(--auth-muted))]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="auth-link">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
