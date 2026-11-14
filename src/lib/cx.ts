type ClassValue = string | false | null | undefined

/** Joins class names and drops falsy values, so conditions can be written inline. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
