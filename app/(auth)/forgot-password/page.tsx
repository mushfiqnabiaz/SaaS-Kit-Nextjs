import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-theme flex min-h-screen items-center justify-center text-sm text-[hsl(var(--auth-muted))]">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
