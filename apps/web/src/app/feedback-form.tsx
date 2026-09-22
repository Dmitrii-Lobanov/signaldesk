"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createFeedback } from "./actions";
import styles from "./page.module.css";

type Message = {
  kind: "success" | "error";
  text: string;
};

export function FeedbackForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      setMessage({ kind: "error", text: "Feedback must not be empty." });
      return;
    }

    setMessage(null);

    startTransition(async () => {
      try {
        const result = await createFeedback(content);

        if (!result.ok) {
          setMessage({ kind: "error", text: result.message });
          return;
        }

        setContent("");
        setMessage({ kind: "success", text: "Feedback saved." });
        router.refresh();
      } catch {
        setMessage({
          kind: "error",
          text: "Couldn’t save feedback. Please try again.",
        });
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="feedback-content">Customer feedback</label>
      <textarea
        id="feedback-content"
        name="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={5000}
        required
        rows={5}
      />

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save feedback"}
      </button>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </form>
  );
}