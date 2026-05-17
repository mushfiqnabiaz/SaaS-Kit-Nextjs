import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendViaResend(options: {
  to: string;
  subject: string;
  template: ReactElement;
  from: string;
}): Promise<boolean> {
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      react: options.template,
    });

    if (error) {
      console.error("[email:resend] Error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email:resend] Failed to send:", error);
    return false;
  }
}
