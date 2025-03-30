// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Error Response
export interface ErrorResponse {
  detail: string;
  error_code?: string | null;
}

// Validation Error
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// Health Check Response
export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

// Text Generation
export interface TextGenerationRequest {
  prompt: string;
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  top_k?: number | null;
}

export interface TextGenerationResponse {
  text: string;
  model: string;
  usage?: Record<string, number>;
}

// Image Analysis
export interface ImageAnalysisRequest {
  image: string; // base64 encoded image
  mime_type?: string;
  detailed?: boolean | null;
}

export interface ImageAnalysisResponse {
  description: string;
  model: string;
}

// Image Generation
export interface ImageGenerationRequest {
  image: string; // base64 encoded image
  mime_type?: string;
  prompt: string;
  description?: string | null;
}

export interface ImageGenerationResponse {
  image: string; // base64 encoded image
  mime_type?: string;
  model: string;
}
