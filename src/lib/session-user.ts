import { prisma } from "@/lib/db";

/**
 * Return session.user.id only if that User row still exists.
 * JWT sessions can outlive DB rows (local reset, wiped User table).
 */
export async function resolveExistingUserId(
  sessionUserId: string | null | undefined,
): Promise<string | null> {
  if (!sessionUserId) return null;
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true },
  });
  return user?.id ?? null;
}
