"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIError = void 0;
class APIError extends Error {
    constructor(message, code, status, source = 'unknown') {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.status = status;
        this.source = source;
    }
}
exports.APIError = APIError;
//# sourceMappingURL=index.js.map