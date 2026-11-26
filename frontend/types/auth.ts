export type UserRole = "user" | "admin";

export type AccountStatus = "active" | "suspended";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
}