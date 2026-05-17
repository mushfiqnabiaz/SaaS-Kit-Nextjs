import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-theme flex min-h-screen items-center justify-center text-sm text-[hsl(var(--auth-muted))]">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
