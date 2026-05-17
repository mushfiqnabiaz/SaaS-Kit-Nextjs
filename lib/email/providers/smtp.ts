import nodemailer, { type Transporter } from "nodemailer";
import { getSmtpConfig } from "@/lib/email/config";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP is not configured (SMTP_HOST missing)");
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.password
        ? { user: config.user, pass: config.password }
        : undefined,
  });

  return transporter;
}

export async function sendViaSmtp(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const config = getSmtpConfig();
  if (!config) return false;

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("[email:smtp] Failed to send:", error);
    return false;
  }
}

/** Verify SMTP connection at startup (optional diagnostic). */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error("[email:smtp] Connection verify failed:", error);
    return false;
  }
}
