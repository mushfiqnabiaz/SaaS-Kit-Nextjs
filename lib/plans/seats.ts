/** Seat limits per plan — replace with billing provider data in production. */
export const PLAN_SEAT_LIMITS: Record<string, number> = {
  free: 10,
  pro: 50,
  enterprise: 999,
};

export function getSeatLimit(plan: string): number {
  return PLAN_SEAT_LIMITS[plan] ?? PLAN_SEAT_LIMITS.free;
}

export const PLAN_DISPLAY: Record<string, { label: string; price: string }> = {
  free: { label: "Free", price: "$0/mo" },
  pro: { label: "Pro", price: "$49/mo" },
  enterprise: { label: "Enterprise", price: "Custom" },
};
