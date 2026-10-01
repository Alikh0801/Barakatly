function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * Adds newly picked files to an existing selection without ever displacing
 * what is already there. Files beyond `limit` are returned in `rejected`
 * so the form can name them; re-picking a file already selected is ignored
 * rather than counted against the limit.
 */
export function addFilesWithinLimit(
  current: File[],
  incoming: File[],
  limit: number,
): { files: File[]; rejected: File[] } {
  const fresh = incoming.filter(
    (file, index) =>
      !current.some((existing) => sameFile(existing, file)) &&
      incoming.findIndex((other) => sameFile(other, file)) === index,
  );
  const room = Math.max(0, limit - current.length);
  return {
    files: [...current, ...fresh.slice(0, room)],
    rejected: fresh.slice(room),
  };
}

/** "Ən çox 5 şəkil… Əlavə edilmədi (2): a.jpg, b.jpg." */
export function limitExceededMessage(
  limit: number,
  noun: string,
  rejected: File[],
): string {
  return (
    `Ən çox ${limit} ${noun} əlavə etmək olar. ` +
    `Əlavə edilmədi (${rejected.length}): ${rejected.map((file) => file.name).join(", ")}. ` +
    `Başqasını əlavə etmək üçün əvvəlcə seçilmişlərdən birini silin.`
  );
}
