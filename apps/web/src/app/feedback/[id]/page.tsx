import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type {
  ClassificationOption,
  FeedbackClassification,
  FeedbackItem,
} from "../../../api/feedback";
import { ClassificationForm } from "./classification-form";
import styles from "../../page.module.css";

const workspaceId = "11111111-1111-4111-8111-111111111111";

export default async function FeedbackDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const requestedReturn = typeof from === "string" ? from : "/";
  const backHref =
    requestedReturn === "/" || requestedReturn.startsWith("/?")
      ? requestedReturn
      : "/";
  const retryHref = `/feedback/${encodeURIComponent(id)}?${new URLSearchParams({
    from: backHref,
  })}`;
  const cookie = (await headers()).get("cookie") ?? "";

  if (!cookie) redirect("/sign-in");

  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
  let response: Response;

  try {
    response = await fetch(
      `${apiBaseUrl}/workspaces/${workspaceId}/feedback/${encodeURIComponent(id)}`,
      {
        headers: { Cookie: cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return (
      <main className={styles.main}>
        <h1>Feedback</h1>
        <p role="alert">Couldn&apos;t reach SignalDesk. Try again.</p>
        <Link href={backHref}>Back to inbox</Link>
      </main>
    );
  }

  if (response.status === 401) redirect("/sign-in");

  if (response.status === 403) {
    return (
      <main className={styles.main}>
        <h1>Access denied</h1>
        <p>You cannot view feedback in this workspace.</p>
        <Link href={backHref}>Back to inbox</Link>
      </main>
    );
  }

  if (response.status === 404) {
    return (
      <main className={styles.main}>
        <h1>Feedback not found</h1>
        <p>This feedback item is unavailable.</p>
        <Link href={backHref}>Back to inbox</Link>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className={styles.main}>
        <h1>Feedback</h1>
        <p role="alert">Couldn&apos;t load this feedback item.</p>
        <Link href={retryHref}>Try again</Link>
        <Link href={backHref}>Back to inbox</Link>
      </main>
    );
  }

  const feedback = (await response.json()) as FeedbackItem;

  let classificationResponse: Response;
  let areasResponse: Response;
  let tagsResponse: Response;
  let userResponse: Response;

  try {
    [classificationResponse, areasResponse, tagsResponse, userResponse] =
      await Promise.all([
        fetch(
          `${apiBaseUrl}/workspaces/${workspaceId}/feedback/${encodeURIComponent(id)}/classification`,
          { headers: { Cookie: cookie }, cache: "no-store" },
        ),
        fetch(`${apiBaseUrl}/workspaces/${workspaceId}/product-areas`, {
          headers: { Cookie: cookie },
          cache: "no-store",
        }),
        fetch(`${apiBaseUrl}/workspaces/${workspaceId}/tags`, {
          headers: { Cookie: cookie },
          cache: "no-store",
        }),
        fetch(`${apiBaseUrl}/me`, {
          headers: { Cookie: cookie },
          cache: "no-store",
        }),
      ]);
  } catch {
    return (
      <main className={styles.main}>
        <h1>Feedback detail</h1>
        <p role="alert">Couldn&apos;t load classification. Try again.</p>
        <Link href={retryHref}>Try again</Link>
      </main>
    );
  }

  if (
    [classificationResponse, areasResponse, tagsResponse, userResponse].some(
      (item) => item.status === 401,
    )
  ) {
    redirect("/sign-in");
  }

  if (
    [classificationResponse, areasResponse, tagsResponse, userResponse].some(
      (item) => item.status === 403,
    )
  ) {
    return (
      <main className={styles.main}>
        <h1>Access denied</h1>
        <p>You cannot view classification in this workspace.</p>
        <Link href={backHref}>Back to inbox</Link>
      </main>
    );
  }

  if (
    !classificationResponse.ok ||
    !areasResponse.ok ||
    !tagsResponse.ok ||
    !userResponse.ok
  ) {
    return (
      <main className={styles.main}>
        <h1>Feedback detail</h1>
        <p role="alert">Couldn&apos;t load classification. Try again.</p>
        <Link href={retryHref}>Try again</Link>
      </main>
    );
  }

  const classification =
    (await classificationResponse.json()) as FeedbackClassification;
  const areas = (await areasResponse.json()) as ClassificationOption[];
  const tags = (await tagsResponse.json()) as ClassificationOption[];
  const user = (await userResponse.json()) as {
    memberships: Array<{
      workspaceId: string;
      role: "editor" | "viewer";
    }>;
  };

  const isEditor = user.memberships.some(
    (membership) =>
      membership.workspaceId === workspaceId && membership.role === "editor",
  );

  const areaName =
    areas.find((area) => area.id === classification.productAreaId)?.name ??
    "None";
  const tagNames = classification.tagIds.map(
    (tagId) => tags.find((tag) => tag.id === tagId)?.name ?? "Unavailable tag",
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href={backHref}>Back to inbox</Link>
        <article aria-labelledby="feedback-title">
          <h1 id="feedback-title">Feedback detail</h1>
          <p className={styles.feedbackContent}>{feedback.content}</p>
          <dl>
            <dt>Source</dt>
            <dd>{feedback.source}</dd>
            <dt>Occurred</dt>
            <dd>{new Date(feedback.occurredAt).toLocaleString()}</dd>
            <dt>Recorded</dt>
            <dd>{new Date(feedback.createdAt).toLocaleString()}</dd>
          </dl>
        </article>

        <section aria-labelledby="classification-heading">
          <h2 id="classification-heading">Classification</h2>
          <p>Product area: {areaName}</p>
          <p>Tags: {tagNames.length > 0 ? tagNames.join(", ") : "None"}</p>
        </section>

        {isEditor && (
          <ClassificationForm
            feedbackId={id}
            classification={classification}
            areas={areas}
            tags={tags}
          />
        )}
      </main>
    </div>
  );
}
