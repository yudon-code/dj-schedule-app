import { getEvents } from "@/lib/notion";
import ScheduleView from "@/components/ScheduleView";

export const revalidate = 60; // 60秒ごとにISRで更新

export default async function Home() {
  const events = await getEvents();

  return (
    <main>
      <ScheduleView events={events} />
    </main>
  );
}
