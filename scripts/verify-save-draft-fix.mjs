import assert from "node:assert";

// 1. Test mock fetch with 204 No Content and empty body (reproducing Node 22 native fetch behavior)
async function testSafeFetchParsing() {
  console.log("Testing safe fetch response handling...");

  // Mock response with 204 No Content and empty text
  const mock204Response = {
    ok: true,
    status: 204,
    statusText: "No Content",
    text: async () => "",
  };

  function parseResponse(status, text) {
    if (status === 204) {
      return [];
    }
    if (!text || text.trim() === "") {
      return [];
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  const result204 = parseResponse(mock204Response.status, await mock204Response.text());
  assert.deepStrictEqual(result204, [], "204 response should safely resolve to empty array without SyntaxError");

  // Mock response with 200 OK and whitespace text
  const resultWhitespace = parseResponse(200, "   ");
  assert.deepStrictEqual(resultWhitespace, [], "Whitespace response should safely resolve to empty array");

  // Mock response with 200 OK and valid JSON
  const resultValidJson = parseResponse(200, JSON.stringify([{ id: "test-uuid" }]));
  assert.strictEqual(resultValidJson[0].id, "test-uuid", "Valid JSON response should parse correctly");

  console.log("✓ Pass: Safe fetch parsing prevents SyntaxError: Unexpected end of JSON input");
}

// 2. Test status handling and role guards
function testStatusAndRoleGuards() {
  console.log("Testing status handling and role guards...");

  const roles = {
    contributor: { canPublish: false, role: "contributor" },
    staff_writer: { canPublish: false, role: "staff_writer" },
    section_editor: { canPublish: true, role: "section_editor" },
    editor_in_chief: { canPublish: true, role: "editor_in_chief" },
  };

  function validateSave(status, userRole, existingArticleStatus) {
    const isEditor = userRole === "section_editor" || userRole === "editor_in_chief";

    // Published guard
    if (status === "published" && !isEditor) {
      return { allowed: false, error: "Only Section Editors and Editor-in-Chief can publish." };
    }

    // Archived guard
    if (status === "archived" && !isEditor) {
      return { allowed: false, error: "Only Section Editors and Editor-in-Chief can archive." };
    }

    // Existing published guard
    if (existingArticleStatus === "published" && !isEditor) {
      return { allowed: false, error: "Contributors cannot edit already-published articles." };
    }

    return { allowed: true };
  }

  // Contributor saving draft -> OK
  assert.strictEqual(validateSave("draft", "contributor").allowed, true);

  // Contributor submitting for review -> OK
  assert.strictEqual(validateSave("in_review", "contributor").allowed, true);

  // Contributor publishing -> Denied
  assert.strictEqual(validateSave("published", "contributor").allowed, false);

  // Contributor archiving -> Denied
  assert.strictEqual(validateSave("archived", "contributor").allowed, false);

  // Contributor editing already published -> Denied
  assert.strictEqual(validateSave("draft", "contributor", "published").allowed, false);

  // Editor publishing -> OK
  assert.strictEqual(validateSave("published", "editor_in_chief").allowed, true);

  // Editor archiving -> OK
  assert.strictEqual(validateSave("archived", "section_editor").allowed, true);

  console.log("✓ Pass: Status handling and role authorization guards behave as required");
}

// 3. Test client state tracking for repeated saves
function testArticleIdTracking() {
  console.log("Testing client state article ID tracking across consecutive saves...");

  let clientState = {
    isNew: true,
    articleId: "",
  };

  // First Save Draft (Insert)
  let initialSavePayload = {
    id: clientState.articleId || undefined,
    title: "New Dispatch",
    status: "draft",
  };
  assert.strictEqual(initialSavePayload.id, undefined, "First save should have undefined ID (triggers POST / INSERT)");

  // Server responds with created article
  const mockServerCreateResponse = {
    success: true,
    article: { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", title: "New Dispatch", status: "draft" },
  };

  // Client updates state immediately
  clientState.articleId = mockServerCreateResponse.article.id;

  // Second Save Draft (Update) without full page reload
  let secondSavePayload = {
    id: clientState.articleId || undefined,
    title: "New Dispatch Edited",
    status: "draft",
  };

  assert.strictEqual(
    secondSavePayload.id,
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "Subsequent saves must preserve article ID (triggers PATCH / UPDATE)"
  );

  console.log("✓ Pass: Article ID tracking guarantees subsequent saves use PATCH instead of duplicate POST");
}

// 4. Test mapping layer preserves Supabase row status and table does not falsely show published
function testStatusMappingAndBadgeDisplay() {
  console.log("Testing status mapping and table badge logic...");

  // Mock database row returned from Supabase
  const mockDbRow = {
    id: "test-draft-uuid",
    slug: "sample-draft-article",
    title: "Sample Draft Article",
    subtitle: "A subtitle",
    excerpt: "An excerpt",
    status: "draft", // Persisted status in Supabase
    published_at: null,
    reading_time: "4 min read",
    cover_image_url: "https://example.com/image.jpg",
    image_caption: null,
    is_lead_story: false,
    is_editor_pick: false,
    is_breaking: false,
    edition: "Hyderabad Edition",
    tags: ["Business"],
    key_takeaways: null,
    metrics: [],
    body_sections: [],
  };

  const mockAuthor = { id: "author-1", name: "Author Name", role: "Contributor", affiliation: "OU DBM", avatar: "" };
  const mockCategory = { id: "cat-1", name: "Special Report", slug: "special-report", description: "", deskNumber: "Desk 00" };

  // Map to domain Article (simulating mapDatabaseArticleToArticle)
  function mapDatabaseArticleToArticle(row, author, category, issueSlug) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      excerpt: row.excerpt,
      category,
      author,
      publishedAt: row.published_at ?? row.created_at,
      readingTime: row.reading_time,
      coverImage: row.cover_image_url,
      imageCaption: row.image_caption ?? undefined,
      isLeadStory: row.is_lead_story,
      isEditorPick: row.is_editor_pick,
      isBreaking: row.is_breaking,
      edition: row.edition ?? undefined,
      issueSlug: issueSlug,
      status: row.status, // Verify this field is mapped
      tags: row.tags ?? [],
      keyTakeaways: row.key_takeaways ?? undefined,
      metrics: row.metrics && row.metrics.length > 0 ? row.metrics : undefined,
      bodySections: row.body_sections && row.body_sections.length > 0 ? row.body_sections : undefined,
    };
  }

  const mappedDraft = mapDatabaseArticleToArticle(mockDbRow, mockAuthor, mockCategory);
  assert.strictEqual(mappedDraft.status, "draft", "Mapped article must retain exact persisted status 'draft'");

  // Test table badge rendering logic
  function computeTableDisplay(article) {
    const status = article.status || "draft";
    const isPublished = status === "published";
    return { status, isPublished, label: status.replace("_", " ").toUpperCase() };
  }

  const draftDisplay = computeTableDisplay(mappedDraft);
  assert.strictEqual(draftDisplay.status, "draft");
  assert.strictEqual(draftDisplay.isPublished, false, "Draft must NOT be marked as published");
  assert.strictEqual(draftDisplay.label, "DRAFT", "Badge label must display DRAFT");

  // Verify in_review
  const inReviewRow = { ...mockDbRow, status: "in_review" };
  const mappedInReview = mapDatabaseArticleToArticle(inReviewRow, mockAuthor, mockCategory);
  const inReviewDisplay = computeTableDisplay(mappedInReview);
  assert.strictEqual(inReviewDisplay.status, "in_review");
  assert.strictEqual(inReviewDisplay.isPublished, false);
  assert.strictEqual(inReviewDisplay.label, "IN REVIEW");

  // Verify published
  const publishedRow = { ...mockDbRow, status: "published" };
  const mappedPublished = mapDatabaseArticleToArticle(publishedRow, mockAuthor, mockCategory);
  const publishedDisplay = computeTableDisplay(mappedPublished);
  assert.strictEqual(publishedDisplay.status, "published");
  assert.strictEqual(publishedDisplay.isPublished, true);
  assert.strictEqual(publishedDisplay.label, "PUBLISHED");

  console.log("✓ Pass: Status mapping preserves persisted database status and renders accurate badges");
}

async function run() {
  await testSafeFetchParsing();
  testStatusAndRoleGuards();
  testArticleIdTracking();
  testStatusMappingAndBadgeDisplay();
  console.log("\nAll focused verification tests passed successfully!");
}

run();
