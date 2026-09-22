/* eslint-disable @next/next/no-html-link-for-pages */
import { FeedbackForm } from "./feedback-form";
import styles from "./page.module.css";

type FeedbackItem = {
  id: string;
  content: string;
  createdAt: string;
};

export default async function Home() {
  let feedback: FeedbackItem[] = [];
  let loadFailed = false;

  try {
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
    const response = await fetch(`${apiBaseUrl}/feedback`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Feedback API returned ${response.status}`);
    }

    feedback = (await response.json()) as FeedbackItem[];
  } catch {
    loadFailed = true;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>SignalDesk</h1>
        <p>Capture customer feedback.</p>

        <FeedbackForm />

        <section aria-labelledby="feedback-heading">
          <h2 id="feedback-heading">Feedback</h2>

          {loadFailed ? (
            <p role="alert">
              Couldn&apos;t load feedback. <a href="/">Try again</a>
            </p>
          ) : feedback.length === 0 ? (
            <p>No feedback yet.</p>
          ) : (
            <ul className={styles.list}>
              {feedback.map((item) => (
                <li key={item.id}>{item.content}</li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}