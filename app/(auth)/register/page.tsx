import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-theme flex min-h-screen items-center justify-center text-sm text-[hsl(var(--auth-muted))]">
          Loading...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
