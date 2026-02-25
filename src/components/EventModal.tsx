"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { X, MapPin, Clock, Ticket, ExternalLink, AlignLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { DJEvent } from "@/lib/notion";

export default function EventModal({
    event,
    onClose,
    language,
}: {
    event: DJEvent;
    onClose: () => void;
    language: "en" | "ja";
}) {
    // ESCキーで閉じる
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // 背景スクロールロック
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const eventDate = event.date ? parseISO(event.date) : null;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isEnlarged, setIsEnlarged] = useState(false);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.flyerUrls && event.flyerUrls.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % event.flyerUrls.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.flyerUrls && event.flyerUrls.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + event.flyerUrls.length) % event.flyerUrls.length);
        }
    };

    const hasMultipleImages = event.flyerUrls && event.flyerUrls.length > 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-300">
            {/* オーバーレイ背景 */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* モーダルコンテンツ */}
            <div
                className="relative bg-[var(--color-surface-panel)] border border-[var(--color-border-subtle)] rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col md:flex-row transform transition-all"
                role="dialog"
                aria-modal="true"
            >
                {/* 閉じるボタン (モバイル用に右上に絶対配置) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 左側：フライヤー画像 (モバイル時は上部、1/3サイズに制限) */}
                <div className="w-1/3 aspect-square md:w-1/3 md:aspect-auto md:min-h-[400px] mx-auto mt-6 md:mt-0 relative bg-black flex-shrink-0 group border border-[var(--color-border-subtle)] md:border-r md:border-l-0 rounded-xl md:rounded-none overflow-hidden">
                    {event.flyerUrls && event.flyerUrls.length > 0 ? (
                        <>
                            <Image
                                src={event.flyerUrls[currentImageIndex]}
                                alt={`${event.title} - flyer ${currentImageIndex + 1}`}
                                fill
                                className="object-contain transition-opacity duration-300 cursor-zoom-in hover:scale-[1.02] transition-transform"
                                sizes="33vw"
                                priority
                                onClick={() => setIsEnlarged(true)}
                            />

                            {/* 複数画像用のナビゲーション */}
                            {hasMultipleImages && (
                                <>
                                    {/* 矢印ボタン */}
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {/* ドットインジケーター */}
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                        {event.flyerUrls.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentImageIndex(idx);
                                                }}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? "bg-white scale-110" : "bg-white/40 hover:bg-white/70"}`}
                                                aria-label={`Go to slide ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-secondary)] flex-col gap-4 bg-gradient-to-br from-[var(--color-surface-base)] to-[var(--color-surface-panel)]">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--color-border-subtle)] flex items-center justify-center opacity-50">
                                <span className="text-sm">No Image</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 右側：イベント詳細情報 */}
                <div className="w-full md:flex-1 flex flex-col items-start p-6 md:p-8 overflow-y-auto custom-scrollbar">

                    {/* 日付バッジ */}
                    {eventDate && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-sm font-semibold mb-4 border border-[var(--color-brand-primary)]/20">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                                {language === "ja"
                                    ? format(eventDate, "yyyy年M月d日 (") + ["日", "月", "火", "水", "木", "金", "土"][eventDate.getDay()] + ")"
                                    : format(eventDate, "EEEE, MMMM d, yyyy")}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
                            {event.title}
                        </h2>
                        {event.status === "中止" && (
                            <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-500/20 text-red-500 border border-red-500/30 whitespace-nowrap self-start md:self-auto">
                                中止 (CANCELED)
                            </span>
                        )}
                        {event.status === "延期" && (
                            <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap self-start md:self-auto">
                                延期 (POSTPONED)
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 w-full mb-8">
                        {/* 時間 */}
                        {event.time && (
                            <div className="flex items-start gap-3 text-[var(--color-text-secondary)]">
                                <Clock className="w-5 h-5 mt-0.5 text-[var(--color-text-primary)]" />
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">
                                        Time
                                        {event.rawTime && (
                                            <span className="ml-1 opacity-60">
                                                ({[
                                                    event.rawTime.open ? "OPEN / " : "",
                                                    event.rawTime.start ? "START ～" : "",
                                                    event.rawTime.end ? " END" : ""
                                                ].join("").trim()})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[var(--color-text-primary)] text-base whitespace-pre-wrap">{event.time}</p>
                                </div>
                            </div>
                        )}

                        {/* 料金 */}
                        {event.price && (
                            <div className="flex items-start gap-3 mt-2 text-[var(--color-text-secondary)]">
                                <Ticket className="w-5 h-5 mt-0.5 text-[var(--color-text-primary)]" />
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Price</p>
                                    <p className="text-[var(--color-text-primary)] text-base whitespace-pre-wrap">{event.price}</p>
                                </div>
                            </div>
                        )}

                        {/* 会場・住所 */}
                        {(event.location || event.address) && (
                            <div className="flex items-start gap-3 mt-2 text-[var(--color-text-secondary)]">
                                <MapPin className="w-5 h-5 mt-0.5 text-[var(--color-text-primary)]" />
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Venue</p>
                                    <p className="text-[var(--color-text-primary)] text-base font-medium">{event.location}</p>
                                    {event.address && (
                                        <div className="mt-1 flex flex-wrap items-start gap-2">
                                            {event.address.startsWith("http") ? (
                                                <a
                                                    href={event.address}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-primary)] hover:text-white transition-colors font-medium bg-[var(--color-brand-primary)]/10 hover:bg-[var(--color-brand-primary)]/30 px-3 py-1.5 rounded-lg"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    {language === "ja" ? "Googleマップで開く" : "Open in Google Maps"}
                                                </a>
                                            ) : (
                                                <p className="text-sm opacity-80 whitespace-pre-wrap flex-1 min-w-[120px]">{event.address}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="w-full border-[var(--color-border-subtle)] my-2" />

                    {/* 詳細テキスト */}
                    {event.detail && (
                        <div className="w-full mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlignLeft className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                                <h3 className="text-sm uppercase tracking-wider font-semibold text-[var(--color-text-tertiary)]">
                                    Details / Lineup
                                </h3>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                                {event.detail.split(/((?:https?:\/\/|www\.)[^\s]+|[a-z0-9]+(?:[-.][a-z0-9]+)*\.(?:com|net|org|edu|gov|tv|io|jp|me)(?:\/[^\s]*)?)/gi).map((part, i) => {
                                    const isUrl = /((?:https?:\/\/|www\.)[^\s]+|[a-z0-9]+(?:[-.][a-z0-9]+)*\.(?:com|net|org|edu|gov|tv|io|jp|me)(?:\/[^\s]*)?)/i.test(part);
                                    if (isUrl) {
                                        const href = part.startsWith("http") ? part : `https://${part}`;
                                        return (
                                            <a
                                                key={i}
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--color-brand-primary)] hover:text-white underline decoration-[var(--color-brand-primary)]/40 hover:decoration-white transition-all break-all inline-block font-medium"
                                            >
                                                {part}
                                            </a>
                                        );
                                    }
                                    return <span key={i}>{part}</span>;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 画像拡大表示 (Lightbox) */}
            {isEnlarged && event.flyerUrls?.[currentImageIndex] && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 cursor-zoom-out p-4"
                    onClick={() => setIsEnlarged(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
                        onClick={(e) => { e.stopPropagation(); setIsEnlarged(false); }}
                        aria-label="Close zoomed image"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="relative w-full h-full max-w-5xl max-h-screen flex items-center justify-center">
                        <div className="relative w-full h-full">
                            <Image
                                src={event.flyerUrls[currentImageIndex]}
                                alt={event.title}
                                fill
                                className="object-contain"
                                priority
                                sizes="90vw"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 内部で使うためCalendarアイコンだけ再定義またはimport修正
function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}
