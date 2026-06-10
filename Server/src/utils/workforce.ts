import { prisma } from "../config/prisma.js";

/** Business codes that carry HR authority — cross-cutting read of all employees. */
const HR_BUSINESS_CODES = new Set(["hr-dept"]);

/**
 * Returns true when the viewer's role carries the `workforce:read:org` permission
 * AND the viewer belongs to an HR business function (see HR_BUSINESS_CODES).
 *
 * Both gates are required: the permission prevents low-level HR employees (interns,
 * executives) from gaining cross-org read, while the business code ensures the
 * permission only activates for employees actually assigned to the HR function.
 */
export async function isWorkforceManager(viewer: {
  businessId: string;
  roleLevel: number;
}): Promise<boolean> {
  const [role, business] = await Promise.all([
    prisma.role.findFirst({
      where: { level: viewer.roleLevel },
      select: {
        permissions: { select: { permission: { select: { code: true } } } },
      },
    }),
    prisma.business.findUnique({
      where: { id: viewer.businessId },
      select: { code: true },
    }),
  ]);
  const hasPermission =
    role?.permissions.some((rp) => rp.permission.code === "workforce:read:org") ?? false;
  return hasPermission && HR_BUSINESS_CODES.has(business?.code ?? "");
}
