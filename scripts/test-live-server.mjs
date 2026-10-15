import assert from "assert";

console.log("\n=================================================================");
console.log("  LIVE HTTP ENDPOINT & AUTHENTICATION INTEGRATION TESTS");
console.log("=================================================================\n");

const BASE_URL = process.env.TEST_URL || "http://localhost:3001";

async function runLiveTests() {
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      process.exitCode = 1;
    }
  }

  // 1. Public Homepage
  await test("GET / (Public broadsheet) returns 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.strictEqual(html.includes("The Executive Brief"), true);
  });

  // 2. Public Article Detail Page
  await test("GET /articles/twin-cities-corridor-hyderabad-gcc-boom-management-education returns 200 OK", async () => {
    const res = await fetch(
      `${BASE_URL}/articles/twin-cities-corridor-hyderabad-gcc-boom-management-education`
    );
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.strictEqual(html.includes("Twin Cities Corridor"), true);
  });

  // 3. Login Page
  await test("GET /admin/login returns 200 OK without redirect", async () => {
    const res = await fetch(`${BASE_URL}/admin/login`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.strictEqual(html.includes("Executive Brief"), true);
  });

  // 4. Middleware Protection on /admin
  await test("GET /admin without session cookie redirects to /admin/login", async () => {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    // Next.js middleware returns 307 or 302 redirect
    assert.strictEqual(res.status >= 300 && res.status < 400, true);
    const location = res.headers.get("location");
    assert.strictEqual(location.includes("/admin/login"), true);
  });

  // 5. Auth API: Invalid Credentials Rejected
  await test("POST /api/auth/login with invalid password returns 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "editor@oudbm.ac.in", password: "wrong_password" }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 6. Auth API: Contributor Login
  let writerCookie = "";
  await test("POST /api/auth/login with writer credentials succeeds and sets session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "writer@oudbm.ac.in",
        password: "ExecutiveBrief2026!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, "staff_writer");

    const setCookie = res.headers.get("set-cookie");
    assert.strictEqual(Boolean(setCookie), true);
    assert.strictEqual(setCookie.includes("executive_brief_session"), true);
    writerCookie = setCookie.split(";")[0];
  });

  // 7. Security Guard: Contributor cannot publish directly
  await test("POST /api/admin/articles as Contributor attempting status='published' is rejected with 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: writerCookie,
      },
      body: JSON.stringify({
        title: "Unauthorized Direct Publish Attempt",
        status: "published",
      }),
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error.includes("Permission Denied"), true);
  });

  // 8. Contributor can save as 'draft'
  await test("POST /api/admin/articles as Contributor with status='draft' succeeds (200 OK)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: writerCookie,
      },
      body: JSON.stringify({
        title: "Legitimate Student Working Draft",
        status: "draft",
        excerpt: "Analyzing summer placement trends across Hyderabad BFSI firms.",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.article.status, "draft");
  });

  // 9. Auth API: Editor-in-Chief Login
  let editorCookie = "";
  await test("POST /api/auth/login with Editor-in-Chief credentials succeeds", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "editor@oudbm.ac.in",
        password: "ExecutiveBrief2026!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, "editor_in_chief");

    const setCookie = res.headers.get("set-cookie");
    editorCookie = setCookie.split(";")[0];
  });

  // 10. Editor-in-Chief can access protected /admin
  await test("GET /admin with Editor-in-Chief session cookie returns 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: editorCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.strictEqual(html.includes("Editorial Console"), true);
    assert.strictEqual(html.includes("Dr. V. Sudha"), true);
  });

  // 11. Editor-in-Chief can publish articles directly
  await test("POST /api/admin/articles as Editor-in-Chief with status='published' succeeds (200 OK)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: editorCookie,
      },
      body: JSON.stringify({
        title: "Executive Faculty Working Paper: Capital Allocation in Telangana Pharma",
        subtitle: "Empirical study on private equity investments across Genome Valley.",
        excerpt: "An in-depth empirical assessment of biopharma capital allocation trends.",
        status: "published",
        tags: ["Pharma", "Capital", "OU DBM Research"],
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.article.status, "published");
  });

  console.log("\n=================================================================");
  console.log(`  LIVE TEST SUMMARY: ${passed}/${total} TESTS PASSED CLEANLY`);
  console.log("=================================================================\n");
}

runLiveTests().catch((err) => {
  console.error("Live test suite execution failed:", err);
  process.exit(1);
});
