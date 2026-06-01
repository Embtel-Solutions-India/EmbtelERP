import { ApiError } from "../utils/ApiError.js";
export function validateBody(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            next(new ApiError(400, "Invalid request body", parsed.error.flatten()));
            return;
        }
        req.body = parsed.data;
        next();
    };
}
