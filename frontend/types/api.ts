export interface ApiErrorResponse {
  success: boolean;
  message: string;
  details?: { field: string; message: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
