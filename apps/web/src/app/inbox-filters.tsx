"use client";

import { useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClassificationOption } from "../api/feedback";
import styles from "./page.module.css";

type Filters = { q: string; area: string; tag: string };

export function InboxFilters({
  filters,
  areas,
  tags,
}: {
  filters: Filters;
  areas: ClassificationOption[];
  tags: ClassificationOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const q = String(values.get("q") ?? "").trim();
    const area = String(values.get("area") ?? "");
    const tag = String(values.get("tag") ?? "");

    if (q) params.set("q", q);
    if (area) params.set("area", area);
    if (tag) params.set("tag", tag);

    // A changed filter starts at page one.
    startTransition(() => {
      router.push(params.size ? `/?${params}` : "/");
    });
  }

  return (
    <form onSubmit={apply} className={styles.filters} role="search">
      <div className={styles.searchField}>
        <label htmlFor="feedback-search">Search feedback</label>
        <input
          id="feedback-search"
          name="q"
          type="search"
          placeholder="Search customer feedback"
          maxLength={200}
          defaultValue={filters.q}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="filter-area">Product area</label>
        <select id="filter-area" name="area" defaultValue={filters.area}>
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterField}>
        <label htmlFor="filter-tag">Tag</label>
        <select id="filter-tag" name="tag" defaultValue={filters.tag}>
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterActions}>
        <button type="submit" disabled={pending}>
          {pending ? "Applying…" : "Apply"}
        </button>
        <Link href="/" className={styles.quietLink}>
          Clear
        </Link>
      </div>

      <span role="status" className={styles.srOnly}>
        {pending ? "Loading filtered feedback" : ""}
      </span>
    </form>
  );
}
