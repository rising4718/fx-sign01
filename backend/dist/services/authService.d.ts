import { PlanType } from '../generated/prisma';
export interface User {
    id: number;
    email: string;
    displayName: string;
    planType: PlanType;
    isEmailVerified: boolean;
    createdAt: Date;
    lastLogin: Date | null;
}
export interface CreateUserData {
    email: string;
    password: string;
    displayName?: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResult {
    user: User;
    tokens: TokenPair;
}
export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateAccessToken: (user: User) => string;
export declare const generateRefreshToken: () => string;
export declare const generateTokens: (user: User) => Promise<TokenPair>;
export declare const registerUser: (userData: CreateUserData) => Promise<AuthResult>;
export declare const loginUser: (loginData: LoginData) => Promise<AuthResult>;
export declare const refreshAccessToken: (refreshToken: string) => Promise<TokenPair>;
export declare const logoutUser: (refreshToken: string) => Promise<void>;
export declare const getUserById: (userId: number) => Promise<User | null>;
//# sourceMappingURL=authService.d.ts.map