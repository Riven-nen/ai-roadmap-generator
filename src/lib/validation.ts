const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const RESERVED_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "test.org",
  "localhost",
]);

export function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Practical email validation: checks the RFC-shaped local part and a real
 * domain with at least one dot, plus the common length limits.
 */
export function getEmailError(email: string): string | null {
  const value = normalizeEmail(email);

  if (!value) return "Email is required.";
  if (value.length > 254) return "Email address is too long.";
  if (value.includes("..")) return "Enter a valid email address.";

  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) return "Enter a valid email address.";
  if (localPart.length > 64) return "Email address is too long.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";

  return null;
}

/**
 * Supabase Auth cannot send recovery mail to reserved example/test domains.
 * Existing demo accounts may still use them to sign in, but new students should
 * be created with a deliverable address.
 */
export function isReservedEmailDomain(email: string): boolean {
  const domainPart = normalizeEmail(email).split("@")[1] ?? "";

  return (
    RESERVED_DOMAINS.has(domainPart) ||
    domainPart.endsWith(".test") ||
    domainPart.endsWith(".invalid") ||
    domainPart.endsWith(".example") ||
    domainPart.endsWith(".localhost")
  );
}

/** Stricter validation used when an admin creates a new student account. */
export function getStudentEmailError(email: string): string | null {
  const emailError = getEmailError(email);
  if (emailError) return emailError;

  if (isReservedEmailDomain(email)) {
    return "Use a deliverable email address (test/example domains cannot receive password reset mail).";
  }

  return null;
}

export function isValidEmail(email: string): boolean {
  return getEmailError(email) === null;
}

export function getInitials(name: string): string {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";

  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return `${first}${last}`.toUpperCase() || "ST";
}
