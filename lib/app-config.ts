/** Client-safe app branding (use NEXT_PUBLIC_* in .env) */
export const PUBLIC_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SaaSKit";

export function getAppInitial(name: string = PUBLIC_APP_NAME): string {
  return name.trim().charAt(0).toUpperCase() || "S";
}
