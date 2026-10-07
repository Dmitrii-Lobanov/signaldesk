import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FeedbackItem } from "../../../api/feedback";
import styles from "../../page.module.css";

const workspaceId = "11111111-1111-4111-8111-111111111111";

export default async function FeedbackDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <Link href="/">Back to inbox</Link>
      </main>
    );
  }

  if (response.status === 401) redirect("/sign-in");

  if (response.status === 403) {
    return (
      <main className={styles.main}>
        <h1>Access denied</h1>
        <p>You cannot view feedback in this workspace.</p>
        <Link href="/">Back to inbox</Link>
      </main>
    );
  }

  if (response.status === 404) {
    return (
      <main className={styles.main}>
        <h1>Feedback not found</h1>
        <p>This feedback item is unavailable.</p>
        <Link href="/">Back to inbox</Link>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className={styles.main}>
        <h1>Feedback</h1>
        <p role="alert">Couldn&apos;t load this feedback item.</p>
        <Link href={`/feedback/${encodeURIComponent(id)}`}>Try again</Link>
        <Link href="/">Back to inbox</Link>
      </main>
    );
  }

  const feedback = (await response.json()) as FeedbackItem;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/">Back to inbox</Link>
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
      </main>
    </div>
  );
}
