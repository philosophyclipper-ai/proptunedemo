const PAGE_SIZE = 20;

/**
 * Cursor pagination over created_at + id, base64-encoded so the cursor is
 * an opaque token to callers. Deliberately not offset-based — real
 * property/contact lists are large enough that offset pagination drifts.
 */
export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const [createdAt, id] = Buffer.from(cursor, "base64url")
      .toString("utf8")
      .split("|");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export { PAGE_SIZE };
