"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const candidate = response.headers.get("x-request-id");

        const reference =
          candidate &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            candidate,
          )
            ? ` Reference: ${candidate}`
            : "";

        const explanation =
          response.status === 429
            ? "Too many sign-in attempts. Wait a minute, then try again."
            : response.status >= 500
              ? "Sign-in is unavailable. Please try again."
              : "Sign-in failed. Check your email and password.";

        setMessage(`${explanation}${reference}`);

        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Sign-in is unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Sign in to SignalDesk</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
          {message && <p role="alert">{message}</p>}
        </form>
      </main>
    </div>
  );
}
