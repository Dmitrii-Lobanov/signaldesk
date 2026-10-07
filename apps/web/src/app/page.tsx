import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ClassificationOption, FeedbackPage } from "../api/feedback";
import { FeedbackForm } from "./feedback-form";
import { SignOutButton } from "./sign-out-button";
import { InboxFilters } from "./inbox-filters";
import styles from "./page.module.css";

const workspaceId = "11111111-1111-4111-8111-111111111111";

type CurrentUser = {
  email: string;
  memberships: Array<{
    workspaceId: string;
    role: "editor" | "viewer";
  }>;
};

type InboxParams = {
  q?: string;
  area?: string;
  tag?: string;
  cursor?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function inboxUrl(
  filters: { q: string; area: string; tag: string },
  cursors: string[] = [],
): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.area) params.set("area", filters.area);
  if (filters.tag) params.set("tag", filters.tag);
  for (const cursor of cursors) params.append("cursor", cursor);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<InboxParams>;
}) {
  const rawParams = await searchParams;
  const filters = {
    q: first(rawParams.q).trim(),
    area: first(rawParams.area),
    tag: first(rawParams.tag),
  };
  const cursors = rawParams.cursor
    ? Array.isArray(rawParams.cursor)
      ? rawParams.cursor
      : [rawParams.cursor]
    : [];

  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
  const cookie = (await headers()).get("cookie") ?? "";

  if (!cookie) redirect("/sign-in");

  let userResponse: Response;

  try {
    userResponse = await fetch(`${apiBaseUrl}/me`, {
      headers: { Cookie: cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return <p role="alert">Couldn&apos;t reach SignalDesk. Try again.</p>;
  }

  if (userResponse.status === 401) redirect("/sign-in");

  if (!userResponse.ok) {
    return <p role="alert">Couldn&apos;t load your account. Try again.</p>;
  }

  const user = (await userResponse.json()) as CurrentUser;
  const membership = user.memberships.find(
    (item) => item.workspaceId === workspaceId,
  );

  if (!membership) {
    return (
      <main className={styles.main}>
        <h1>Access denied</h1>
        <p>You do not belong to this workspace.</p>
        <SignOutButton />
      </main>
    );
  }

  const apiParams = new URLSearchParams({ limit: "20" });
  if (filters.q) apiParams.set("q", filters.q);
  if (filters.area) apiParams.set("productAreaId", filters.area);
  if (filters.tag) apiParams.set("tagId", filters.tag);
  if (cursors.length > 0) {
    apiParams.set("cursor", cursors[cursors.length - 1]);
  }

  let pageResponse: Response;
  let areasResponse: Response;
  let tagsResponse: Response;

  try {
    [pageResponse, areasResponse, tagsResponse] = await Promise.all([
      fetch(
        `${apiBaseUrl}/workspaces/${workspaceId}/feedback/page?${apiParams}`,
        {
          headers: { Cookie: cookie },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      ),
      fetch(`${apiBaseUrl}/workspaces/${workspaceId}/product-areas`, {
        headers: { Cookie: cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`${apiBaseUrl}/workspaces/${workspaceId}/tags`, {
        headers: { Cookie: cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
    ]);
  } catch {
    return (
      <main className={styles.main}>
        <h1>SignalDesk</h1>
        <p role="alert">
          Couldn&apos;t load the inbox.{" "}
          <Link href={inboxUrl(filters, cursors)}>Try again</Link>
        </p>
      </main>
    );
  }

  if (
    [pageResponse, areasResponse, tagsResponse].some(
      (response) => response.status === 401,
    )
  ) {
    redirect("/sign-in");
  }

  if (
    [pageResponse, areasResponse, tagsResponse].some(
      (response) => response.status === 403,
    )
  ) {
    return (
      <main className={styles.main}>
        <h1>Access denied</h1>
        <p>You cannot view this workspace&apos;s inbox.</p>
      </main>
    );
  }

  const loadFailed = !pageResponse.ok || !areasResponse.ok || !tagsResponse.ok;
  const page = pageResponse.ok
    ? ((await pageResponse.json()) as FeedbackPage)
    : null;
  const areas = areasResponse.ok
    ? ((await areasResponse.json()) as ClassificationOption[])
    : [];
  const tags = tagsResponse.ok
    ? ((await tagsResponse.json()) as ClassificationOption[])
    : [];

  const previousCursors = cursors.slice(0, -1);
  const nextCursors = page?.nextCursor ? [...cursors, page.nextCursor] : [];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>WORKSPACE INBOX</p>
            <h1>Feedback</h1>
            <p className={styles.intro}>
              Find customer signals and turn them into organized evidence.
            </p>
          </div>
          <div className={styles.account}>
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </header>

        {membership.role === "editor" && (
          <section className={styles.panel} aria-labelledby="capture-heading">
            <h2 id="capture-heading">Capture feedback</h2>
            <FeedbackForm />
          </section>
        )}

        <section className={styles.panel} aria-labelledby="feedback-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>BROWSE</p>
              <h2 id="feedback-heading">Inbox</h2>
            </div>
          </div>

          <InboxFilters
            key={`${filters.q}|${filters.area}|${filters.tag}`}
            filters={filters}
            areas={areas}
            tags={tags}
          />

          {loadFailed ? (
            <p role="alert" className={styles.message}>
              {pageResponse.status === 400
                ? "These filters or this page link are invalid."
                : "Couldn't load feedback."}{" "}
              <Link href={inboxUrl(filters)}>Try the first page</Link>
            </p>
          ) : page?.items.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <h3>No matching feedback</h3>
              <p>Try a different search or clear the filters.</p>
            </div>
          ) : (
            <>
              <p className={styles.resultCount} role="status">
                Showing {page?.items.length ?? 0} feedback items
              </p>
              <ul className={styles.list}>
                {page?.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      className={styles.feedbackLink}
                      href={`/feedback/${item.id}?${new URLSearchParams({
                        from: inboxUrl(filters, cursors),
                      })}`}
                    >
                      <span className={styles.feedbackText}>
                        {item.content}
                      </span>
                      <span className={styles.feedbackMeta}>
                        {item.source} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <nav aria-label="Feedback pages" className={styles.pagination}>
                {cursors.length > 0 && (
                  <Link href={inboxUrl(filters, previousCursors)}>
                    ← Previous page
                  </Link>
                )}
                {page?.nextCursor && (
                  <Link href={inboxUrl(filters, nextCursors)}>Next page →</Link>
                )}
              </nav>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
