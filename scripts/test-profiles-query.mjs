import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
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

// Test 1: Query with anon key
const resAnon = await fetch(`${supabaseUrl}/rest/v1/editorial_profiles?select=*`, {
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  },
});
console.log("Anon query status:", resAnon.status, resAnon.statusText);
const bodyAnon = await resAnon.text();
console.log("Anon query response:", bodyAnon);
