/**
 * Reads a CSS custom property from the document root. SVG presentation
 * attributes such as React Flow marker colors cannot resolve var(), so those
 * values need to be resolved to a concrete color at runtime.
 */
export function themeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}
