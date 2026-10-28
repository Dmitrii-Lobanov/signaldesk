"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../page.module.css";
import { ClassificationOption } from "@/api/feedback";
import { Select } from "@/app/components/ui/select";

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
  const [area, setArea] = useState(filters.area);
  const [tag, setTag] = useState(filters.tag);

  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const q = String(values.get("q") ?? "").trim();

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
        <Select
          id="filter-area"
          value={area || "all"}
          onValueChange={(value) => setArea(value === "all" ? "" : value)}
          options={[
            { value: "all", label: "All areas" },
            ...areas.map((option) => ({
              value: option.id,
              label: option.name,
            })),
          ]}
          disabled={pending}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="filter-tag">Tag</label>
        <Select
          id="filter-tag"
          value={tag || "all"}
          onValueChange={(value) => setTag(value === "all" ? "" : value)}
          options={[
            { value: "all", label: "All tags" },
            ...tags.map((option) => ({
              value: option.id,
              label: option.name,
            })),
          ]}
          disabled={pending}
        />
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
