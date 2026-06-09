import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { attachScope } from "../middleware/scope.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const documentsRouter = Router();
documentsRouter.use(authenticate, attachScope);

// GET /documents
documentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const scope = req.scope!;
    const documents = await prisma.document.findMany({
      where: {
        businessId: { in: scope.visibleBusinesses },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: documents });
  })
);

// POST /documents
documentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { title, kind, storageUrl, businessId } = req.body;

    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const emp = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { businessId: true },
      });
      targetBusinessId = emp?.businessId;
    }

    if (!targetBusinessId) {
      res.status(400).json({ error: "Missing businessId" });
      return;
    }

    const doc = await prisma.document.create({
      data: {
        title: title || "Untitled Document",
        kind: kind || "PDF",
        storageUrl: storageUrl || "https://example.com/placeholder.pdf",
        businessId: targetBusinessId,
        createdById: user.employeeId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.status(201).json({ data: doc });
  })
);

// PATCH /documents/:id
documentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const { title, kind, storageUrl } = req.body;
    const doc = await prisma.document.update({
      where: { id },
      data: {
        title,
        kind,
        storageUrl,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.json({ data: doc });
  })
);

// DELETE /documents/:id
documentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await prisma.document.delete({
      where: { id },
    });
    res.status(204).end();
  })
);
