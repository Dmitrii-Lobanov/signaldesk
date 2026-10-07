import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type {
  AuditEvent,
  ClassificationOption,
  FeedbackClassification,
  FeedbackItem,
} from "../../../api/feedback";
import { ClassificationForm } from "./classification-form";
import { EditForm } from "./edit-form";
import styles from "../../page.module.css";

const workspaceId = "11111111-1111-4111-8111-111111111111";

type CurrentUser = {
  memberships: Array<{
    workspaceId: string;
    role: "editor" | "viewer";
  }>;
};

type DetailStateProps = {
  title: string;
  message: string;
  backHref: string;
  retryHref?: string;
};

function DetailState({
  title,
  message,
  backHref,
  retryHref,
}: DetailStateProps) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>{title}</h1>
        <p role={retryHref ? "alert" : undefined}>{message}</p>
        {retryHref && <Link href={retryHref}>Try again</Link>}
        <Link href={backHref}>Back to inbox</Link>
      </main>
    </div>
  );
}

function returnToInbox(from: string | string[] | undefined): string {
  const requested = typeof from === "string" ? from : "/";
  return requested === "/" || requested.startsWith("/?") ? requested : "/";
}

async function fetchApi(
  apiBaseUrl: string,
  path: string,
  cookie: string,
): Promise<Response | null> {
  try {
    return await fetch(`${apiBaseUrl}${path}`, {
      headers: { Cookie: cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return null;
  }
}

export default async function FeedbackDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = returnToInbox(from);
  const retryHref = `/feedback/${encodeURIComponent(id)}?${new URLSearchParams({
    from: backHref,
  })}`;
  const cookie = (await headers()).get("cookie") ?? "";

  if (!cookie) redirect("/sign-in");

  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
  const workspacePath = `/workspaces/${workspaceId}`;
  const feedbackPath = `${workspacePath}/feedback/${encodeURIComponent(id)}`;

  const feedbackResponse = await fetchApi(apiBaseUrl, feedbackPath, cookie);

  if (feedbackResponse?.status === 401) redirect("/sign-in");

  if (feedbackResponse?.status === 403) {
    return (
      <DetailState
        title="Access denied"
        message="You cannot view feedback in this workspace."
        backHref={backHref}
      />
    );
  }

  if (feedbackResponse?.status === 404) {
    return (
      <DetailState
        title="Feedback not found"
        message="This feedback item is unavailable."
        backHref={backHref}
      />
    );
  }

  if (!feedbackResponse?.ok) {
    return (
      <DetailState
        title="Feedback"
        message="Couldn't load this feedback item."
        backHref={backHref}
        retryHref={retryHref}
      />
    );
  }

  const feedback = (await feedbackResponse.json()) as FeedbackItem;

  const [classificationResponse, areasResponse, tagsResponse, userResponse] =
    await Promise.all([
      fetchApi(apiBaseUrl, `${feedbackPath}/classification`, cookie),
      fetchApi(apiBaseUrl, `${workspacePath}/product-areas`, cookie),
      fetchApi(apiBaseUrl, `${workspacePath}/tags`, cookie),
      fetchApi(apiBaseUrl, "/me", cookie),
    ]);

  const historyResponse = await fetchApi(
    apiBaseUrl,
    `${feedbackPath}/history`,
    cookie,
  );

  const relatedResponses = [
    classificationResponse,
    areasResponse,
    tagsResponse,
    userResponse,
  ];

  if (relatedResponses.some((response) => response?.status === 401)) {
    redirect("/sign-in");
  }

  if (historyResponse?.status === 403) {
    return (
      <DetailState
        title="Access denied"
        message="You cannot view feedback history in this workspace."
        backHref={backHref}
      />
    );
  }

  if (relatedResponses.some((response) => response?.status === 403)) {
    return (
      <DetailState
        title="Access denied"
        message="You cannot view classification in this workspace."
        backHref={backHref}
      />
    );
  }

  if (
    !classificationResponse?.ok ||
    !areasResponse?.ok ||
    !tagsResponse?.ok ||
    !userResponse?.ok
  ) {
    return (
      <DetailState
        title="Feedback detail"
        message="Couldn't load classification."
        backHref={backHref}
        retryHref={retryHref}
      />
    );
  }

  const [classification, areas, tags, user] = (await Promise.all([
    classificationResponse.json(),
    areasResponse.json(),
    tagsResponse.json(),
    userResponse.json(),
  ])) as [
    FeedbackClassification,
    ClassificationOption[],
    ClassificationOption[],
    CurrentUser,
  ];

  const history = historyResponse?.ok
    ? ((await historyResponse.json()) as AuditEvent[])
    : null;

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
          <EditForm
            feedbackId={id}
            initialContent={feedback.content}
            initialVersion={feedback.version}
          />
        )}

        <section aria-labelledby="history-heading">
          <h2 id="history-heading">Change history</h2>
          {history === null ? (
            <p role="alert">
              Couldn’t load change history.{" "}
              <Link href={retryHref}>Try again</Link>
            </p>
          ) : history.length === 0 ? (
            <p>No recorded changes for this feedback item.</p>
          ) : (
            <ol>
              {history.map((event) => (
                <li key={event.id}>
                  {event.action === "feedback.created"
                    ? "Created"
                    : event.action === "feedback.edited"
                      ? "Edited"
                      : "Classified"}{" "}
                  by {event.actorEmail ?? event.actorUserId} on{" "}
                  <time dateTime={event.createdAt}>
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
          )}
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
