import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ClassificationOption, FeedbackPage } from "../api/feedback";
import { FeedbackForm } from "./feedback-form";
import { SignOutButton } from "./sign-out-button";
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
          Couldn&apos;t load the inbox. <Link href={inboxUrl(filters, cursors)}>Try again</Link>
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

  const loadFailed =
    !pageResponse.ok || !areasResponse.ok || !tagsResponse.ok;
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
  const nextCursors = page?.nextCursor
    ? [...cursors, page.nextCursor]
    : [];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>SignalDesk</h1>
        <p>Signed in as {user.email}</p>
        <SignOutButton />

        {membership.role === "editor" && <FeedbackForm />}

        <section aria-labelledby="feedback-heading">
          <h2 id="feedback-heading">Feedback</h2>

          <form action="/" method="get" className={styles.filters}>
            <div>
              <label htmlFor="feedback-search">Search feedback</label>
              <input
                id="feedback-search"
                name="q"
                type="search"
                maxLength={200}
                defaultValue={filters.q}
              />
            </div>

            <div>
              <label htmlFor="filter-area">Product area</label>
              <select id="filter-area" name="area" defaultValue={filters.area}>
                <option value="">All areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-tag">Tag</label>
              <select id="filter-tag" name="tag" defaultValue={filters.tag}>
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit">Apply filters</button>
            <Link href="/">Clear filters</Link>
          </form>

          {loadFailed ? (
            <p role="alert">
              {pageResponse.status === 400
                ? "These filters or this page link are invalid."
                : "Couldn't load feedback."}{" "}
              <Link href={inboxUrl(filters)}>Try the first page</Link>
            </p>
          ) : page?.items.length === 0 ? (
            <p role="status">No feedback matches these filters.</p>
          ) : (
            <>
              <ul className={styles.list}>
                {page?.items.map((item) => (
                  <li key={item.id}>
                    <Link href={`/feedback/${item.id}`}>{item.content}</Link>
                  </li>
                ))}
              </ul>

              <nav aria-label="Feedback pages" className={styles.pagination}>
                {cursors.length > 0 && (
                  <Link href={inboxUrl(filters, previousCursors)}>
                    Previous page
                  </Link>
                )}
                {page?.nextCursor && (
                  <Link href={inboxUrl(filters, nextCursors)}>Next page</Link>
                )}
              </nav>
            </>
          )}
        </section>
      </main>
    </div>
  );
}