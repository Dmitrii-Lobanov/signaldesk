import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FeedbackForm } from "./feedback-form";
import { SignOutButton } from "./sign-out-button";
import styles from "./page.module.css";
import Link from "next/link";
import type { FeedbackItem } from "../api/feedback";

const workspaceId = "11111111-1111-4111-8111-111111111111";

type CurrentUser = {
  id: string;
  email: string;
  memberships: Array<{
    workspaceId: string;
    role: "editor" | "viewer";
  }>;
};

export default async function Home() {
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

  let feedback: FeedbackItem[] = [];
  let loadFailed = false;
  let feedbackResponse: Response | undefined;

  try {
    feedbackResponse = await fetch(
      `${apiBaseUrl}/workspaces/${workspaceId}/feedback`,
      {
        headers: { Cookie: cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (feedbackResponse.ok) {
      feedback = (await feedbackResponse.json()) as FeedbackItem[];
    } else if (feedbackResponse.status !== 401) {
      loadFailed = true;
    }
  } catch {
    loadFailed = true;
  }

  if (feedbackResponse?.status === 401) redirect("/sign-in");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>SignalDesk</h1>
        <p>Signed in as {user.email}</p>
        <SignOutButton />

        {membership.role === "editor" && <FeedbackForm />}

        <section aria-labelledby="feedback-heading">
          <h2 id="feedback-heading">Feedback</h2>

          {loadFailed ? (
            <p role="alert">
              Couldn&apos;t load feedback. <Link href="/">Try again</Link>
            </p>
          ) : feedback.length === 0 ? (
            <p>No feedback yet.</p>
          ) : (
            <ul className={styles.list}>
              {feedback.map((item) => (
                <li key={item.id}>
                  <Link href={`/feedback/${item.id}`}>{item.content}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
