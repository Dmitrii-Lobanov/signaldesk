import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ClassificationOption, FeedbackPage } from "../api/feedback";
import { FeedbackForm } from "./feedback-form";
import { SignOutButton } from "./sign-out-button";
import styles from "./page.module.css";
import { InboxHeader } from "./feedback/components/inbox-header";
import { InboxPanel } from "./feedback/components/inbox-panel";
import { inboxUrl } from "./feedback/components/inbox-url";

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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <InboxHeader email={user.email} />

        {membership.role === "editor" && (
          <section className={styles.panel} aria-labelledby="capture-heading">
            <h2 id="capture-heading">Capture feedback</h2>
            <FeedbackForm />
          </section>
        )}

        <InboxPanel
          filters={filters}
          cursors={cursors}
          areas={areas}
          tags={tags}
          page={page}
          loadFailed={loadFailed}
          invalidQuery={pageResponse.status === 400}
        />
      </main>
    </div>
  );
}
