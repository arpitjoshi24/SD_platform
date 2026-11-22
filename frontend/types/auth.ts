export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: User;
}
