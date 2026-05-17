import { Bell } from "lucide-react";

export function AnnouncementBoard() {
  return (
    <section className="rounded-2xl border border-dashed border-[#1E293B] bg-[#111827]/50 p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#818CF8]/10 text-[#818CF8]">
        <Bell className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-medium text-[#E2E8F0]">No announcements yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#64748B]">
        Your company admin can post updates here. Check back later for news and team updates.
      </p>
    </section>
  );
}
