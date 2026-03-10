"use client";

import { DJEvent } from "@/lib/notion";
import { format, parseISO, isPast, getYear } from "date-fns";
import { MapPin, Calendar as CalendarIcon, Clock, History, CalendarDays, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, memo } from "react";

const ListView = memo(function ListView({
    events,
    onSelectEvent,
    language,
}: {
    events: DJEvent[];
    onSelectEvent: (event: DJEvent) => void;
    language: "en" | "ja";
}) {
    const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");
    const [selectedYear, setSelectedYear] = useState<number | "all">("all");

    // 現在の日時を取得 (比較用)
    const now = new Date();

    // イベントの分類と加工
    const { upcomingEvents, pastEventsByYear, years } = useMemo(() => {
        const upcoming: DJEvent[] = [];
        const past: Record<number, DJEvent[]> = {};
        const yearList = new Set<number>();

        events.forEach(event => {
            const eventDate = event.date ? parseISO(event.date) : new Date();
            if (isPast(eventDate) && format(eventDate, "yyyyMMdd") !== format(now, "yyyyMMdd")) {
                const year = getYear(eventDate);
                if (!past[year]) past[year] = [];
                past[year].push(event);
                yearList.add(year);
            } else {
                upcoming.push(event);
            }
        });

        // 未来: 近い順 (昇順)
        upcoming.sort((a, b) => {
            const da = a.date ? parseISO(a.date).getTime() : 0;
            const db = b.date ? parseISO(b.date).getTime() : 0;
            return da - db;
        });

        // 過去: 新しい順 (降順)
        Object.keys(past).forEach(year => {
            past[Number(year)].sort((a, b) => {
                const da = a.date ? parseISO(a.date).getTime() : 0;
                const db = b.date ? parseISO(b.date).getTime() : 0;
                return db - da;
            });
        });

        return {
            upcomingEvents: upcoming,
            pastEventsByYear: past,
            years: Array.from(yearList).sort((a, b) => b - a)
        };
    }, [events]);

    // 初期化時に最新の年を選択
    useState(() => {
        if (years.length > 0 && selectedYear === "all") {
            setSelectedYear(years[0]);
        }
    });

    const displayEvents = viewMode === "upcoming"
        ? upcomingEvents
        : (selectedYear === "all" ? Object.values(pastEventsByYear).flat().sort((a, b) => {
            const da = a.date ? parseISO(a.date).getTime() : 0;
            const db = b.date ? parseISO(b.date).getTime() : 0;
            return db - da;
        }) : pastEventsByYear[Number(selectedYear)] || []);

    if (events.length === 0) {
        return (
            <div className="text-center py-20 text-[var(--color-text-tertiary)]">
                {language === "ja" ? "イベントが見つかりませんでした" : "No events found."}
            </div>
        );
    }

    // filter upcoming vs past if needed, but for now just list them all
    // let's highlight upcoming ones
    return (
        <div className="flex flex-col gap-2.5">
            {/* 切り替えスイッチとフィルタ */}
            <div className="flex flex-col gap-2 md:gap-2.5">
                <div className="flex bg-[var(--color-surface-elevated)] rounded-xl p-1 border border-[var(--color-border-subtle)] w-full">
                    <button
                        onClick={() => setViewMode("upcoming")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "upcoming" ? "bg-[var(--color-brand-primary)] text-white shadow-lg shadow-blue-500/20" : "text-[var(--color-text-secondary)] hover:text-white"}`}
                    >
                        <CalendarDays className="w-3.5 h-3.5" />
                        {language === "ja" ? "今後の予定" : "Upcoming"}
                    </button>
                    <button
                        onClick={() => {
                            setViewMode("past");
                            if (selectedYear === "all" && years.length > 0) setSelectedYear(years[0]);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "past" ? "bg-[var(--color-brand-primary)] text-white shadow-lg shadow-blue-500/20" : "text-[var(--color-text-secondary)] hover:text-white"}`}
                    >
                        <History className="w-3.5 h-3.5" />
                        {language === "ja" ? "過去の記録" : "Past Events"}
                    </button>
                </div>

                {viewMode === "past" && years.length > 0 && (
                    <div className="relative group">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                            className="w-full bg-[var(--color-surface-panel)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs font-bold py-2.5 pl-4 pr-10 rounded-xl appearance-none cursor-pointer hover:border-[var(--color-brand-primary)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 shadow-sm"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year} {language === "ja" ? "年" : ""}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] pointer-events-none group-hover:text-[var(--color-brand-primary)] transition-colors" />
                    </div>
                )}
            </div>

            {displayEvents.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-text-tertiary)] text-sm italic bg-black/20 rounded-2xl border border-dashed border-[var(--color-border-subtle)]">
                    {language === "ja" ? "該当するイベントはありません" : "No events in this period."}
                </div>
            ) : (
                displayEvents.map((event) => {
                    const eventDate = event.date ? parseISO(event.date) : new Date();
                    const past = isPast(eventDate) && format(eventDate, "yyyyMMdd") !== format(now, "yyyyMMdd");
                    const isTBA = event.status === "公開(TBA)";
                    const isCanceled = event.status === "中止";
                    const isPostponed = event.status === "延期";
                    const hasWarning = isCanceled || isPostponed;

                    const weekDaysJa = ["日", "月", "火", "水", "木", "金", "土"];
                    const dayStr = language === "ja" ? `(${weekDaysJa[eventDate.getDay()]})` : format(eventDate, "EEE");

                    return (
                        <button
                            key={event.id}
                            onClick={() => onSelectEvent(event)}
                            className={`w-full flex items-start text-left py-2 px-3 rounded-xl border transition-all duration-300 ${isTBA ? "border-transparent bg-black/40 hover:bg-white/5" : past
                                ? "border-transparent opacity-75"
                                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-panel)] hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-surface-hover)] shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                                } ${hasWarning ? "grayscale opacity-50" : ""}`}
                        >
                            {/* 日付バッジ (フライヤー統合) */}
                            <div className="flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-[var(--color-surface-panel)] border border-[var(--color-border-subtle)] flex-shrink-0 mr-3 py-1 relative overflow-hidden">
                                {event.flyerUrls?.[0] && !isTBA && (
                                    <>
                                        <Image
                                            src={event.flyerUrls[0]}
                                            alt=""
                                            fill
                                            className="object-cover opacity-60 scale-110"
                                            sizes="64px"
                                            priority={displayEvents.indexOf(event) < 3}
                                        />
                                    </>
                                )}
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <span className="text-xs font-black text-[var(--color-brand-primary)] tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,1)] drop-shadow-[0_0_2px_rgba(0,0,0,1)] drop-shadow-[1px_0_1px_rgba(0,0,0,1)] drop-shadow-[-1px_0_1px_rgba(0,0,0,1)]">
                                        {format(eventDate, language === "ja" ? "M月" : "MMM")}
                                    </span>
                                    <span className="text-xl font-black text-white leading-none mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,1)] drop-shadow-[0_0_4px_rgba(0,0,0,1)] drop-shadow-[1px_1px_1px_rgba(0,0,0,1)] drop-shadow-[-1px_1px_1px_rgba(0,0,0,1)] drop-shadow-[1px_-1px_1px_rgba(0,0,0,1)] drop-shadow-[-1px_-1px_1px_rgba(0,0,0,1)]">
                                        {format(eventDate, "dd")}
                                    </span>
                                    <span className="text-[10px] text-white font-bold mt-1 drop-shadow-[0_1px_1px_rgba(0,0,0,1)] drop-shadow-[0_0_2px_rgba(0,0,0,1)] drop-shadow-[1px_0_1px_rgba(0,0,0,0.8)]">
                                        {dayStr}
                                    </span>
                                </div>
                            </div>

                            {/* イベント情報 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className={`text-sm md:text-base font-bold truncate leading-tight ${isTBA ? "text-[var(--color-text-tertiary)] italic" : "text-[var(--color-text-primary)]"}`}>
                                        {isTBA ? "TBA" : (event.title || "Untitled Event")}
                                        {event.eventSubtext && !isTBA && (
                                            <span className="ml-2 text-[0.9em] text-[#bbbbbb] font-medium">
                                                {event.eventSubtext}
                                            </span>
                                        )}
                                    </h3>
                                    {hasWarning && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                            {isCanceled ? "中止" : "延期"}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    {event.location && !isTBA && (
                                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                            <MapPin className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                                            <span className="text-xs font-medium truncate">{event.location}</span>
                                        </div>
                                    )}
                                    {event.time && !isTBA && (
                                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                            <Clock className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                                            <span className="text-xs font-medium">{event.time}</span>
                                        </div>
                                    )}
                                    {isTBA && event.tbaComment && (
                                        <div className="text-[var(--color-text-tertiary)] italic text-xs mt-0.5 border-l border-[var(--color-border-subtle)] pl-2">
                                            {event.tbaComment}
                                        </div>
                                    )}
                                </div>
                            </div>


                        </button>
                    )
                })
            )}
        </div>
    );
});

export default ListView;
