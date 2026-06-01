import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { login, logout } from "../services/auth.service.js";
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const authRouter = Router();
authRouter.post("/login", validateBody(loginSchema), asyncHandler(async (req, res) => {
    const result = await login(req.body.email, req.body.password);
    res.json(result);
}));
authRouter.post("/logout", authenticate, asyncHandler(async (req, res) => {
    await logout(req.user.sessionId);
    res.json({ message: "Logged out" });
}));
