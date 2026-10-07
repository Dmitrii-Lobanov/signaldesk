import { SignOutButton } from "@/app/sign-out-button";
import styles from "../../../page.module.css";

export function InboxHeader({ email }: { email: string }) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>WORKSPACE INBOX</p>
        <h1>Feedback</h1>
        <p className={styles.intro}>
          Find customer signals and turn them into organized evidence.
        </p>
      </div>
      <div className={styles.account}>
        <span>{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
