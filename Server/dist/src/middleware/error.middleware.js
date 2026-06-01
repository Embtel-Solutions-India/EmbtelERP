import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";
export function errorHandler(error, _req, res, next) {
    void next;
    if (error instanceof ZodError) {
        res
            .status(400)
            .json({ message: "Validation failed", issues: error.flatten() });
        return;
    }
    if (error instanceof ApiError) {
        res
            .status(error.statusCode)
            .json({ message: error.message, details: error.details ?? null });
        return;
    }
    logger.error("unhandled error", { error });
    res.status(500).json({ message: "Internal server error" });
}
