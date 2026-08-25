import { PageHeader } from "@/components/dashboard/page-header";
import { AvailabilityCalendar } from "./calendar-client";

export const metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Availability"
        title="Calendar"
        description="Set the days and times Onyx is available. Website visitors can only book open slots, shown in their timezone and stored in South Africa time."
      />
      <AvailabilityCalendar />
    </div>
  );
}
