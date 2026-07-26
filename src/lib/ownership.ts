/**
 * Single ownership helper — use from every mutating template route.
 *
 * Anonymous templates (userId = null): anyone with the link can edit.
 * Claimed templates: only the owner can edit.
 */
export function canEditTemplate(
  template: { userId: string | null },
  sessionUserId: string | null | undefined,
): boolean {
  if (template.userId == null) return true;
  if (!sessionUserId) return false;
  return template.userId === sessionUserId;
}

export function isOwner(
  template: { userId: string | null },
  sessionUserId: string | null | undefined,
): boolean {
  if (!sessionUserId || template.userId == null) return false;
  return template.userId === sessionUserId;
}

export function ownershipFlags(
  template: { userId: string | null },
  sessionUserId: string | null | undefined,
) {
  const anonymous = template.userId == null;
  return {
    isAnonymous: anonymous,
    isOwner: isOwner(template, sessionUserId),
    canEdit: canEditTemplate(template, sessionUserId),
  };
}
