export type EmailProvider = "smtp" | "resend" | "console";

export function getEmailProvider(): EmailProvider {
  if (process.env.SMTP_HOST?.trim()) {
    return "smtp";
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return "resend";
  }
  return "console";
}

export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "noreply@localhost"
  );
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user: process.env.SMTP_USER?.trim() || undefined,
    password: process.env.SMTP_PASSWORD?.trim() || undefined,
    from: getEmailFrom(),
  };
}
