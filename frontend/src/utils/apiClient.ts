"use client";

import { getApiUrl, getAuthHeaders } from "./api";

export const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    return response;
  },

  post: async (endpoint: string, body?: unknown, options?: RequestInit) => {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: "POST",
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    return response;
  },

  put: async (endpoint: string, body?: unknown, options?: RequestInit) => {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: "PUT",
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    return response;
  },

  delete: async (endpoint: string, options?: RequestInit) => {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    return response;
  },

  patch: async (endpoint: string, body?: unknown, options?: RequestInit) => {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      method: "PATCH",
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    return response;
  },
};

export default apiClient;