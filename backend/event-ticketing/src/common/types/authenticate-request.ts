import { Role } from "../../auth/user.model.js";
import type { Request } from "express";

export interface AuthenicatedRequest extends Request {
    user: {
        sub: number;
        email: string;
        role: Role[];
    }
}