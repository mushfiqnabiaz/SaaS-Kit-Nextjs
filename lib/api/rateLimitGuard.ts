import { NextResponse } from "next/server";
import {
  getClientIp,
  rateLimit,
  rateLimitHeaders,
  type RateLimitOptions,
} from "@/lib/middleware/rateLimit";

export async function enforceRateLimit(
  req: Request,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const result = await rateLimit(req, options);

  if (!result.success) {
    return NextResponse.json(
      { data: null, error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(result) },
    );
  }

  return null;
}

export function rateLimitKeyFromIp(req: Request, suffix: string): string {
  return `${suffix}:${getClientIp(req)}`;
}
