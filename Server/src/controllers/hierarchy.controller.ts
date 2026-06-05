import type { Request, Response } from "express";
import { getOrgRoleTree } from "../services/hierarchy.service.js";

export async function getHierarchyTreeHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const scope = req.dataScope;
  const tree = await getOrgRoleTree({
    businessIds: scope?.visibleBusinesses,
    employeeIds: scope?.visibleEmployees,
  });
  res.json({ data: tree });
}
