import type { Ref, RefCallback } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Read the validation message for a field path, including nested paths
 * like "vi.name" — `formState.errors` is a nested object, so a flat
 * `errors[name]` lookup only ever works for top-level fields.
 */
export function peekErrors(
  form: UseFormReturn<FieldValues>,
  name: string,
): string | undefined {
  let node: unknown = form.formState.errors;
  for (const key of name.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  if (node == null || typeof node !== "object") return undefined;
  const message = (node as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

/** Combine several refs into a single callback ref (e.g. register's ref + a forwarded ref). */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        (ref as { current: T | null }).current = value;
      }
    }
  };
}
