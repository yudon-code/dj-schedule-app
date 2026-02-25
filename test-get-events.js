// test-get-events.js

const fs = require("fs");
const path = require("path");

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

const { getEvents } = require("./src/lib/notion.ts");

getEvents().then(events => {
    console.log("=== Fetched Events ===");
    console.dir(events, { depth: null });
}).catch(console.error);
