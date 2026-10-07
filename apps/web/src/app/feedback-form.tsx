"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
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
  const requestKeyRef = useRef<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      setMessage({ kind: "error", text: "Feedback must not be empty." });
      return;
    }

    // Keep this key after a network error or timeout. The first request
    // may have reached the API even when the browser did not get its reply.
    const requestKey = requestKeyRef.current ?? crypto.randomUUID();
    requestKeyRef.current = requestKey;
    const submittedContent = content;
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await createFeedback(submittedContent, requestKey);

        if (!result.ok) {
          setMessage({ kind: "error", text: result.message });
          return;
        }

        requestKeyRef.current = null;
        setContent("");
        setMessage({ kind: "success", text: "Feedback saved." });
        router.refresh();
      } catch {
        setMessage({
          kind: "error",
          text: "Couldn’t confirm whether feedback was saved. Try again.",
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
        onChange={(event) => {
          setContent(event.target.value);
          requestKeyRef.current = null;
          setMessage(null);
        }}
        disabled={isPending}
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
