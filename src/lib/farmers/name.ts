/** How a farmer is named on the site: their own name, or "Fermer". */
export function farmerDisplayName(name: string | null | undefined): string {
  return name?.trim() || "Fermer";
}
