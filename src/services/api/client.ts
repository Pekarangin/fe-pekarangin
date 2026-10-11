import { tokenStorage } from './storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://be-pekarangin-production.up.railway.app/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    if (typeof options.headers === 'object' && !(options.headers instanceof Headers)) {
      Object.assign(headers, options.headers as Record<string, string>);
    } else if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || API_BASE_URL).replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      err?.message || 'Koneksi ke server gagal. Periksa jaringan internet.',
      'NETWORK_ERROR',
      0
    );
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      `Format respons server tidak valid (${response.status})`,
      'INVALID_RESPONSE',
      response.status
    );
  }

  if (!response.ok || !json.success) {
    const errorMsg =
      json.error?.message ||
      json.message ||
      `Request failed with status ${response.status}`;
    const errorCode = json.error?.code || 'API_ERROR';
    throw new ApiError(errorMsg, errorCode, response.status);
  }

  return json.data;
}
