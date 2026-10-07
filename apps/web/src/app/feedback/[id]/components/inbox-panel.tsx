import Link from "next/link";
import { inboxUrl, type InboxFilterValues } from "./inbox-url";
import styles from "../../../page.module.css";
import { InboxFilters } from "@/app/inbox-filters";
import { ClassificationOption, FeedbackPage } from "@/api/feedback";

type Props = {
  filters: InboxFilterValues;
  cursors: string[];
  areas: ClassificationOption[];
  tags: ClassificationOption[];
  page: FeedbackPage | null;
  loadFailed: boolean;
  invalidQuery: boolean;
};

export function InboxPanel({
  filters,
  cursors,
  areas,
  tags,
  page,
  loadFailed,
  invalidQuery,
}: Props) {
  const currentInboxUrl = inboxUrl(filters, cursors);

  return (
    <section className={styles.panel} aria-labelledby="feedback-heading">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>BROWSE</p>
          <h2 id="feedback-heading">Inbox</h2>
        </div>
      </div>

      <InboxFilters
        key={`${filters.q}|${filters.area}|${filters.tag}`}
        filters={filters}
        areas={areas}
        tags={tags}
      />

      {loadFailed ? (
        <p role="alert" className={styles.message}>
          {invalidQuery
            ? "These filters or this page link are invalid."
            : "Couldn't load feedback."}{" "}
          <Link href={inboxUrl(filters)}>Try the first page</Link>
        </p>
      ) : page?.items.length === 0 ? (
        <div className={styles.emptyState} role="status">
          <h3>No matching feedback</h3>
          <p>Try a different search or clear the filters.</p>
        </div>
      ) : (
        <>
          <p className={styles.resultCount} role="status">
            Showing {page?.items.length ?? 0} feedback items
          </p>

          <ul className={styles.list}>
            {page?.items.map((item) => (
              <li key={item.id}>
                <Link
                  className={styles.feedbackLink}
                  href={`/feedback/${item.id}?${new URLSearchParams({
                    from: currentInboxUrl,
                  })}`}
                >
                  <span className={styles.feedbackText}>{item.content}</span>
                  <span className={styles.feedbackMeta}>
                    {item.source} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <nav aria-label="Feedback pages" className={styles.pagination}>
            {cursors.length > 0 && (
              <Link href={inboxUrl(filters, cursors.slice(0, -1))}>
                ← Previous page
              </Link>
            )}
            {page?.nextCursor && (
              <Link href={inboxUrl(filters, [...cursors, page.nextCursor])}>
                Next page →
              </Link>
            )}
          </nav>
        </>
      )}
    </section>
  );
}
