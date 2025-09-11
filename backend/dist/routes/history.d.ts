import { Pool } from 'pg';
import { HistoryAccumulationService } from '../services/historyAccumulationService';
declare const router: import("express-serve-static-core").Router;
export declare const createHistoryRoutes: (pool: Pool, getHistoryService: () => HistoryAccumulationService | null) => import("express-serve-static-core").Router;
export { router as historyRoutes };
//# sourceMappingURL=history.d.ts.map