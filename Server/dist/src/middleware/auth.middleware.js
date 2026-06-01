import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
export function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        next(new ApiError(401, 'Missing bearer token'));
        return;
    }
    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    }
    catch {
        next(new ApiError(401, 'Invalid or expired token'));
    }
}
