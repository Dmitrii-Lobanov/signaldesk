import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import pg from "pg";
import { expect, test } from "@playwright/test";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || new URL(databaseUrl).pathname !== "/signaldesk_test") {
  throw new Error("Browser test requires signaldesk_test");
}

const workspaceId = "11111111-1111-4111-8111-111111111111";
const runId = randomUUID();
const editorEmail = `browser-editor-${runId}@example.invalid`;
const viewerEmail = `browser-viewer-${runId}@example.invalid`;
const password = "Browser-test-only-password-123!";
const original = `Browser journey original ${runId}`;
const edited = `Browser journey edited ${runId}`;
const stale = `Browser journey stale ${runId}`;

const pool = new Pool({ connectionString: databaseUrl });
let editorUserId;
let createdFeedbackId;

test.beforeAll(async () => {
  await pool.query(
    `INSERT INTO workspaces (id, name)
     VALUES ($1, 'Browser test workspace')
     ON CONFLICT (id) DO NOTHING`,
    [workspaceId],
  );

  // Public sign-up stays disabled. Only this test fixture creates users.
  const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: "http://localhost:3100",
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
    },
  });

  await auth.api.signUpEmail({
    body: {
      name: "Browser test editor",
      email: editorEmail,
      password,
    },
  });

  await auth.api.signUpEmail({
    body: {
      name: "Browser test viewer",
      email: viewerEmail,
      password,
    },
  });

  const users = await pool.query(
    'SELECT "id", "email" FROM "user" WHERE "email" = ANY($1::text[])',
    [[editorEmail, viewerEmail]],
  );

  editorUserId = users.rows.find((user) => user.email === editorEmail)?.id;
  const viewerUserId = users.rows.find(
    (user) => user.email === viewerEmail,
  )?.id;

  if (!editorUserId || !viewerUserId) {
    throw new Error("Browser test users were not created");
  }

  await pool.query(
    `INSERT INTO workspace_memberships (workspace_id, user_id, role)
     VALUES ($1, $2, 'editor'), ($1, $3, 'viewer')`,
    [workspaceId, editorUserId, viewerUserId],
  );
});

test.afterAll(async () => {
  try {
    // Include the ID when available and the unique text as a fallback if
    // the test stopped just after creating feedback.
    const found = await pool.query(
      `SELECT id FROM feedback
       WHERE workspace_id = $1
         AND content = ANY($2::text[])`,
      [workspaceId, [original, edited, stale]],
    );

    const ids = [
      ...new Set([
        ...found.rows.map((row) => row.id),
        ...(createdFeedbackId ? [createdFeedbackId] : []),
      ]),
    ];

    if (ids.length > 0) {
      await pool.query(
        "DELETE FROM audit_events WHERE feedback_id = ANY($1::uuid[])",
        [ids],
      );
      await pool.query("DELETE FROM feedback WHERE id = ANY($1::uuid[])", [
        ids,
      ]);
    }

    await pool.query('DELETE FROM "user" WHERE "email" = ANY($1::text[])', [
      [editorEmail, viewerEmail],
    ]);
  } finally {
    await pool.end();
  }
});

test("editor creates and edits feedback; history names the actor; stale edit is rejected", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Email" }).fill(editorEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3100/");

  await page.getByRole("textbox", { name: "Customer feedback" }).fill(original);
  await page.getByRole("button", { name: "Save feedback" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Feedback saved." }),
  ).toBeVisible();

  await page.getByRole("link", { name: new RegExp(original) }).click();
  await expect(
    page.getByRole("heading", { name: "Feedback detail" }),
  ).toBeVisible();

  const detailUrl = page.url();
  createdFeedbackId = new URL(detailUrl).pathname.split("/").at(-1);
  expect(createdFeedbackId).toMatch(/^[0-9a-f-]{36}$/i);

  // Open a second, already authenticated tab before the successful edit.
  // It keeps the old version and will submit a stale change later.
  const stalePage = await context.newPage();
  await stalePage.goto(detailUrl);
  await stalePage.getByRole("textbox", { name: "Feedback text" }).fill(stale);

  await page.getByRole("textbox", { name: "Feedback text" }).fill(edited);
  await page.getByRole("button", { name: "Save edit" }).click();
  await expect(
    page.getByRole("status").filter({
      hasText: "Feedback edit saved.",
    }),
  ).toBeVisible();

  await expect(page.getByRole("article").getByText(edited)).toBeVisible();

  const history = page.locator('section[aria-labelledby="history-heading"]');

  await expect(
    history.locator("li").filter({
      hasText: `Edited by ${editorEmail}`,
    }),
  ).toHaveCount(1);

  await stalePage.getByRole("button", { name: "Save edit" }).click();

  await expect(
    stalePage.getByRole("alert").filter({
      hasText: "Someone changed this feedback",
    }),
  ).toBeVisible();

  await expect(
    stalePage.getByRole("textbox", { name: "Feedback text" }),
  ).toHaveValue(stale);

  // The browser result is backed by one creation and one edit audit event.
  const events = await pool.query(
    `SELECT action, actor_user_id, "before", "after"
     FROM audit_events
     WHERE workspace_id = $1 AND feedback_id = $2
     ORDER BY created_at, id`,
    [workspaceId, createdFeedbackId],
  );

  expect(events.rows.map((event) => event.action)).toEqual([
    "feedback.created",
    "feedback.edited",
  ]);
  expect(events.rows[1].actor_user_id).toBe(editorUserId);
  expect(events.rows[1].before).toEqual({
    content: original,
    version: 1,
  });
  expect(events.rows[1].after).toEqual({
    content: edited,
    version: 2,
  });

  // A viewer can inspect the result and actor, but cannot edit it.
  const viewerContext = await browser.newContext();
  try {
    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto("/sign-in");
    await viewerPage.getByRole("textbox", { name: "Email" }).fill(viewerEmail);
    await viewerPage.getByLabel("Password").fill(password);
    await viewerPage.getByRole("button", { name: "Sign in" }).click();
    await expect(viewerPage).toHaveURL("http://localhost:3100/");

    await viewerPage.goto(detailUrl);
    await expect(
      viewerPage.getByRole("article").getByText(edited),
    ).toBeVisible();
    await expect(
      viewerPage
        .locator('section[aria-labelledby="history-heading"] li')
        .filter({ hasText: `Edited by ${editorEmail}` }),
    ).toHaveCount(1);
    await expect(
      viewerPage.getByRole("button", { name: "Save edit" }),
    ).toHaveCount(0);
  } finally {
    await viewerContext.close();
  }
});
