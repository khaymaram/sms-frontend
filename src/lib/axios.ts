// axios.ts configures the frontend HTTP client for the backend API.
// It also provides helpers that unwrap the backend response wrapper
// format { success: true, data } into raw payload values.

import axios, { type AxiosRequestConfig } from "axios";


// const api = axios.create({

//     baseURL: "http://localhost:8080/api",

//     headers:{
//         "Content-Type":"application/json"
//     }

// });


// export default api;

// Base URL comes from the environment so the same build can point at
// localhost during development or a deployed backend in production.
// If VITE_API_URL is not set, the app falls back to the local Go server.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081/api";

// Create one shared Axios instance for all requests so every call uses the
// same base URL, content type, and request defaults.

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sms_auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  // Send a GET request and unwrap the backend's standardized response.
  // The backend returns { success: true, data: ... }, so this helper returns
  // just the payload for the component code to use.
  const response = await api.get(url, config);
  const body = response.data as { success?: boolean; data?: T };
  return body?.success === true && body?.data !== undefined ? body.data : response.data;
}

export async function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  // Send a POST request with JSON data and return the payload from the backend.
  // This is used by the create-student mutation when the form is submitted.
  const response = await api.post(url, data, config);
  const body = response.data as { success?: boolean; data?: T };
  return body?.success === true && body?.data !== undefined ? body.data : response.data;
}

export async function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  // Send a PUT request and return the backend's payload if the request succeeded.
  // This is used by the edit-student flow in the roster view.
  const response = await api.put(url, data, config);
  const body = response.data as { success?: boolean; data?: T };
  return body?.success === true && body?.data !== undefined ? body.data : response.data;
}

// Pulls the backend's { "error": "..." } message out of a failed
// axios request, falling back to a generic message so the UI can show
// a friendly notification instead of a raw network error.
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}
