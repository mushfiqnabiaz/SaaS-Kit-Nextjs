import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  key: string;
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const ratelimitClients = new Map<string, Ratelimit>();

function getRatelimit(limit: number, window: RateLimitOptions["window"]): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const cacheKey = `${limit}:${window}`;
  let client = ratelimitClients.get(cacheKey);

  if (!client) {
    const redis = new Redis({ url, token });
    client = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: "saas-boilerplate",
    });
    ratelimitClients.set(cacheKey, client);
  }

  return client;
}

function parseWindow(window: RateLimitOptions["window"]): number {
  const [amount, unit] = window.split(" ") as [string, string];
  const n = Number(amount);
  switch (unit) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 3600;
  }
}

export async function rateLimit(
  _req: Request,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const client = getRatelimit(options.limit, options.window);

  if (!client) {
    return {
      success: true,
      remaining: options.limit,
      reset: Date.now() + parseWindow(options.window) * 1000,
    };
  }

  const result = await client.limit(options.key);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
