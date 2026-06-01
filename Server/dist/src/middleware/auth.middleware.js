import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
export async function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        next(new ApiError(401, "Missing bearer token"));
        return;
    }
    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
            select: { revokedAt: true, expiresAt: true, userId: true },
        });
        if (!session ||
            session.userId !== payload.employeeId ||
            session.revokedAt ||
            session.expiresAt <= new Date()) {
            next(new ApiError(401, "Session expired or revoked"));
            return;
        }
        req.user = payload;
        next();
    }
    catch {
        next(new ApiError(401, "Invalid or expired token"));
    }
}
