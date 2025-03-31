import { ApiResponse } from './types';

// Replace with your server's IP address or hostname
// If using an emulator: 
// - Android: 10.0.2.2:8000
// - iOS: localhost:8000
// If on real device, use your computer's local IP (e.g., 192.168.1.5:8000)
const BASE_URL = 'http://78.46.150.54:8000/api/v1';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestOptions): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body) {
      // Log the request body for debugging without showing full image data
      if (endpoint.includes('/gemini/generate-image') || endpoint.includes('/gemini/understand-image')) {
        const bodyClone = {...options.body};
        
        // Don't log the full base64 image string, just indicate its presence
        if (bodyClone.image) {
          const imageLength = bodyClone.image.length;
          bodyClone.image = `[base64 image string of length ${imageLength}]`;
        }
        
        console.log(`Request body for ${endpoint}:`, JSON.stringify(bodyClone, null, 2));
      }
      
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      console.log(`Making ${options.method} request to: ${url}`);
      const response = await fetch(url, fetchOptions);
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          console.error(`API error (${response.status}):`, data);
          throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
        }
        
        return {
          success: true,
          data: data as T,
          message: data.message || ''
        };
      } else {
        const text = await response.text();
        
        if (!response.ok) {
          console.error(`API error (${response.status}):`, text);
          throw new Error(`Request failed with status ${response.status}: ${text}`);
        }
        
        return {
          success: true,
          data: text as unknown as T,
        };
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  public async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  public async post<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      headers,
    });
  }

  public async put<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      headers,
    });
  }

  public async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

// Create and export a default instance
const api = new ApiClient(BASE_URL);

export default api; 