const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");

// load .env.local
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach(line => {
        const [key, ...vals] = line.split("=");
        if (key && vals.length > 0) {
            let val = vals.join("=").trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
            }
            process.env[key] = val;
        }
    });
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dbId = process.env.NOTION_DATABASE_ID;

async function run() {
    try {
        console.log("Checking methods on databases:", Object.keys(notion.databases));
        console.log("Is query available?:", typeof notion.databases.query);

        console.log("querying dataSource items...");
        const db = await notion.databases.retrieve({ database_id: dbId });
        const dataSourceId = db.data_sources?.[0]?.id;
        if (!dataSourceId) {
            console.error("No data_source_id found on database!");
            return;
        }
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            page_size: 1,
        });

        console.log("------------- FIRST ITEM PROPERTIES -------------");
        if (response.results.length > 0) {
            const props = response.results[0].properties;
            console.log(JSON.stringify(props, null, 2));
        } else {
            console.log("No items found. Cannot determine properties.");
        }
        console.log("---------------------------------------------");
    } catch (e) {
        console.error(e);
    }
}
run();
