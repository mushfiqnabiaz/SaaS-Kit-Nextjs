import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
}

export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV === "development" || !resend) {
    console.info("[email:dev]", { to, subject });
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      subject,
      react: template,
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (error) {
    console.error("[email] Failed to send:", error);
  }
}
