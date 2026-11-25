import type { Department, StudentSection } from "@/lib/academic";

export type CredentialResult = {
  index: number;
  fullName: string;
  email: string;
  yearLevel: number;
  role: "student" | "professor";
  department: Department | null;
  section: StudentSection | null;
  status: "created" | "error";
  temporaryPassword?: string;
  error?: string;
};

const STORAGE_KEY = "it-roadmap-pending-credentials";
const CHANGE_EVENT = "it-roadmap-pending-credentials-change";
const EMPTY: CredentialResult[] = [];

let cachedRaw: string | null = null;
let cachedValue: CredentialResult[] = EMPTY;

function read(): CredentialResult[] {
  if (typeof window === "undefined") return EMPTY;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedValue;

    cachedRaw = raw;
    if (!raw) {
      cachedValue = EMPTY;
      return cachedValue;
    }

    const parsed = JSON.parse(raw);
    cachedValue = Array.isArray(parsed) ? (parsed as CredentialResult[]) : EMPTY;
    return cachedValue;
  } catch {
    cachedRaw = null;
    cachedValue = EMPTY;
    return cachedValue;
  }
}

function write(next: CredentialResult[]) {
  cachedValue = next;
  cachedRaw = JSON.stringify(next);

  try {
    window.sessionStorage.setItem(STORAGE_KEY, cachedRaw);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage can be unavailable in private browsing; the in-memory copy still works.
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function getSnapshot() {
  return read();
}

export function getServerSnapshot() {
  return EMPTY;
}

export function addCredentialResults(results: CredentialResult[]) {
  const merged = new Map(read().map((result) => [result.email, result]));
  for (const result of results) {
    merged.set(result.email, result);
  }
  write(Array.from(merged.values()));
}

export function removeCredentialResult(email: string) {
  write(read().filter((result) => result.email !== email));
}

export function clearCredentialResults() {
  write([]);
}
