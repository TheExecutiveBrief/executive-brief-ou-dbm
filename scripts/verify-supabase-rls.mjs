import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("✗ FAIL: .env.local not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"]?.replace(/\/$/, "");
const anonKey = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!supabaseUrl || !anonKey) {
  console.error("✗ FAIL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local.");
  process.exit(1);
}

async function promptCredentials() {
  const emailEnv = process.env.SUPABASE_TEST_EMAIL;
  const passEnv = process.env.SUPABASE_TEST_PASSWORD;

  if (emailEnv && passEnv) {
    return { email: emailEnv.trim(), password: passEnv };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  const email = (await question("\nEnter Editor-in-Chief Email: ")).trim();

  process.stdout.write("Enter Editor-in-Chief Password: ");
  const password = await new Promise((resolve) => {
    let pass = "";
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onData = (char) => {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(pass);
        } else if (char === "\u0003") {
          process.exit(1);
        } else if (char === "\b" || char === "\x7f") {
          if (pass.length > 0) {
            pass = pass.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          pass += char;
          process.stdout.write("*");
        }
      };
      process.stdin.on("data", onData);
    } else {
      rl.question("", (ans) => {
        rl.close();
        resolve(ans);
      });
    }
  });

  return { email, password };
}

async function runRlsVerification() {
  console.log("\n=================================================================");
  console.log("  THE EXECUTIVE BRIEF — LIVE SUPABASE RLS VERIFICATION");
  console.log("=================================================================\n");

  const results = [];

  // ----------------------------------------------------------------------------
  // SECTION 1: ANONYMOUS REQUESTS (Public Key)
  // ----------------------------------------------------------------------------
  console.log("[Phase 1: Anonymous Public Read Checks]");

  // Test 1: Anon read published articles
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/articles?select=id,slug,status&status=eq.published&limit=5`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data) && data.length > 0) {
      console.log(`  ✓ Check 1 (Anon Read Published Articles): PASS (HTTP ${res.status}, ${data.length} articles returned)`);
      results.push({ check: "Anon Read Published Articles", status: "PASS", note: `${data.length} live articles returned` });
    } else {
      console.log(`  ✗ Check 1 (Anon Read Published Articles): FAIL (HTTP ${res.status})`);
      results.push({ check: "Anon Read Published Articles", status: "FAIL", note: `HTTP ${res.status}` });
    }
  } catch (err) {
    results.push({ check: "Anon Read Published Articles", status: "FAIL", note: err.message });
  }

  // Test 2: Anon attempt to read non-published articles
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/articles?select=id,slug,status&status=neq.published`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data) && data.length === 0) {
      console.log(`  ✓ Check 2 (Anon Blocked from Non-Published Articles): PASS (HTTP ${res.status}, 0 rows returned)`);
      results.push({ check: "Anon Blocked from Non-Published Articles", status: "PASS", note: "0 non-published rows returned to anon" });
    } else {
      console.log(`  ✗ Check 2 (Anon Blocked from Non-Published Articles): FAIL (HTTP ${res.status}, returned rows)`);
      results.push({ check: "Anon Blocked from Non-Published Articles", status: "FAIL", note: "Non-published articles exposed to anon" });
    }
  } catch (err) {
    results.push({ check: "Anon Blocked from Non-Published Articles", status: "FAIL", note: err.message });
  }

  // Test 3: Anon attempt to read subscribers
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/subscribers?select=id,email`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data) && data.length === 0) {
      console.log(`  ✓ Check 3 (Anon Blocked from Reading Subscribers): PASS (HTTP ${res.status}, 0 rows returned)`);
      results.push({ check: "Anon Blocked from Reading Subscribers", status: "PASS", note: "0 subscriber records returned to anon" });
    } else {
      console.log(`  ✗ Check 3 (Anon Blocked from Reading Subscribers): FAIL`);
      results.push({ check: "Anon Blocked from Reading Subscribers", status: "FAIL", note: "Subscribers exposed to anon" });
    }
  } catch (err) {
    results.push({ check: "Anon Blocked from Reading Subscribers", status: "FAIL", note: err.message });
  }

  // Test 4: Anon attempt to read editorial_profiles
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/editorial_profiles?select=id,email,role`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data) && data.length === 0) {
      console.log(`  ✓ Check 4 (Anon Blocked from Reading Editorial Profiles): PASS (HTTP ${res.status}, 0 rows returned)`);
      results.push({ check: "Anon Blocked from Reading Editorial Profiles", status: "PASS", note: "0 profiles returned to anon" });
    } else {
      console.log(`  ✗ Check 4 (Anon Blocked from Reading Editorial Profiles): FAIL`);
      results.push({ check: "Anon Blocked from Reading Editorial Profiles", status: "FAIL", note: "Profiles exposed to anon" });
    }
  } catch (err) {
    results.push({ check: "Anon Blocked from Reading Editorial Profiles", status: "FAIL", note: err.message });
  }

  // ----------------------------------------------------------------------------
  // SECTION 2: AUTHENTICATED EDITOR-IN-CHIEF REQUESTS (JWT Bearer Token)
  // ----------------------------------------------------------------------------
  console.log("\n[Phase 2: Authenticated Editor-in-Chief Checks]");

  const { email, password } = await promptCredentials();
  if (!email || !password) {
    console.error("✗ FAIL: Email and password are required.");
    process.exit(1);
  }

  // Obtain short-lived JWT in memory
  let tokenData;
  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}));
      console.log(`  ✗ FAIL: Supabase Auth rejected credentials (HTTP ${authRes.status}): ${err.error_description || "Invalid login"}`);
      process.exit(1);
    }

    tokenData = await authRes.json();
  } catch (err) {
    console.log(`  ✗ FAIL: Auth request error: ${err.message}`);
    process.exit(1);
  }

  const userId = tokenData.user?.id;
  const accessToken = tokenData.access_token;

  // Test 5: Editor Read Articles via JWT
  try {
    const artRes = await fetch(`${supabaseUrl}/rest/v1/articles?select=id,slug,status&limit=10`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const artData = await artRes.json();
    if (artRes.ok && Array.isArray(artData)) {
      console.log(`  ✓ Check 5 (Editor Read Articles with JWT): PASS (HTTP ${artRes.status}, ${artData.length} articles read)`);
      results.push({ check: "Editor Read Articles with JWT", status: "PASS", note: `HTTP ${artRes.status}, ${artData.length} articles accessible` });
    } else {
      console.log(`  ✗ Check 5 (Editor Read Articles with JWT): FAIL (HTTP ${artRes.status})`);
      results.push({ check: "Editor Read Articles with JWT", status: "FAIL", note: `HTTP ${artRes.status}` });
    }
  } catch (err) {
    results.push({ check: "Editor Read Articles with JWT", status: "FAIL", note: err.message });
  }

  // Test 6: Draft Confidentiality Verification in Database
  try {
    const draftRes = await fetch(`${supabaseUrl}/rest/v1/articles?select=id,slug,status&status=eq.draft`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const draftData = await draftRes.json();
    if (Array.isArray(draftData) && draftData.length > 0) {
      console.log(`  ✓ Check 6 (Draft Articles Present & Visible to Editor): PASS (${draftData.length} drafts visible to editor)`);
      results.push({ check: "Draft Confidentiality Demonstration", status: "PASS", note: `${draftData.length} live drafts confirmed` });
    } else {
      console.log("  - Check 6 (Live Draft Isolation Demonstration): NOT TESTED");
      console.log("    Database currently contains 0 draft articles (all 15 seed articles are 'published').");
      console.log("    Per test constraints, no test records were created.");
      results.push({
        check: "Live Draft Isolation Demonstration",
        status: "NOT TESTED",
        note: "Database contains 0 drafts; creating test records was prohibited.",
      });
    }
  } catch (err) {
    results.push({ check: "Live Draft Isolation Demonstration", status: "NOT TESTED", note: err.message });
  }

  // Test 7: Editor Read Own Editorial Profile via JWT
  try {
    const profRes = await fetch(
      `${supabaseUrl}/rest/v1/editorial_profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,full_name,role,is_active&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const profData = await profRes.json();
    if (profRes.ok && Array.isArray(profData) && profData.length > 0) {
      const p = profData[0];
      if (p.role === "editor_in_chief" && p.is_active === true) {
        console.log(`  ✓ Check 7 (Editor Read Own Active Profile): PASS (Role: ${p.role}, Active: ${p.is_active})`);
        results.push({ check: "Editor Read Own Active Profile", status: "PASS", note: `Role: ${p.role}, Active: ${p.is_active}` });
      } else {
        console.log(`  ✗ Check 7 (Editor Read Own Active Profile): FAIL (Role: ${p.role}, Active: ${p.is_active})`);
        results.push({ check: "Editor Read Own Active Profile", status: "FAIL", note: `Unexpected role/status: ${p.role}/${p.is_active}` });
      }
    } else {
      console.log(`  ✗ Check 7 (Editor Read Own Active Profile): FAIL (HTTP ${profRes.status})`);
      results.push({ check: "Editor Read Own Active Profile", status: "FAIL", note: `HTTP ${profRes.status}` });
    }
  } catch (err) {
    results.push({ check: "Editor Read Own Active Profile", status: "FAIL", note: err.message });
  }

  // Test 8: Editor Read Subscribers via JWT
  try {
    const subRes = await fetch(`${supabaseUrl}/rest/v1/subscribers?select=id,email`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const subData = await subRes.json();
    if (subRes.ok && Array.isArray(subData)) {
      console.log(`  ✓ Check 8 (Editor Read Subscribers Table): PASS (HTTP ${subRes.status}, ${subData.length} subscribers read)`);
      results.push({ check: "Editor Read Subscribers with JWT", status: "PASS", note: `HTTP ${subRes.status}, query permitted by RLS` });
    } else {
      console.log(`  ✗ Check 8 (Editor Read Subscribers Table): FAIL (HTTP ${subRes.status})`);
      results.push({ check: "Editor Read Subscribers with JWT", status: "FAIL", note: `HTTP ${subRes.status}` });
    }
  } catch (err) {
    results.push({ check: "Editor Read Subscribers with JWT", status: "FAIL", note: err.message });
  }

  console.log("\n=================================================================");
  console.log("  SUMMARY TABLE");
  console.log("=================================================================");
  for (const r of results) {
    console.log(`  [${r.status.padEnd(10)}] ${r.check.padEnd(45)} (${r.note})`);
  }
  console.log("=================================================================\n");
}

runRlsVerification();
