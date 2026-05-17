import type { ReactNode } from "react";
import { authMono, authSans } from "@/lib/fonts/auth-fonts";

export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${authSans.variable} ${authMono.variable} font-sans`}>{children}</div>
  );
}
