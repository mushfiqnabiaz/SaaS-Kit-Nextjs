import { NextResponse } from "next/server";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { UserRecord } from "@/lib/db/interfaces";

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json({ data, error: null, meta: meta ?? {} }, { status });
}

export function apiError(
  error: string | Record<string, unknown>,
  status = 400,
): NextResponse {
  return NextResponse.json({ data: null, error }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return apiError(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return apiError(error.message, 403);
  }
  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode);
  }
  console.error("[api]", error);
  return apiError("Internal server error", 500);
}

export function sanitizeUser(user: UserRecord) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));
  return { page, limit };
}
