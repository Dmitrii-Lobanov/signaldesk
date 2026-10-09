"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  ClassificationOption,
  FeedbackClassification,
} from "../../../api/feedback";
import { saveFeedbackClassification } from "../../actions";
import styles from "../../page.module.css";

type Props = {
  feedbackId: string;
  classification: FeedbackClassification;
  areas: ClassificationOption[];
  tags: ClassificationOption[];
};

export function ClassificationForm({
  feedbackId,
  classification,
  areas,
  tags,
}: Props) {
  const router = useRouter();
  const [areaId, setAreaId] = useState(classification.productAreaId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(classification.tagIds);
  const [version, setVersion] = useState(classification.version);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleTag(tagId: string, checked: boolean) {
    setTagIds((current) =>
      checked ? [...current, tagId] : current.filter((id) => id !== tagId),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await saveFeedbackClassification(feedbackId, {
        productAreaId: areaId || null,
        tagIds,
        expectedVersion: version,
      });

      if (!result.ok) {
        setMessage({ kind: "error", text: result.message });
        return;
      }

      setVersion(result.version);
      setMessage({ kind: "success", text: "Classification saved." });
      router.refresh();
    });
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-labelledby="classify-heading"
    >
      <h2 id="classify-heading">Classify feedback</h2>

      <label htmlFor="product-area">Product area</label>
      <select
        id="product-area"
        value={areaId}
        onChange={(event) => setAreaId(event.target.value)}
      >
        <option value="">No product area</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>

      <fieldset className={styles.tagChoices}>
        <legend>Tags</legend>
        {tags.length === 0 ? (
          <p>No tags available.</p>
        ) : (
          tags.map((tag) => (
            <label key={tag.id}>
              <input
                type="checkbox"
                checked={tagIds.includes(tag.id)}
                onChange={(event) => toggleTag(tag.id, event.target.checked)}
              />
              {tag.name}
            </label>
          ))
        )}
      </fieldset>

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save classification"}
      </button>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
