/**
 * Leta Delivery API Client
 * Handles all HTTP communication with Leta API
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import {
  LetaClientConfig,
  ApiRequest,
  ApiResponse,
  LetaApiError,
  LetaNetworkError,
  ApiErrorResponse,
} from "@/types/leta.types";

export class LetaClient {
  private client: AxiosInstance;
  private config: LetaClientConfig;

  constructor(config: LetaClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Leta] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `[Leta] ✅ ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error: AxiosError) => {
        const errorData = error.response?.data as ApiErrorResponse;
        console.error(
          `[Leta] ❌ ${error.response?.status} ${error.config?.url}`,
          errorData
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T = any>(
    req: ApiRequest<T>,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client({
        method: req.method,
        url: req.endpoint,
        data: req.data,
        timeout: req.timeout || this.config.timeout,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        // Retry on network errors or 5xx errors
        if (
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600)
        ) {
          if (retryCount < this.config.retries!) {
            console.log(
              `[Leta] 🔄 Retry ${retryCount + 1}/${this.config.retries} for ${req.endpoint}`
            );
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            return this.request(req, retryCount + 1);
          }
        }

        // Handle API error
        const errorData = error.response?.data as ApiErrorResponse;
        throw new LetaApiError(
          errorData?.code || "UNKNOWN_ERROR",
          errorData?.message || error.message,
          error.response?.status,
          errorData?.details
        );
      } else if (error instanceof Error) {
        throw new LetaNetworkError(error);
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await this.request<T>({
      method: "GET",
      endpoint,
    });
    return response.data!;
  }

  /**
   * POST request
   */
  async post<T = any, D = any>(endpoint: string, data: D): Promise<T> {
    const response = await this.request<any>({
      method: "POST",
      endpoint,
      data,
    });
    return response.data!;
  }

  /**
   * PUT request
   */
  async put<T = any, D = any>(endpoint: string, data: D): Promise<T> {
    const response = await this.request<any>({
      method: "PUT",
      endpoint,
      data,
    });
    return response.data!;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.request<T>({
      method: "DELETE",
      endpoint,
    });
    return response.data!;
  }

  /**
   * Update base URL (for switching between sandbox/production)
   */
  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
    this.client.defaults.baseURL = baseUrl;
  }

  /**
   * Update token
   */
  setToken(token: string): void {
    this.config.token = token;
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }
}

// Singleton instance
let letaClientInstance: LetaClient | null = null;

/**
 * Initialize and get singleton instance
 */
export function initializeLetaClient(config: LetaClientConfig): LetaClient {
  letaClientInstance = new LetaClient(config);
  return letaClientInstance;
}

/**
 * Get existing instance
 */
export function getLetaClient(): LetaClient {
  if (!letaClientInstance) {
    throw new Error(
      "Leta client not initialized. Call initializeLetaClient() first."
    );
  }
  return letaClientInstance;
}
