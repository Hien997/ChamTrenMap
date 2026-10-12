import { revalidatePath } from "next/cache";

/**
 * Purge every public page after an admin write.
 *
 * The public routes are ISR'd (`revalidate = 300`), and all of them hang off
 * the locale-prefixed layout, so revalidating that layout clears `/vi/...` and
 * `/en/...` in one call without enumerating every path an edit could touch.
 * Call it only after the write has committed: if it ever threw, the visitor
 * would see stale HTML for at most 5 minutes — the same bound as the TTL.
 *
 * Not needed for private tours: their pages were never cached (the access code
 * decides what renders).
 */
export const revalidatePublicPages = (): void => {
  revalidatePath("/", "layout");
};
