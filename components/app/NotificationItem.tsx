import { formatDistanceToNow } from "date-fns";
import { KeyRound, Shield, UserPlus, Users } from "lucide-react";
import type { MockNotification, NotificationType } from "@/lib/mock/app";
import { cn } from "@/lib/utils";

const config: Record<
  NotificationType,
  { icon: typeof UserPlus; color: string; bg: string }
> = {
  invite_accepted: { icon: UserPlus, color: "text-[#34D399]", bg: "bg-[#34D399]/10" },
  role_changed: { icon: Users, color: "text-[#818CF8]", bg: "bg-[#818CF8]/10" },
  new_device: { icon: Shield, color: "text-[#38BDF8]", bg: "bg-[#38BDF8]/10" },
  password_changed: { icon: KeyRound, color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10" },
};

export function NotificationItem({
  notification,
}: {
  notification: MockNotification;
}) {
  const { icon: Icon, color, bg } = config[notification.type];

  return (
    <li
      className={cn(
        "flex gap-4 rounded-xl border border-[#1E293B] bg-[#111827] p-4",
        !notification.read && "border-[#818CF8]/20",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          bg,
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#E2E8F0]">{notification.message}</p>
        <p className="mt-1 text-xs text-[#64748B]">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.read ? (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#818CF8]" aria-label="Unread" />
      ) : null}
    </li>
  );
}
