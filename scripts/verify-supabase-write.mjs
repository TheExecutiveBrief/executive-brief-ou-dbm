import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";

/**
 * ==============================================================================
 * The Executive Brief by OU DBM - Option A Editorial Write Verification Script
 * 
 * Safety Guarantees:
 * 1. Generates dynamic, unique UUID and timestamped slug for every run.
 * 2. Pre-flight checks verify zero collisions with existing records.
 * 3. Exact field verification on returned rows after INSERT and PATCH.
 * 4. Anonymous shield check confirms draft is invisible to public.
 * 5. Targeted cleanup strictly targets the dynamic UUID, never seeded data.
 * 6. Guaranteed `finally` block ensures cleanup even on timeout or error.
 * 7. Zero logging or echoing of passwords, tokens, or API keys.
 * ==============================================================================
 */

// 1. Read .env.local safely
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

// 2. Verified baseline parent IDs from live database
const VERIFIED_CATEGORY_ID = "00000000-0000-0000-0001-000000000001"; // Desk 00: Special Report
const VERIFIED_AUTHOR_ID = "00000000-0000-0000-0002-000000000001";   // K. R. V. Narayana

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

async function runWriteVerification() {
  console.log("\n=================================================================");
  console.log("  THE EXECUTIVE BRIEF — OPTION A EDITORIAL WRITE VERIFICATION");
  console.log("=================================================================\n");

  const { email, password } = await promptCredentials();
  if (!email || !password) {
    console.error("✗ FAIL: Email and password are required.");
    process.exit(1);
  }

  // Authenticate to obtain short-lived JWT in memory
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
      console.log(`✗ FAIL: Supabase Auth rejected credentials (HTTP ${authRes.status}): ${err.error_description || "Invalid login"}`);
      process.exit(1);
    }

    tokenData = await authRes.json();
    console.log("✓ Step 1: Authenticated with Supabase Auth (JWT in memory)");
  } catch (err) {
    console.log(`✗ FAIL: Auth network error: ${err.message}`);
    process.exit(1);
  }

  const userId = tokenData.user?.id;
  const accessToken = tokenData.access_token;

  // Generate dynamic, unique test identifiers
  const testId = crypto.randomUUID();
  const testSlug = `ephemeral-audit-draft-${Date.now()}`;
  console.log(`✓ Step 2: Generated dynamic test UUID: ${testId}`);
  console.log(`         Generated dynamic test slug: ${testSlug}`);

  let rowMayExist = false;
  let baselineCount = 0;

  try {
    // --------------------------------------------------------------------------
    // PRE-FLIGHT VERIFICATIONS (No writes)
    // --------------------------------------------------------------------------
    console.log("\n[Phase 1: Pre-Flight Integrity Checks]");

    // Check UUID does not exist
    const idCheckRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}&select=id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    });
    const idCheckData = await idCheckRes.json();
    if (!idCheckRes.ok || (Array.isArray(idCheckData) && idCheckData.length > 0)) {
      throw new Error(`Pre-flight check failed: UUID collision detected for ${testId}`);
    }

    // Check slug does not exist
    const slugCheckRes = await fetch(`${supabaseUrl}/rest/v1/articles?slug=eq.${testSlug}&select=id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    });
    const slugCheckData = await slugCheckRes.json();
    if (!slugCheckRes.ok || (Array.isArray(slugCheckData) && slugCheckData.length > 0)) {
      throw new Error(`Pre-flight check failed: Slug collision detected for ${testSlug}`);
    }

    // Record baseline article count
    const countRes = await fetch(`${supabaseUrl}/rest/v1/articles?select=id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    });
    const countData = await countRes.json();
    if (!countRes.ok || !Array.isArray(countData)) {
      throw new Error("Pre-flight check failed: Unable to retrieve baseline article count.");
    }
    baselineCount = countData.length;
    console.log(`  ✓ Pre-flight collision checks passed (0 conflicts). Baseline count: ${baselineCount} articles.`);

    // --------------------------------------------------------------------------
    // OPERATION 1: INSERT TEMPORARY DRAFT
    // --------------------------------------------------------------------------
    console.log("\n[Phase 2: Insert Temporary Draft]");
    
    // Set flag right before dispatching insert
    rowMayExist = true;

    const insertPayload = {
      id: testId,
      slug: testSlug,
      title: "[AUDIT] Ephemeral Verification Draft",
      subtitle: "Safe live RLS write test",
      excerpt: "Initial excerpt verifying editor draft creation.",
      category_id: VERIFIED_CATEGORY_ID,
      author_id: VERIFIED_AUTHOR_ID,
      status: "draft",
      cover_image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      reading_time: "3 min read",
      created_by: userId,
      tags: ["Audit", "Ephemeral", "Temporary"],
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/articles`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(insertPayload),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Insert failed (HTTP ${insertRes.status}): ${errText}`);
    }

    const insertedRows = await insertRes.json();
    if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
      throw new Error("Insert returned empty representation payload.");
    }

    const insertedRow = insertedRows[0];
    if (insertedRow.id !== testId) {
      throw new Error(`Returned ID mismatch: expected ${testId}, got ${insertedRow.id}`);
    }
    if (insertedRow.slug !== testSlug) {
      throw new Error(`Returned slug mismatch: expected ${testSlug}, got ${insertedRow.slug}`);
    }
    if (insertedRow.status !== "draft") {
      throw new Error(`Returned status mismatch: expected 'draft', got '${insertedRow.status}'`);
    }
    if (insertedRow.category_id !== VERIFIED_CATEGORY_ID) {
      throw new Error("Returned category_id mismatch.");
    }
    if (insertedRow.author_id !== VERIFIED_AUTHOR_ID) {
      throw new Error("Returned author_id mismatch.");
    }

    console.log("  ✓ Operation 1: Insert Temporary Draft: PASS");
    console.log(`    HTTP ${insertRes.status} Created. Returned row contents validated.`);

    // --------------------------------------------------------------------------
    // OPERATION 2: ANONYMOUS PUBLIC SHIELD CHECK
    // --------------------------------------------------------------------------
    console.log("\n[Phase 3: Verify Anonymous Public Shield]");

    const anonCheckRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}&select=id,title,status`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!anonCheckRes.ok) {
      throw new Error(`Anonymous check failed with HTTP ${anonCheckRes.status}`);
    }

    const anonData = await anonCheckRes.json();
    if (!Array.isArray(anonData) || anonData.length !== 0) {
      throw new Error(`SECURITY LEAK: Anonymous query returned ${anonData.length} draft row(s). Draft is not shielded!`);
    }

    console.log("  ✓ Operation 2: Anonymous Public Shield: PASS");
    console.log("    HTTP 200 OK with 0 rows returned. Public cannot view draft.");

    // --------------------------------------------------------------------------
    // OPERATION 3: UPDATE TEMPORARY DRAFT
    // --------------------------------------------------------------------------
    console.log("\n[Phase 4: Update Temporary Draft as Editor]");

    const updatedExcerpt = "Updated excerpt verifying editor PATCH write permissions.";
    const patchPayload = {
      excerpt: updatedExcerpt,
      updated_by: userId,
    };

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}`, {
      method: "PATCH",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patchPayload),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`Patch failed (HTTP ${patchRes.status}): ${errText}`);
    }

    const patchedRows = await patchRes.json();
    if (!Array.isArray(patchedRows) || patchedRows.length === 0) {
      throw new Error("Patch returned empty representation payload.");
    }

    const patchedRow = patchedRows[0];
    if (patchedRow.id !== testId) {
      throw new Error("Patched row ID mismatch.");
    }
    if (patchedRow.excerpt !== updatedExcerpt) {
      throw new Error(`Patched excerpt mismatch: expected '${updatedExcerpt}', got '${patchedRow.excerpt}'`);
    }
    if (patchedRow.status !== "draft") {
      throw new Error(`Patched status was altered: expected 'draft', got '${patchedRow.status}'`);
    }

    console.log("  ✓ Operation 3: Update Temporary Draft: PASS");
    console.log("    HTTP 200 OK. Changed field verified; status strictly remained 'draft'.");

    // --------------------------------------------------------------------------
    // OPERATION 4: TARGETED CLEANUP (Exact UUID Only)
    // --------------------------------------------------------------------------
    console.log("\n[Phase 5: Targeted Cleanup & Count Verification]");

    const deleteRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}`, {
      method: "DELETE",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      throw new Error(`Delete failed (HTTP ${deleteRes.status}): ${errText}`);
    }

    // Row successfully deleted in normal flow
    rowMayExist = false;

    // Verify row is completely gone
    const verifyDeleteRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}&select=id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    });
    const verifyDeleteData = await verifyDeleteRes.json();
    if (Array.isArray(verifyDeleteData) && verifyDeleteData.length !== 0) {
      throw new Error(`Cleanup verification failed: Row ${testId} still exists.`);
    }

    // Verify exact baseline count is preserved
    const finalCountRes = await fetch(`${supabaseUrl}/rest/v1/articles?select=id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    });
    const finalCountData = await finalCountRes.json();
    if (!finalCountRes.ok || !Array.isArray(finalCountData)) {
      throw new Error("Unable to verify final article count.");
    }

    if (finalCountData.length !== baselineCount) {
      throw new Error(`Article count mismatch: expected baseline of ${baselineCount}, found ${finalCountData.length}`);
    }

    console.log("  ✓ Operation 4: Targeted Cleanup: PASS");
    console.log(`    Row ${testId} deleted cleanly.`);
    console.log(`  ✓ Operation 5: Article Count Integrity: PASS`);
    console.log(`    Article count verified exactly at baseline (${finalCountData.length}/${baselineCount} articles).`);

    console.log("\n=================================================================");
    console.log("  SUMMARY: ALL VERIFICATION OPERATIONS PASSED CLEANLY (SUCCESS)");
    console.log("=================================================================\n");
  } catch (err) {
    process.exitCode = 1;
    console.error(`\n✗ EXECUTION ERROR: ${err.message}`);
  } finally {
    // --------------------------------------------------------------------------
    // GUARANTEED CLEANUP IN FINALLY BLOCK
    // --------------------------------------------------------------------------
    if (rowMayExist) {
      console.log("\n[Emergency Cleanup in finally Block]");
      console.log(`Targeting strictly the test UUID: ${testId}...`);
      try {
        // Double-check if the row actually exists before attempting delete
        const checkRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}&select=id`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
        });
        const checkData = await checkRes.json();
        if (Array.isArray(checkData) && checkData.length > 0) {
          const emergencyDeleteRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}`, {
            method: "DELETE",
            headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
          });
          if (!emergencyDeleteRes.ok) {
            console.error(`✗ Emergency cleanup DELETE failed with HTTP ${emergencyDeleteRes.status}`);
            process.exitCode = 1;
          } else {
            // Confirm zero rows remain before reporting cleanup succeeded
            const verifyRes = await fetch(`${supabaseUrl}/rest/v1/articles?id=eq.${testId}&select=id`, {
              headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
            });
            const verifyData = await verifyRes.json();
            if (Array.isArray(verifyData) && verifyData.length === 0) {
              console.log(`✓ Confirmed zero rows remain for ${testId}. Emergency cleanup verified.`);
            } else {
              console.error(`✗ Emergency cleanup verification failed: Row ${testId} still exists in database!`);
              process.exitCode = 1;
            }
          }
        } else {
          console.log(`✓ Confirmed row ${testId} is not present in database; no emergency cleanup required.`);
        }
      } catch (cleanupErr) {
        console.error(`✗ Emergency cleanup encountered an error: ${cleanupErr.message}`);
        process.exitCode = 1;
      }
    }
  }
}

runWriteVerification();
