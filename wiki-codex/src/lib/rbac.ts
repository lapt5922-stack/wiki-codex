import type { Entry, EntryType, UserRole } from "@/types/codex";

export function canEditContent(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

export function canReadPrivate(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

export function canManageWorkspace(role: UserRole): boolean {
  return role === "admin";
}

export function canPermanentDelete(role: UserRole): boolean {
  return role === "admin";
}

export function canPublishPublic(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

/**
 * Strip all private notes, private_note custom fields, and internal editorial notes
 * before returning an entry to a Guest user (enforced server-side).
 */
export function sanitizeEntryForRole(
  entry: Entry,
  role: UserRole,
  entryType?: EntryType
): Entry | null {
  if (role === "guest") {
    if (entry.deletedAt) return null;
    if (entry.visibility !== "public") return null;
    if (entry.status !== "published") return null;

    const privateFieldKeys = new Set<string>(
      (entryType?.fieldSchema ?? [])
        .filter((f) => f.type === "private_note")
        .map((f) => f.key)
    );

    const sanitizedCustomFields: Entry["customFields"] = {};
    for (const [k, v] of Object.entries(entry.customFields ?? {})) {
      if (!privateFieldKeys.has(k) && !k.toLowerCase().includes("private")) {
        sanitizedCustomFields[k] = v;
      }
    }

    return {
      ...entry,
      privateNotes: "",
      editorialNotes: [],
      customFields: sanitizedCustomFields,
      extraFields: (entry.extraFields ?? []).filter((f) => f.kind !== "private_note"),
      rumorsAndSecrets: (entry.rumorsAndSecrets ?? []).filter((r) => !r.gmOnly)
    };
  }

  return entry;
}

export function filterEntriesForRole(
  entries: Entry[],
  role: UserRole,
  entryTypes: EntryType[]
): Entry[] {
  if (role !== "guest") return entries;
  const typeMap = new Map(entryTypes.map((t) => [t.id, t]));
  const result: Entry[] = [];
  for (const e of entries) {
    const clean = sanitizeEntryForRole(e, role, typeMap.get(e.entryTypeId));
    if (clean) result.push(clean);
  }
  return result;
}
