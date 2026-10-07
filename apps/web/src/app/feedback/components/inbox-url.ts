export type InboxFilterValues = {
  q: string;
  area: string;
  tag: string;
};

export function inboxUrl(
  filters: InboxFilterValues,
  cursors: string[] = [],
): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.area) params.set("area", filters.area);
  if (filters.tag) params.set("tag", filters.tag);
  for (const cursor of cursors) params.append("cursor", cursor);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
