"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ErrorBanner } from "@/components/auth/ErrorBanner";
import { FormDivider } from "@/components/auth/FormDivider";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="auth-field-error animate-field-error-in mt-1.5">{message}</p>;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  const prefilledEmail = searchParams.get("email");
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [isInviteFlow, setIsInviteFlow] = useState(Boolean(inviteToken));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: prefilledEmail ?? "",
      password: "",
      companyName: "",
      terms: false,
    },
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValue("email", prefilledEmail);
    }
    if (inviteToken) {
      setIsInviteFlow(true);
    }
  }, [prefilledEmail, inviteToken, setValue]);

  const passwordValue = watch("password");

  async function onSubmit(values: RegisterInput) {
    setBannerError(null);

    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      companyName:
        !isInviteFlow && values.companyName?.trim() ? values.companyName.trim() : undefined,
      inviteToken: inviteToken ?? undefined,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as {
      error?: string | Record<string, string[]>;
      data?: { verificationEmailSent?: boolean };
    };

    if (!res.ok) {
      setBannerError(
        typeof json.error === "string"
          ? json.error
          : "Registration failed. Please check your details and try again.",
      );
      return;
    }

    if (json.data?.verificationEmailSent) {
      router.push(
        `/login?email=${encodeURIComponent(values.email)}&check_email=1`,
      );
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/app/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setOauthLoading(true);
    setBannerError(null);
    await signIn("google", { callbackUrl: "/app/dashboard" });
  }

  return (
      <AuthLayout
        title={isInviteFlow ? "Accept your invitation" : "Create your account"}
        subtitle={
          isInviteFlow ? "Complete your account to join the team" : "Start building in minutes"
        }
      >
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
          <label htmlFor="name" className="auth-label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            className="auth-input mt-1.5"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

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
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="mt-1.5"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <PasswordStrength password={passwordValue ?? ""} />
          <FieldError message={errors.password?.message} />
        </div>

        {!isInviteFlow ? (
          <div>
            <label htmlFor="companyName" className="auth-label">
              Company name{" "}
              <span className="font-normal text-[hsl(var(--auth-muted))]">(optional)</span>
            </label>
            <input
              id="companyName"
              type="text"
              placeholder="Your company (optional)"
              className="auth-input mt-1.5"
              aria-invalid={Boolean(errors.companyName)}
              {...register("companyName")}
            />
            <FieldError message={errors.companyName?.message} />
          </div>
        ) : null}

        <div className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-[hsl(var(--auth-border))] bg-[hsl(var(--auth-surface-elevated))] text-[hsl(var(--auth-accent))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--auth-accent)/0.45)]"
            aria-invalid={Boolean(errors.terms)}
            {...register("terms")}
          />
          <label htmlFor="terms" className="text-sm leading-relaxed text-[hsl(var(--auth-muted))]">
            I agree to the{" "}
            <a href="#" target="_blank" rel="noopener noreferrer" className="auth-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" target="_blank" rel="noopener noreferrer" className="auth-link">
              Privacy Policy
            </a>
          </label>
        </div>
        <FieldError message={errors.terms?.message} />

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[hsl(var(--auth-muted))]">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
