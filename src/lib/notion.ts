import { Client } from "@notionhq/client";
import { type PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as holidayJp from "@holiday-jp/holiday_jp";

// Clientのインスタンス化は遅延させるため関数内に移動します

export const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export type DJEvent = {
    id: string;
    title: string;
    date: string;
    time?: string;
    rawTime?: {
        open?: string;
        start?: string;
        end?: string;
    };
    price?: string;
    location: string;
    address?: string;
    detail?: string;
    flyerUrls: string[];
    status: string;
    tbaComment?: string;
    eventSubtext?: string;
    holiday?: {
        isHoliday: boolean;
        name?: string;
    };
    sortTime: string; // ソート用 (HHMM形式)
};

// Helper to extract text from rich_text or title property
const getText = (prop: any): string => {
    if (!prop) return "";
    if (prop.type === "title") return prop.title.map((t: any) => t.plain_text).join("");
    if (prop.type === "rich_text") return prop.rich_text.map((t: any) => t.plain_text).join("");
    if (prop.type === "select") return prop.select?.name || "";
    if (prop.type === "status") return prop.status?.name || "";
    return "";
};

export async function getEvents(): Promise<DJEvent[]> {
    if (!DATABASE_ID || !process.env.NOTION_API_KEY) {
        console.error("Notion API Key or Database ID is missing");
        return [];
    }

    const notion = new Client({
        auth: process.env.NOTION_API_KEY,
    });

    try {
        // DBメタデータからDataSource IDを取得
        const dbMeta = await notion.databases.retrieve({ database_id: DATABASE_ID });
        const dataSourceId = (dbMeta as any).data_sources?.[0]?.id;

        if (!dataSourceId) {
            console.error("No valid data_source_id found for the given database.");
            return [];
        }

        const response = await (notion as any).dataSources.query({
            data_source_id: dataSourceId,
            sorts: [
                {
                    property: "日付",
                    direction: "ascending", // 直近のイベントから順にしたい場合はdescendingですが、通常は予定なので近い順(ascending)
                },
            ]
        });

        const todayRaw = new Date().toISOString().split("T")[0].replace(/-/g, ""); // "20260225"

        return (response.results as PageObjectResponse[]).map((page) => {
            const p = page.properties;

            // 複数画像の取得 (フライヤー1~5などを順に確認)
            const flyerUrls: string[] = [];
            const flyerKeys = ["フライヤー1", "フライヤー2", "フライヤー3", "フライヤー4", "フライヤー5", "Flyer", "flyer"];
            for (const key of flyerKeys) {
                const prop = p[key];
                if (prop && prop.type === "files" && prop.files.length > 0) {
                    for (const f of prop.files) {
                        const url = f.type === "file" ? f.file.url : f.external.url;
                        if (url && !flyerUrls.includes(url)) {
                            flyerUrls.push(url);
                        }
                    }
                }
            }

            // 日付のパース ("20260321" -> "2026-03-21")
            const rawDate = getText(p["日付"] || p["Date"]);
            let dateFormatted = rawDate;
            if (rawDate && rawDate.length === 8 && !rawDate.includes("-")) {
                dateFormatted = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
            }

            // 時間のフォーマットユーティリティ (HHMM -> H:MM)
            const formatTime = (t: string) => {
                if (!t || t.length !== 4) return t;
                const hours = parseInt(t.slice(0, 2), 10);
                const mins = t.slice(2, 4);
                return `${hours}:${mins}`;
            };

            // 時間合成 ( [OPEN / ][START ～][ END] )
            const openTime = formatTime(getText(p["開場時間"]));
            const startTime = formatTime(getText(p["開始時間"]));
            const endTime = formatTime(getText(p["終了時間"]));

            let timeStr = "";
            if (openTime) {
                timeStr += `${openTime} / `;
            }
            if (startTime) {
                timeStr += `${startTime} ～`;
                if (endTime) {
                    timeStr += ` ${endTime}`;
                }
            } else if (endTime) {
                timeStr += `～ ${endTime}`;
            }

            timeStr = timeStr.trim();

            const status = getText(p["ステータス"] || p["Status"]);

            // 祝日判定
            let holidayInfo = { isHoliday: false, name: "" };
            if (dateFormatted) {
                // YYYY-MM-DD をパースする際、タイムゾーンの影響を避けるため
                const [y, m, d] = dateFormatted.split("-").map(Number);
                const dateObj = new Date(y, m - 1, d); // ローカル時刻の00:00で生成
                const holidays = holidayJp.between(dateObj, dateObj);
                if (holidays.length > 0) {
                    holidayInfo = { isHoliday: true, name: holidays[0].name };
                }
            }

            return {
                id: page.id,
                title: getText(p["イベント名"] || p["名前"] || p["Title"]),
                date: dateFormatted,
                time: timeStr.trim() || getText(p["Time"]),
                rawTime: {
                    open: openTime || undefined,
                    start: startTime || undefined,
                    end: endTime || undefined
                },
                price: getText(p["値段"] || p["Price"]),
                location: getText(p["会場名"] || p["Location"]),
                address: getText(p["住所"] || p["Address"] || p["会場住所"]),
                detail: getText(p["イベント詳細"] || p["Detail"]),
                status: status,
                tbaComment: getText(p["TBAコメント"] || p["TBAComment"]),
                eventSubtext: getText(p["イベントサブテキスト"] || p["EventSubtext"]),
                flyerUrls,
                holiday: holidayInfo.isHoliday ? holidayInfo : undefined,
                sortTime: getText(p["開始時間"]) || "9999",
            };
        }).filter(e => e.title && e.date && e.status !== "非公開") // EventNameとDateがあるもの、かつ非公開でないものを有効とみなす
            .sort((a, b) => {
                // 第一ソート: 日付順
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                // 第二ソート: 開始時間順
                return a.sortTime.localeCompare(b.sortTime);
            });
    } catch (error) {
        console.error("Failed to fetch events from Notion:", error);
        return [];
    }
}
