"use client";

import { useState, useCallback } from "react";
import type { DJEvent } from "@/lib/notion";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import EventModal from "./EventModal";

export default function ScheduleView({ events }: { events: DJEvent[] }) {
    const [selectedEvent, setSelectedEvent] = useState<DJEvent | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [language, setLanguage] = useState<"en" | "ja">("en");

    const handleSelectEvent = useCallback((event: DJEvent) => {
        if (event.date) {
            import("date-fns").then(({ parseISO }) => {
                setCurrentMonth(parseISO(event.date));
            });
        }

        // TBAの場合は詳細モーダルを表示しない（カレンダー移動のみ）
        if (event.status !== "公開(TBA)") {
            setSelectedEvent(event);
        }
    }, []);

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden transition-colors duration-300">
            {/* 左ペイン：リストビュー */}
            <section className="w-full md:w-1/3 lg:w-[400px] h-[50vh] md:h-screen flex flex-col border-b md:border-b-0 md:border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-panel)] z-10 shadow-2xl relative">
                <div className="p-5 md:p-6 pb-2 md:pb-2 flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-gradient leading-tight">
                            YusukeUdon <br />
                            DJ / LIVE SCHEDULE
                        </h1>

                        {/* 言語トグルをこちらに移動 */}
                        <div className="flex bg-[var(--color-surface-elevated)] rounded-full p-0.5 border border-[var(--color-border-subtle)] shadow-sm">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${language === "en" ? "bg-[var(--color-brand-primary)] text-white shadow-sm" : "text-[var(--color-text-secondary)] hover:text-white"}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage("ja")}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${language === "ja" ? "bg-[var(--color-brand-primary)] text-white shadow-sm" : "text-[var(--color-text-secondary)] hover:text-white"}`}
                            >
                                JP
                            </button>
                        </div>
                    </div>
                    <p className="text-[var(--color-text-secondary)] text-xs opacity-80">
                        Upcoming events and performances.
                    </p>
                </div>

                {/* リスト領域 */}
                <div className="flex-1 overflow-y-auto px-5 md:px-6 pb-6 pt-0 custom-scrollbar">
                    <ListView events={events} onSelectEvent={handleSelectEvent} language={language} />
                </div>
            </section>

            {/* 右ペイン：カレンダービュー */}
            <section className="w-full md:flex-1 h-auto md:h-screen p-3 md:p-6 lg:p-8 overflow-auto bg-[var(--color-surface-base)] relative custom-scrollbar">
                <div className="max-w-6xl mx-auto h-full flex flex-col md:min-w-[900px] flex-shrink-0">
                    <CalendarView
                        events={events}
                        onSelectEvent={handleSelectEvent}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        language={language}
                        setLanguage={setLanguage}
                    />
                </div>
            </section>

            {/* モーダル表示 */}
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    language={language}
                />
            )}
        </div>
    );
}
