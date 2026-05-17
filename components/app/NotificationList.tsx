"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationItem } from "@/components/app/NotificationItem";
import { Button } from "@/components/ui/button";
import type { MockNotification } from "@/lib/mock/app";

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: MockNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (notifications.length === 0) {
    return (
      <section className="rounded-2xl border border-[#1E293B] bg-[#111827] py-16 text-center">
        <Bell className="mx-auto h-10 w-10 text-[#64748B] opacity-50" />
        <p className="mt-4 text-lg font-medium text-[#E2E8F0]">You&apos;re all caught up</p>
        <p className="mt-1 text-sm text-[#64748B]">No notifications right now</p>
      </section>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-4">
      {hasUnread ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#1E293B] text-[#818CF8]"
            onClick={markAllRead}
          >
            Mark all as read
          </Button>
        </div>
      ) : null}
      <ul className="space-y-3">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </ul>
    </div>
  );
}
