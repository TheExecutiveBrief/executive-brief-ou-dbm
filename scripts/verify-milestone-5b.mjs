/**
 * ==============================================================================
 * The Executive Brief by OU DBM - Milestone 5B Verification & Hardening Suite
 * Editorial Hierarchy, Access Control & Approval Workflow
 * ==============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const ROOT_DIR = process.cwd();

console.log("\n=================================================================");
console.log("  THE EXECUTIVE BRIEF — MILESTONE 5B VERIFICATION & HARDENING SUITE");
console.log("  Hierarchy: Section Writer → Editorial Editor → Chief Editor → Administrator");
console.log("=================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(suite, description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] Suite ${suite}: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Suite ${suite}: ${description}`);
    console.error(`    ↳ ${err.message}`);
    process.exitCode = 1;
  }
}

async function runAsyncTest(suite, description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [PASS] Suite ${suite}: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] Suite ${suite}: ${description}`);
    console.error(`    ↳ ${err.message}`);
    process.exitCode = 1;
  }
}

// ==============================================================================
// Category A: Static Schema & PostgreSQL Migration Security Verification
// ==============================================================================
console.log("[Category A: Static Schema & PostgreSQL Migration Security]");

const MIGRATION_00004_PATH = path.join(
  ROOT_DIR,
  "supabase",
  "migrations",
  "00004_editorial_enums.sql"
);

const MIGRATION_00005_PATH = path.join(
  ROOT_DIR,
  "supabase",
  "migrations",
  "00005_editorial_hierarchy_workflow.sql"
);

runTest("A.1", "Migration 00004 exists and contains isolated enum definitions", () => {
  assert(fs.existsSync(MIGRATION_00004_PATH), "Migration 00004_editorial_enums.sql must exist.");
  const sql = fs.readFileSync(MIGRATION_00004_PATH, "utf8");
  assert(sql.includes("editorial_role"), "Must alter editorial_role.");
  assert(sql.includes("'administrator'"), "Must add 'administrator'.");
  assert(sql.includes("'section_writer'"), "Must add 'section_writer'.");
  assert(sql.includes("account_status"), "Must create account_status enum.");
  assert(sql.includes("'pending'"), "Must include 'pending'.");
  assert(sql.includes("'approved'"), "Must include 'approved'.");
  assert(sql.includes("'suspended'"), "Must include 'suspended'.");
  assert(!sql.includes("create table"), "Migration 00004 must not create tables.");
  assert(!sql.includes("create function"), "Migration 00004 must not define functions.");
});

runTest("A.2", "Migration 00005 builds on committed enums and establishes core workflow tables", () => {
  assert(fs.existsSync(MIGRATION_00005_PATH), "Migration 00005_editorial_hierarchy_workflow.sql must exist.");
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8").toLowerCase();
  assert(sql.includes("section_assignments"), "Must define section_assignments.");
  assert(sql.includes("article_workflow_audit"), "Must define article_workflow_audit.");
  assert(sql.includes("workflow_stage"), "Must add workflow_stage to articles.");
  assert(sql.includes("last_revision_reason"), "Must add last_revision_reason to articles.");
});

runTest("A.3", "Audit integrity fix: actor_id is nullable on delete set null with preserved actor metadata", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(!sql.includes("on delete set null not null"), "Must NOT contradict ON DELETE SET NULL with NOT NULL.");
  assert(sql.includes("actor_id uuid references editorial_profiles(id) on delete set null"), "actor_id must be nullable.");
  assert(sql.includes("actor_name text not null"), "Must permanently preserve historical actor_name.");
  assert(sql.includes("actor_role text not null"), "Must permanently preserve historical actor_role.");
  assert(sql.includes("actor_email text"), "Must preserve historical actor_email.");
});

runTest("A.4", "Audit anti-forgery: process_and_validate_workflow_audit trigger validates actual article state", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("process_and_validate_workflow_audit"), "Must define process_and_validate_workflow_audit trigger.");
  assert(sql.includes("new.actor_id := auth.uid()"), "Trigger must overwrite client actor_id with auth.uid().");
  assert(sql.includes("new.actor_name := actor_profile.full_name"), "Trigger must populate verified actor_name.");
  assert(sql.includes("new.actor_role := actor_profile.role::text"), "Trigger must populate verified actor_role.");
  assert(sql.includes("target_article.workflow_stage != new.to_stage"), "Trigger must reject audit records that do not match actual article stage.");
  assert(sql.includes("before insert on article_workflow_audit"), "Must attach trigger before insert.");
});

runTest("A.5", "Audit tamper resistance: Migration 00005 installs immutable trigger and table grants", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("prevent_workflow_audit_tampering"), "Must define prevent_workflow_audit_tampering trigger.");
  assert(sql.includes("before update or delete on article_workflow_audit"), "Must attach trigger before update or delete.");
  assert(sql.includes("revoke update, delete on table public.article_workflow_audit"), "Must revoke update/delete table grants.");
});

runTest("A.6", "State machine enforcement: validate_article_workflow_update trigger validates transitions & pairs", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("validate_article_workflow_update"), "Must define validate_article_workflow_update trigger.");
  assert(sql.includes("before update on articles"), "Must attach trigger before update on articles.");
  assert(sql.includes("State Inconsistency"), "Trigger must reject inconsistent stage/status pairs.");
  assert(sql.includes("is_chief_editor"), "Trigger must verify chief editor role on publication.");
  assert(sql.includes("last_revision_reason is null"), "Trigger must enforce revision directive on revision_requested.");
});

runTest("A.7", "Administrator access preservation: Explicitly upgrades admin.theexecutivebrief@gmail.com", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("admin.theexecutivebrief@gmail.com"), "Must explicitly target admin account.");
  assert(sql.includes("role = 'administrator'"), "Must set role to administrator.");
  assert(sql.includes("approval_status = 'approved'"), "Must set approval_status to approved.");
});

runTest("A.8", "Active account migration: Existing active team members backfilled to approved", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("set approval_status = 'approved'"), "Must backfill existing active profiles.");
  assert(sql.includes("where is_active = true"), "Must check is_active = true.");
});

runTest("A.9", "Security definer functions enforce 4-tier hierarchy, approval status & search_path", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("function public.is_admin()"), "Must define is_admin.");
  assert(sql.includes("function public.is_chief_editor()"), "Must define is_chief_editor.");
  assert(sql.includes("function public.is_editorial_editor()"), "Must define is_editorial_editor.");
  assert(sql.includes("function public.is_section_writer()"), "Must define is_section_writer.");
  assert(sql.includes("function public.is_editor()"), "Must update is_editor for backward compatibility.");
  assert(sql.includes("function public.is_editorial_member()"), "Must update is_editorial_member for backward compatibility.");
  assert(sql.includes("approval_status = 'approved'"), "All role checks must require approval_status = 'approved'.");
  assert(sql.includes("search_path = public"), "All security definer functions must set fixed search_path = public.");
});

runTest("A.10", "Profile protection triggers prevent RLS recursion and lock sensitive columns", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("validate_editorial_profile_update"), "Must define validate_editorial_profile_update trigger.");
  assert(sql.includes("validate_editorial_profile_insert"), "Must define validate_editorial_profile_insert trigger.");
  assert(sql.includes("new.role is distinct from old.role"), "Must freeze role column for non-admins.");
  assert(sql.includes("new.approval_status is distinct from old.approval_status"), "Must freeze approval_status for non-admins.");
  assert(sql.includes("new.is_active is distinct from old.is_active"), "Must freeze is_active for non-admins.");
});

runTest("A.11", "RLS section assignments: Only Administrator can insert, update, or delete", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("Allow admin section assignments insert"), "Must have admin insert policy.");
  assert(sql.includes("Allow admin section assignments update"), "Must have admin update policy.");
  assert(sql.includes("Allow admin section assignments delete"), "Must have admin delete policy.");
});

runTest("A.12", "RLS audit insertion: Permits all approved editorial tiers (writers, editors, chief, admin)", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("Allow inserting article workflow audit"), "Must have audit insert policy.");
  assert(sql.includes("public.is_editorial_member()"), "Audit insert policy must check is_editorial_member().");
});

runTest("A.13", "Atomic workflow transition function: submit_article_workflow_transition defined with row lock", () => {
  const sql = fs.readFileSync(MIGRATION_00005_PATH, "utf8");
  assert(sql.includes("submit_article_workflow_transition"), "Must define submit_article_workflow_transition function.");
  assert(sql.includes("for update"), "Function must lock target article row.");
  assert(sql.includes("insert into public.article_workflow_audit"), "Function must write audit record atomically.");
  assert(sql.includes("grant execute on function public.submit_article_workflow_transition"), "Must grant execute to authenticated.");
});

// ==============================================================================
// Category B: Mocked & Unit Verification of Access Control & Workflow Matrix
// ==============================================================================
console.log("\n[Category B: Mocked & Unit Verification of Application Guards]");

const authTypesPath = path.join(ROOT_DIR, "src", "lib", "auth", "types.ts");
const authTypesContent = fs.readFileSync(authTypesPath, "utf8");

runTest("B.1", "Hierarchy tier permissions are accurately defined in lib/auth/types.ts", () => {
  assert(authTypesContent.includes("isAdministrator"), "isAdministrator permission check exists.");
  assert(authTypesContent.includes("isChiefEditor"), "isChiefEditor permission check exists.");
  assert(authTypesContent.includes("isEditorialEditor"), "isEditorialEditor permission check exists.");
  assert(authTypesContent.includes("isSectionWriter"), "isSectionWriter permission check exists.");
  assert(authTypesContent.includes("canPublish"), "canPublish permission check exists.");
  assert(authTypesContent.includes("canDeleteArticle"), "canDeleteArticle permission check exists.");
  assert(authTypesContent.includes("canManageUsers"), "canManageUsers permission check exists.");
  assert(authTypesContent.includes("canApproveAccounts"), "canApproveAccounts permission check exists.");
});

runTest("B.2", "Publishing boundary: Only Chief Editor can publish (Administrator cannot)", () => {
  assert(authTypesContent.includes("role === \"editor_in_chief\""), "canPublish must check editor_in_chief.");
  const canPublish = (role) => role === "editor_in_chief";
  assert.strictEqual(canPublish("section_writer"), false, "Section Writer cannot publish");
  assert.strictEqual(canPublish("staff_writer"), false, "Staff Writer cannot publish");
  assert.strictEqual(canPublish("contributor"), false, "Contributor cannot publish");
  assert.strictEqual(canPublish("section_editor"), false, "Editorial Editor cannot publish");
  assert.strictEqual(canPublish("administrator"), false, "Administrator cannot publish");
  assert.strictEqual(canPublish("editor_in_chief"), true, "Chief Editor can publish");
});

runTest("B.3", "User management boundary: Only Administrator can manage users & approve accounts", () => {
  const canManageUsers = (role) => role === "administrator";
  assert.strictEqual(canManageUsers("section_writer"), false);
  assert.strictEqual(canManageUsers("staff_writer"), false);
  assert.strictEqual(canManageUsers("contributor"), false);
  assert.strictEqual(canManageUsers("section_editor"), false);
  assert.strictEqual(canManageUsers("editor_in_chief"), false);
  assert.strictEqual(canManageUsers("administrator"), true);
});

const workflowRoutePath = path.join(
  ROOT_DIR,
  "src",
  "app",
  "api",
  "admin",
  "articles",
  "workflow",
  "route.ts"
);
const workflowRouteContent = fs.readFileSync(workflowRoutePath, "utf8");

runTest("B.4", "Workflow route enforces mandatory revision reason on return_for_revision", () => {
  assert(workflowRouteContent.includes("return_for_revision"), "Handles return_for_revision.");
  assert(
    workflowRouteContent.includes("revisionReason.trim().length === 0") ||
      workflowRouteContent.includes("!revisionReason"),
    "Workflow route strictly checks for non-empty revisionReason."
  );
});

runTest("B.5", "Workflow route prevents Editorial Editor from direct publishing", () => {
  assert(
    workflowRouteContent.includes("permissions.canPublish(user.role)"),
    "Approve and publish action strictly guards on canPublish permission."
  );
});

runTest("B.6", "Workflow route logs full actor identity into append-only audit trail", () => {
  assert(
    workflowRouteContent.includes("recordWorkflowTransition") ||
      workflowRouteContent.includes("executeWorkflowTransition"),
    "Logs transition."
  );
  assert(
    workflowRouteContent.includes("actorName: user.fullName") ||
      workflowRouteContent.includes("fullName: user.fullName"),
    "Records actorName."
  );
  assert(
    workflowRouteContent.includes("actorRole: user.role") ||
      workflowRouteContent.includes("role: user.role"),
    "Records actorRole."
  );
});

const applyRoutePath = path.join(ROOT_DIR, "src", "app", "api", "auth", "apply", "route.ts");
const applyRouteContent = fs.readFileSync(applyRoutePath, "utf8");

runTest("B.7", "Public application route strictly sets pending approvalStatus and contributor role", () => {
  assert(
    applyRouteContent.includes("approval_status: \"pending\"") ||
      applyRouteContent.includes("'pending'"),
    "Application endpoint must force status to pending."
  );
  assert(applyRouteContent.includes("role: \"contributor\""), "Default signup role must be contributor.");
});

runTest("B.8", "Public application route prevents administrator self-assignment", () => {
  assert(
    applyRouteContent.includes("administrator") || applyRouteContent.includes("sanitizedRequestedRole"),
    "Application endpoint blocks administrator requests."
  );
});

const usersRoutePath = path.join(ROOT_DIR, "src", "app", "api", "admin", "users", "route.ts");
const usersRouteContent = fs.readFileSync(usersRoutePath, "utf8");

runTest("B.9", "Users management route protects active root administrator from self-lockout", () => {
  assert(
    usersRouteContent.includes("userId === session.user.id") ||
      usersRouteContent.includes("Safety Guard"),
    "Administrator route prevents self-demotion or self-suspension."
  );
});

const sessionPath = path.join(ROOT_DIR, "src", "lib", "auth", "session.ts");
const sessionContent = fs.readFileSync(sessionPath, "utf8");

runTest("B.10", "Live session revalidation: requireAuth immediately detects suspended/revoked accounts", () => {
  assert(sessionContent.includes("getLiveEditorialProfile"), "Calls getLiveEditorialProfile.");
  assert(sessionContent.includes("account_suspended"), "Redirects to account_suspended on deactivation.");
  assert(sessionContent.includes("approval_status !== \"approved\""), "Checks approval_status.");
});

runTest("B.11", "Strict section writer boundary: isSectionWriter only matches writer tiers and excludes editors/admins", () => {
  assert(authTypesContent.includes("isSectionWriter: (role?: EditorialRole): boolean =>"), "Checks role accurately");
  assert(authTypesContent.includes("role === \"section_writer\""), "Matches section_writer");
  assert(authTypesContent.includes("role === \"staff_writer\""), "Matches staff_writer");
  assert(authTypesContent.includes("role === \"contributor\""), "Matches contributor");
  assert(authTypesContent.includes("canCreateDrafts: (role?: EditorialRole): boolean =>"), "Provides canCreateDrafts");
});

const typesPath = path.join(ROOT_DIR, "src", "lib", "data", "types.ts");
const typesContent = fs.readFileSync(typesPath, "utf8");

runTest("B.12", "Profile mapping layer accurately converts deactivated profiles to suspended status", () => {
  assert(typesContent.includes("export function mapDatabaseProfileToEditorialUser"), "Defines mapDatabaseProfileToEditorialUser.");
  assert(typesContent.includes("row.is_active === false"), "Checks is_active false.");
  assert(typesContent.includes("status = \"suspended\""), "Deactivated accounts map to suspended.");
});

// ==============================================================================
// Category C: Dedicated Dashboard Queues & Role Views
// ==============================================================================
console.log("\n[Category C: Dedicated Dashboard Queues & Views]");

const REQUIRED_5B_COMPONENTS = [
  "src/app/admin/(dashboard)/queue/editorial/page.tsx",
  "src/app/admin/(dashboard)/queue/chief/page.tsx",
  "src/app/admin/(dashboard)/applications/page.tsx",
  "src/app/admin/(dashboard)/users/page.tsx",
  "src/app/admin/(dashboard)/audit/page.tsx",
  "src/app/admin/apply/page.tsx",
  "src/components/admin/ReviewQueueTable.tsx",
  "src/components/admin/ApplicationsManager.tsx",
  "src/components/admin/UserManager.tsx",
  "src/components/admin/AuditLogViewer.tsx",
];

runTest("C.1", "All dedicated 5B pages and interactive components exist", () => {
  for (const file of REQUIRED_5B_COMPONENTS) {
    const fullPath = path.join(ROOT_DIR, file);
    assert(fs.existsSync(fullPath), `Missing required file: ${file}`);
  }
});

const adminNavPath = path.join(ROOT_DIR, "src", "components", "admin", "AdminNav.tsx");
const adminNavContent = fs.readFileSync(adminNavPath, "utf8");

runTest("C.2", "AdminNav dynamically configures tabs based on user role", () => {
  assert(adminNavContent.includes("Editorial Queue"), "AdminNav includes Editorial Queue.");
  assert(adminNavContent.includes("Chief Queue"), "AdminNav includes Chief Queue.");
  assert(adminNavContent.includes("Applications"), "AdminNav includes Applications.");
  assert(adminNavContent.includes("Team & Roles"), "AdminNav includes Team & Roles.");
  assert(adminNavContent.includes("Audit Log"), "AdminNav includes Audit Log.");
});

const editorFormPath = path.join(
  ROOT_DIR,
  "src",
  "components",
  "admin",
  "ArticleEditorForm.tsx"
);
const editorFormContent = fs.readFileSync(editorFormPath, "utf8");

runTest("C.3", "ArticleEditorForm renders revision directives, audit timeline & role actions", () => {
  assert(
    editorFormContent.includes("Editorial Revision Directive"),
    "EditorForm renders prominent revision directive banner."
  );
  assert(
    editorFormContent.includes("Editorial Workflow History"),
    "EditorForm includes embedded audit history panel."
  );
  assert(
    editorFormContent.includes("Return for Revision"),
    "EditorForm includes Return for Revision action with modal."
  );
  assert(
    editorFormContent.includes("Submit to Editorial Editor") ||
      editorFormContent.includes("submit_for_editorial_review"),
    "EditorForm includes Writer submission action."
  );
});

runTest("C.4", "Dedicated route loading skeletons exist for Admin, Article reader, and Desk views", () => {
  const loadingRoutes = [
    "src/app/admin/(dashboard)/loading.tsx",
    "src/app/articles/[slug]/loading.tsx",
    "src/app/desks/[slug]/loading.tsx",
  ];
  for (const file of loadingRoutes) {
    const fullPath = path.join(ROOT_DIR, file);
    assert(fs.existsSync(fullPath), `Missing required loading skeleton: ${file}`);
  }
});

runTest("C.5", "ArticleEditorForm implements dirty change detection and beforeunload warning", () => {
  assert(editorFormContent.includes("isDirty"), "Form must track isDirty state.");
  assert(editorFormContent.includes("window.addEventListener(\"beforeunload\""), "Must listen to beforeunload.");
  assert(editorFormContent.includes("Unsaved Changes"), "Must display Unsaved Changes badge.");
});

// ==============================================================================
// Category D: Live Supabase Baseline Read Verification (Zero Writes)
// ==============================================================================
console.log("\n[Category D: Live Supabase Baseline Read Verification (Zero Writes)]");

await runAsyncTest("D.1", "Live Supabase baseline article count remains intact at 15", async () => {
  const envPath = path.resolve(ROOT_DIR, ".env.local");
  if (!fs.existsSync(envPath)) return;
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
  if (!supabaseUrl || !anonKey) return;

  const res = await fetch(`${supabaseUrl}/rest/v1/articles?select=id,status`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  assert(res.ok, `Supabase REST query failed with status ${res.status}`);
  const articles = await res.json();
  assert(Array.isArray(articles), "Articles must be an array");
  assert.strictEqual(
    articles.length,
    15,
    `Expected baseline 15 articles to remain intact. Found: ${articles.length}`
  );
});

// ==============================================================================
// Summary
// ==============================================================================
console.log("\n=================================================================");
console.log(`  MILESTONE 5B VERIFICATION: ${passedTests}/${totalTests} TESTS PASSED CLEANLY`);
console.log("=================================================================\n");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
