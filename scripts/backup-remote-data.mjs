import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const envPath = path.resolve(ROOT_DIR, ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"]?.replace(/\/$/, "");
const anonKey = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

console.log("Supabase URL:", supabaseUrl);

const tables = [
  "articles",
  "categories",
  "authors",
  "issues",
  "market_indicators",
  "wire_briefings",
  "site_settings",
  "subscribers",
  "editorial_profiles"
];

const backupData = {};

for (const table of tables) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (res.ok) {
      const rows = await res.json();
      backupData[table] = rows;
      console.log(`✓ Backed up ${table}: ${rows.length} rows`);
    } else {
      console.log(`! Table ${table} returned status ${res.status} (${res.statusText})`);
    }
  } catch (err) {
    console.error(`✗ Error backing up ${table}:`, err.message);
  }
}

const backupPath = path.resolve(ROOT_DIR, "remote_database_backup.json");
fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");
console.log("\nBackup saved successfully to:", backupPath);
