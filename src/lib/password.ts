import { randomInt } from "crypto";

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*?";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function pick(source: string): string {
  return source[randomInt(0, source.length)];
}

/**
 * Generate a readable but strong temporary password. The result always has at
 * least one lowercase letter, uppercase letter, digit, and symbol.
 */
export function generateTemporaryPassword(length = 12): string {
  const targetLength = Math.max(8, length);
  const chars = [
    pick(LOWER),
    pick(UPPER),
    pick(DIGITS),
    pick(SYMBOLS),
  ];

  while (chars.length < targetLength) {
    chars.push(pick(ALL));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
