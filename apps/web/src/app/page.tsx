import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Signal Desk</h1>

        <p>Capture customer feedback</p>
      </main>
    </div>
  );
}
