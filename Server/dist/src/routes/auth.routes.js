import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { login } from "../services/auth.service.js";
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const authRouter = Router();
authRouter.post("/login", validateBody(loginSchema), asyncHandler(async (req, res) => {
    const result = await login(req.body.email, req.body.password);
    res.json(result);
}));
authRouter.post("/logout", asyncHandler(async (_req, res) => {
    res.json({ message: "Logged out" });
}));
