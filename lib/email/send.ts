import type { ReactElement } from "react";
import { getEmailFrom, getEmailProvider } from "@/lib/email/config";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { sendViaResend } from "@/lib/email/providers/resend";
import { sendViaSmtp } from "@/lib/email/providers/smtp";

interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
}

/** Returns true if the email was sent (or logged in console mode); false on provider failure. */
export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailOptions): Promise<boolean> {
  const provider = getEmailProvider();
  const from = getEmailFrom();

  if (provider === "console") {
    console.info("[email:console]", { from, to, subject });
    return true;
  }

  if (provider === "resend") {
    return sendViaResend({ to, subject, template, from });
  }

  const { html, text } = await renderEmailTemplate(template);
  return sendViaSmtp({ to, subject, html, text });
}
