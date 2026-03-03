import { getEvents } from "@/lib/notion";
import ScheduleView from "@/components/ScheduleView";

export const revalidate = 0; // 毎回SSRで最新データを取得（Notion画像URLの期限切れ対策）

export default async function Home() {
  const events = await getEvents();

  return (
    <main>
      <ScheduleView events={events} />
    </main>
  );
}
