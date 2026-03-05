"use client";

import { useState, useCallback, useRef } from "react";
import type { DJEvent } from "@/lib/notion";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import EventModal from "./EventModal";
import { ChevronDown, ChevronUp } from "lucide-react";

// モバイル専用: カレンダーパネルの3状態
type CalendarPanelState = "normal" | "minimized" | "full";

// モバイル時のリストセクション高さ（ハンドルバー h-10 = 2.5rem を考慮）
const LIST_HEIGHTS: Record<CalendarPanelState, string> = {
    normal: "h-[45svh]",
    minimized: "h-[calc(100svh-2.5rem)]",   // ハンドルのみ残してリスト全画面
    full: "h-[15svh]",                  // カレンダーを最大化
};

export default function ScheduleView({ events }: { events: DJEvent[] }) {
    const [selectedEvent, setSelectedEvent] = useState<DJEvent | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [language, setLanguage] = useState<"en" | "ja">("ja");

    // モバイル専用パネル状態
    const [panelState, setPanelState] = useState<CalendarPanelState>("normal");
    const touchStartY = useRef(0);

    const handleSelectEvent = useCallback((event: DJEvent) => {
        if (event.date) {
            import("date-fns").then(({ parseISO }) => {
                setCurrentMonth(parseISO(event.date));
            });
        }
        setSelectedEvent(event);
    }, []);

    // ハンドルのタッチ開始: Y座標を記録
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    }, []);

    // ハンドルのタッチ終了: スワイプ方向 or タップで状態遷移
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        const threshold = 30; // px: これ以上動かしたらスワイプと判定

        if (Math.abs(dy) < threshold) {
            // タップ → normal → minimized → full → normal でサイクル
            setPanelState(s => s === "normal" ? "minimized" : s === "minimized" ? "full" : "normal");
        } else if (dy < 0) {
            // 上スワイプ → カレンダーを拡大
            setPanelState(s => s === "minimized" ? "normal" : "full");
        } else {
            // 下スワイプ → カレンダーを縮小
            setPanelState(s => s === "full" ? "normal" : "minimized");
        }
    }, []);

    // タップでの循環切り替え（onClick用）
    const cyclePanel = useCallback(() => {
        setPanelState(s => s === "normal" ? "minimized" : s === "minimized" ? "full" : "normal");
    }, []);

    return (
        <div className="flex flex-col h-svh md:flex-row md:h-screen w-full overflow-hidden transition-colors duration-300">

            {/* ══ 左ペイン：リストビュー ══ */}
            <section
                className={[
                    // モバイル: 状態に応じた高さ + トランジション
                    LIST_HEIGHTS[panelState],
                    "transition-[height] duration-300 ease-in-out",
                    "flex-shrink-0",
                    // デスクトップ: 固定幅・全高（モバイル設定を上書き）
                    "md:h-screen md:w-1/3 lg:w-[400px]",
                    // 共通
                    "w-full flex flex-col overflow-hidden",
                    "border-b md:border-b-0 md:border-r border-[var(--color-border-subtle)]",
                    "bg-[var(--color-surface-panel)] z-10 shadow-2xl relative",
                ].join(" ")}
            >
                {/* ヘッダー */}
                <div className="p-5 md:p-6 pb-2 md:pb-2 flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="flex flex-col tracking-tighter leading-none">
                            <span className="text-3xl md:text-4xl font-black text-gradient mb-1">
                                YusukeUdon
                            </span>
                            <span className="text-xl md:text-2xl font-black text-gradient tracking-tighter uppercase">
                                DJ / LIVE SCHEDULE
                            </span>
                        </h1>

                        {/* 言語トグル */}
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

            {/* ══ ドラッグハンドル ── モバイル専用 ══ */}
            <div
                className="md:hidden w-full flex-shrink-0 h-6 flex items-center justify-center
                           bg-[var(--color-surface-panel)] border-b border-[var(--color-border-subtle)]
                           z-20 cursor-pointer touch-none select-none
                           active:bg-[var(--color-surface-elevated)] transition-colors duration-150"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={cyclePanel}
                aria-label={
                    panelState === "minimized"
                        ? (language === "ja" ? "カレンダーを開く" : "Show Calendar")
                        : panelState === "full"
                            ? (language === "ja" ? "カレンダーを縮小" : "Minimize Calendar")
                            : (language === "ja" ? "カレンダー表示切替" : "Toggle Calendar")
                }
                role="button"
            >
                {/* ビジュアルピル + アイコン */}
                <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]/60">
                    {panelState === "minimized" ? (
                        <>
                            <ChevronDown className="w-3 h-3" />
                            <div className="w-8 h-0.5 rounded-full bg-current" />
                            <ChevronDown className="w-3 h-3" />
                        </>
                    ) : panelState === "full" ? (
                        <>
                            <ChevronUp className="w-3 h-3" />
                            <div className="w-8 h-0.5 rounded-full bg-current" />
                            <ChevronUp className="w-3 h-3" />
                        </>
                    ) : (
                        <div className="flex items-center gap-1">
                            <ChevronUp className="w-2.5 h-2.5" />
                            <div className="w-8 h-0.5 rounded-full bg-current" />
                            <ChevronDown className="w-2.5 h-2.5" />
                        </div>
                    )}
                </div>
            </div>

            {/* ══ 右ペイン：カレンダービュー ══ */}
            <section
                className="w-full flex-1 md:flex-initial md:flex-1 md:h-screen
                           p-3 md:p-6 lg:p-8 overflow-auto
                           bg-[var(--color-surface-base)] relative custom-scrollbar"
            >
                {/* h-full・flexを除去→CalendarViewが自然な高さまで伸び、コンテナの overflow-auto でスクロール */}
                {/* 追記: PC版(md:)では画面高さに追従するようh-full flex flex-colを復活、極端な縮小時のためmin-h-[700px]を設定 */}
                <div className="max-w-6xl mx-auto md:h-full md:flex md:flex-col md:min-h-[700px]">
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

            {/* ══ イベント詳細モーダル ══ */}
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
