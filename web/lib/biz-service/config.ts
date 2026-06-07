/** Local dev uses Next.js rewrite prefix; production is same-origin /api/v1. */
export function bizApiPath(suffix: string): string {
  const prefix = process.env.NODE_ENV === "development" ? "/api/biz" : "";
  return `${prefix}${suffix}`;
}
