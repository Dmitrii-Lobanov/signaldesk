"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { editFeedback } from "../../actions";
import styles from "../../page.module.css";

type Props = {
  feedbackId: string;
  initialContent: string;
  initialVersion: number;
};

export function EditForm({
  feedbackId,
  initialContent,
  initialVersion,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [version, setVersion] = useState(initialVersion);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await editFeedback(feedbackId, content, version);

        if (!result.ok) {
          setMessage({ kind: "error", text: result.message });
          return;
        }

        setVersion(result.version);
        setMessage({ kind: "success", text: "Feedback edit saved." });
        router.refresh();
      } catch {
        setMessage({
          kind: "error",
          text: "Couldn’t confirm the edit. Your text is still here; try again.",
        });
      }
    });
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-labelledby="edit-heading"
    >
      <h2 id="edit-heading">Edit feedback</h2>
      <label htmlFor="edit-feedback-content">Feedback text</label>
      <textarea
        id="edit-feedback-content"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setMessage(null);
        }}
        disabled={isPending}
        maxLength={5000}
        required
        rows={5}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save edit"}
      </button>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
