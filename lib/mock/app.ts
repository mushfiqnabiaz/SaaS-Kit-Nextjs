/** Mock notifications for user workspace — replace with real notifications service in production. */

export type NotificationType =
  | "invite_accepted"
  | "role_changed"
  | "new_device"
  | "password_changed";

export interface MockNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
}

export function getMockNotifications(): MockNotification[] {
  const now = Date.now();
  const hours = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "n1",
      type: "new_device",
      message: "New sign-in from Chrome on macOS",
      createdAt: hours(2),
      read: false,
    },
    {
      id: "n2",
      type: "password_changed",
      message: "Your password was updated successfully",
      createdAt: hours(26),
      read: false,
    },
    {
      id: "n3",
      type: "role_changed",
      message: "Your role was set to Member",
      createdAt: hours(72),
      read: true,
    },
    {
      id: "n4",
      type: "invite_accepted",
      message: "You joined the workspace",
      createdAt: hours(168),
      read: true,
    },
  ];
}
