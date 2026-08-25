import { prisma } from "@/server/db";
import { BUSINESS_TIMEZONE } from "./timezone";

export async function ensureBusinessTimezone(organizationId: string, timezone: string) {
  if (timezone && timezone !== "America/Phoenix") return timezone;
  await prisma.organization.update({
    where: { id: organizationId },
    data: { timezone: BUSINESS_TIMEZONE },
  });
  return BUSINESS_TIMEZONE;
}
