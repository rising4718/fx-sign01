import { Request, Response, NextFunction } from 'express';
import { APIError } from '../types';
export declare const errorHandler: (error: Error | APIError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map