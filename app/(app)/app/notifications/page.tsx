import { NotificationList } from "@/components/app/NotificationList";
import { getMockNotifications } from "@/lib/mock/app";

export default function NotificationsPage() {
  const notifications = getMockNotifications();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-sm text-[#64748B]">Stay up to date with your account activity</p>
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
