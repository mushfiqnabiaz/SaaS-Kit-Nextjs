import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-theme flex min-h-screen items-center justify-center text-sm text-[hsl(var(--auth-muted))]">
          Loading...
        </div>
      }
    >
      <AuthLayout title="Reset password" subtitle="Choose a new password for your account">
        <ResetPasswordForm />
      </AuthLayout>
    </Suspense>
  );
}
