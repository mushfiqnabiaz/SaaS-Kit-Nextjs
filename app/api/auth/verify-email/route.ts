import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth/tokens";
import {
  getEmailVerificationRepository,
  getUserRepository,
} from "@/lib/db/factory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", baseUrl));
  }

  const tokenHash = hashToken(token);
  const verificationRepo = getEmailVerificationRepository();
  const record = await verificationRepo.findByTokenHash(tokenHash);

  if (!record) {
    return NextResponse.redirect(new URL("/login?error=invalid_verification", baseUrl));
  }

  const userRepo = getUserRepository();
  const user = await userRepo.findById(record.userId);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_verification", baseUrl));
  }

  await userRepo.update(user.id, { emailVerified: true });
  await verificationRepo.deleteByUserId(user.id);

  return NextResponse.redirect(new URL("/login?verified=1", baseUrl));
}
