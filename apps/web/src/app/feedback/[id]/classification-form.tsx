"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  ClassificationOption,
  ClassificationSuggestion,
  FeedbackClassification,
} from "../../../api/feedback";
import {
  requestClassificationSuggestion,
  saveFeedbackClassification,
} from "../../actions";
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
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(
    null,
  );
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

  function requestSuggestion() {
    setMessage(null);

    startTransition(async () => {
      const result = await requestClassificationSuggestion(feedbackId);

      console.log("suggestion result", result, "feedbackId", feedbackId);

      if (!result.ok) {
        setMessage({ kind: "error", text: result.message });
        return;
      }

      setSuggestion(result.suggestion);
      setMessage({
        kind: "success",
        text: "Suggestion ready. Review it before saving.",
      });
    });
  }

  function rejectSuggestion() {
    setSuggestion(null);
    setMessage({
      kind: "success",
      text: "Suggestion rejected. Your manual choices are unchanged.",
    });
  }

  function editSuggestion() {
    if (!suggestion) return;

    setAreaId(suggestion.productAreaId ?? "");
    setTagIds(suggestion.tagIds);
    setVersion(suggestion.feedbackVersion);
    setSuggestion(null);
    setMessage({
      kind: "success",
      text: "Suggestion copied into the form. Review and save your changes.",
    });
  }

  async function saveSelection(
    selection: {
      productAreaId: string | null;
      tagIds: string[];
      expectedVersion: number;
    },
    successMessage: string,
  ) {
    const result = await saveFeedbackClassification(feedbackId, selection);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setAreaId(selection.productAreaId ?? "");
    setTagIds(selection.tagIds);
    setVersion(result.version);
    setSuggestion(null);
    setMessage({ kind: "success", text: successMessage });
    router.refresh();
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setMessage(null);

    startTransition(async () => {
      await saveSelection(
        {
          productAreaId: suggestion.productAreaId,
          tagIds: suggestion.tagIds,
          expectedVersion: suggestion.feedbackVersion,
        },
        "Suggestion accepted and classification saved.",
      );
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      await saveSelection(
        {
          productAreaId: areaId || null,
          tagIds,
          expectedVersion: version,
        },
        "Classification saved.",
      );
    });
  }

  const suggestedArea =
    areas.find((area) => area.id === suggestion?.productAreaId)?.name ??
    "No product area";
  const suggestedTags =
    suggestion?.tagIds.map(
      (id) => tags.find((tag) => tag.id === id)?.name ?? "Unavailable tag",
    ) ?? [];

  console.log("suggestion", suggestion);

  return (
    <section aria-labelledby="classify-heading">
      <h2 id="classify-heading">Classify feedback</h2>

      <button type="button" onClick={requestSuggestion} disabled={isPending}>
        {isPending ? "Working…" : "Suggest classification"}
      </button>

      {suggestion && (
        <div className={styles.message} aria-label="Suggested classification">
          <h3>Suggested classification</h3>
          <p>Product area: {suggestedArea}</p>
          <p>
            Tags: {suggestedTags.length > 0 ? suggestedTags.join(", ") : "None"}
          </p>
          <p>Review this suggestion before saving it.</p>
          <div className={styles.suggestionActions}>
            <button
              type="button"
              onClick={acceptSuggestion}
              disabled={isPending}
            >
              Accept and save
            </button>
            <button type="button" onClick={editSuggestion} disabled={isPending}>
              Edit in form
            </button>
            <button
              type="button"
              onClick={rejectSuggestion}
              disabled={isPending}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
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
          {isPending ? "Saving…" : "Save manual classification"}
        </button>
      </form>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </section>
  );
}
