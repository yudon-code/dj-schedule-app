"use client";

import { useState } from "react";
import { DJEvent } from "@/lib/notion";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO,
    isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import * as holidayJp from "@holiday-jp/holiday_jp";
import { useMemo, memo } from "react";

const CalendarView = memo(function CalendarView({
    events,
    onSelectEvent,
    currentMonth,
    setCurrentMonth,
    language,
    setLanguage,
}: {
    events: DJEvent[];
    onSelectEvent: (event: DJEvent) => void;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    language: "en" | "ja";
    setLanguage: (lang: "en" | "ja") => void;
}) {

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // カレンダーの日付グリッドを生成
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜始まり
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = "d";
    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = language === "ja"
        ? ["日", "月", "火", "水", "木", "金", "土"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // パフォーマンス最適化: 祝日計算のメモ化
    const holidaysMap = useMemo(() => {
        const hMap: Record<string, { isHoliday: boolean; name: string }> = {};
        const holidays = holidayJp.between(startDate, endDate);
        holidays.forEach(h => {
            hMap[format(h.date, "yyyy-MM-dd")] = { isHoliday: true, name: h.name };
        });
        return hMap;
    }, [startDate, endDate]);

    // パフォーマンス最適化: イベントのグルーピング
    const eventsByDate = useMemo(() => {
        const eMap: Record<string, DJEvent[]> = {};
        events.forEach(e => {
            if (e.date) {
                if (!eMap[e.date]) eMap[e.date] = [];
                eMap[e.date].push(e);
            }
        });
        return eMap;
    }, [events]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* カレンダーヘッダー */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 px-2 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] w-[200px] leading-[1.1]">
                        <span className="block text-xl md:text-2xl font-bold">
                            {language === "ja" ? format(currentMonth, "M月") : format(currentMonth, "MMMM")}
                        </span>
                        <span className="block text-xs md:text-sm font-medium opacity-60">
                            {language === "ja" ? format(currentMonth, "yyyy年") : format(currentMonth, "yyyy")}
                        </span>
                    </h2>

                    {/* 操作ボタン群 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-full hover:bg-[var(--color-surface-hover)] transition-colors border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentMonth(new Date())}
                            className="px-3 py-1.5 rounded-full hover:bg-[var(--color-surface-hover)] transition-colors border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white font-semibold text-xs uppercase tracking-wider"
                        >
                            {language === "ja" ? "今月" : "Today"}
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-full hover:bg-[var(--color-surface-hover)] transition-colors border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 言語トグル除去済み (ScheduleViewへ移動) */}
            </header>

            {/* カレンダー本体 - スマホ版で最小高さを確保 / PC版でも垂直崩れ防止の最小高さを設定 */}
            <div className="flex-1 glass rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden flex flex-col shadow-2xl min-h-[500px] md:min-h-[720px]">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-panel)]/50">
                    {weekDays.map((day, i) => (
                        <div
                            key={day}
                            className={`p-2 text-center text-[10px] font-bold uppercase tracking-wider ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-[var(--color-text-tertiary)]"
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日付グリッド */}
                <div className="flex-1 grid grid-cols-7 grid-rows-auto">
                    {days.map((day, i) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDate[dayStr] || [];
                        const holiday = holidaysMap[dayStr] || null;

                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`min-h-[85px] md:min-h-[100px] min-w-[100px] md:min-w-[120px] border-b border-r border-[var(--color-border-subtle)]/30 p-1 relative transition-colors ${!isCurrentMonth ? "bg-black/20 opacity-40" : holiday?.isHoliday || i % 7 === 0 ? "bg-red-500/[0.03] hover:bg-red-500/[0.06]" : i % 7 === 6 ? "bg-blue-500/[0.03] hover:bg-blue-500/[0.06]" : "hover:bg-white/[0.02]"
                                    } ${i % 7 === 6 ? "border-r-0" : ""}`}
                            >
                                {/* 日付番号と祝日名 */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={`text-sm w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${isTodayDate
                                            ? "bg-[var(--color-brand-primary)] text-white font-bold shadow-lg shadow-blue-500/50"
                                            : i % 7 === 0 || holiday?.isHoliday
                                                ? "text-red-400 font-semibold"
                                                : i % 7 === 6
                                                    ? "text-blue-400 font-semibold"
                                                    : "text-[var(--color-text-secondary)]"
                                            }`}
                                    >
                                        {format(day, dateFormat)}
                                    </span>
                                    {holiday?.isHoliday && (
                                        <span className="text-[10px] text-red-400 font-bold truncate">
                                            {holiday.name}
                                        </span>
                                    )}
                                </div>

                                {/* イベント表示 */}
                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-32px)] custom-scrollbar">
                                    {dayEvents.map((event) => {
                                        const isTBA = event.status === "公開(TBA)";
                                        const isCanceled = event.status === "中止";
                                        const isPostponed = event.status === "延期";
                                        const hasWarning = isCanceled || isPostponed;

                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() => onSelectEvent(event)}
                                                className={`group relative w-full text-left rounded overflow-hidden ${hasWarning ? "opacity-50 grayscale" : ""}`}
                                            >
                                                {isTBA ? (
                                                    <div className="bg-black/40 border border-white/5 text-[var(--color-text-tertiary)] text-[10px] p-1 rounded text-center truncate italic group-hover:border-white/20 transition-colors">
                                                        TBA
                                                    </div>
                                                ) : (
                                                    <>
                                                        {event.flyerUrls?.length > 0 ? (
                                                            <div className="relative w-full aspect-square rounded overflow-hidden bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] group-hover:border-[var(--color-brand-primary)]/50 transition-colors">
                                                                <Image
                                                                    src={event.flyerUrls[0]}
                                                                    alt={event.title}
                                                                    fill
                                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    sizes="(max-width: 768px) 100vw, 15vw"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                                                    <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full shadow-sm">
                                                                        {event.title}
                                                                    </span>
                                                                </div>
                                                                {hasWarning && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                                                        <span className="text-white font-bold text-xs px-2 py-0.5 border border-white/30 rounded bg-red-500/80">
                                                                            {isCanceled ? "中止" : "延期"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-[var(--color-brand-accent)]/20 hover:bg-[var(--color-brand-accent)]/40 border border-[var(--color-brand-accent)]/30 text-[var(--color-brand-accent)] text-xs p-1.5 rounded truncate transition-colors relative">
                                                                <span className="font-semibold block truncate">{event.title}</span>
                                                                {event.time && <span className="text-[10px] opacity-80 block truncate">{event.time}</span>}
                                                                {hasWarning && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                                                        <span className="text-white font-bold text-[10px] px-1 rounded bg-red-500/80">
                                                                            {isCanceled ? "中止" : "延期"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default CalendarView;
