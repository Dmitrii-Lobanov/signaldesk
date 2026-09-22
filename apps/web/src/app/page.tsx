import Link from "next/link";
import styles from "./page.module.css";

export default async function Home() {
  let apiMessage: string | null = null;
  let apiFailed = false;

  try {
    const response = await fetch("http://localhost:3001", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    apiMessage = await response.text();
  } catch {
    apiFailed = true;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>SignalDesk</h1>
        <p>Capture customer feedback.</p>

        {apiFailed ? (
          <div role="alert">
            <p>Couldn&apos;t connect to the feedback service.</p>
            <Link href="/">Try again</Link>
          </div>
        ) : (
          <p>API says: {apiMessage}</p>
        )}
      </main>
    </div>
  );
}