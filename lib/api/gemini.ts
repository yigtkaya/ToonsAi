import * as FileSystem from 'expo-file-system';
import api from './client';
import { 
  HealthCheckResponse, 
  TextGenerationRequest, 
  TextGenerationResponse,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  ImageGenerationRequest,
  ImageGenerationResponse
} from './types';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Converts an image file to base64 encoding
 * @param uri The local URI of the image file
 * @returns Promise with the base64 encoded string
 */
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Check the health of the Gemini API
 * @returns Promise with the health status
 */
export const checkHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await api.get<HealthCheckResponse>('/gemini/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Generate text with the Gemini model
 * @param prompt The text prompt for the model
 * @param temperature Optional temperature parameter (default: 0.7)
 * @param maxTokens Optional maximum tokens to generate
 * @param topP Optional nucleus sampling parameter (default: 0.95)
 * @param topK Optional top-k sampling parameter (default: 40)
 * @returns Promise with the generated text
 */
export const generateText = async (
  prompt: string,
  temperature: number = 0.7,
  maxTokens?: number,
  topP: number = 0.95,
  topK: number = 40
): Promise<TextGenerationResponse> => {
  try {
    const requestData: TextGenerationRequest = {
      prompt,
      temperature,
      max_tokens: maxTokens || null,
      top_p: topP,
      top_k: topK
    };
    
    const response = await api.post<TextGenerationResponse>(
      '/gemini/generate',
      requestData
    );
    
    return response.data;
  } catch (error) {
    console.error('Text generation failed:', error);
    throw error;
  }
};

/**
 * Analyze an image using the Gemini model
 * @param imageUri The local URI of the image to analyze
 * @param detailed Whether to return detailed analysis (default: true)
 * @param mimeType The MIME type of the image (default: 'image/jpeg')
 * @returns Promise with the image analysis
 */
export const analyzeImage = async (
  imageUri: string,
  detailed: boolean = true,
  mimeType: string = 'image/jpeg'
): Promise<ImageAnalysisResponse> => {
  try {
    const base64Image = await imageToBase64(imageUri);
    
    const requestData: ImageAnalysisRequest = {
      image: base64Image,
      mime_type: mimeType,
      detailed
    };
    
    const response = await api.post<ImageAnalysisResponse>(
      '/gemini/understand-image',
      requestData
    );
    
    return response.data;
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw error;
  }
};

/**
 * Generate an image based on an input image and prompt
 * @param imageUri The local URI of the source image
 * @param prompt Text prompt to guide image generation
 * @param description Optional pre-generated description (no longer used)
 * @param mimeType The MIME type of the image (default: 'image/jpeg')
 * @returns Promise with the URI to the generated image (file URI for large images)
 */
export const generateImage = async (
  imageUri: string,
  prompt: string,
  description?: string, // keeping parameter for backward compatibility 
  mimeType: string = 'image/jpeg'
): Promise<{ imageUrl: string; text: string | null }> => {
  try {
    const base64Image = await imageToBase64(imageUri);
    
    // Make sure we're only sending fields the server expects
    // Removed description as it's not needed in the new API implementation
    const requestData: ImageGenerationRequest = {
      image: base64Image,
      mime_type: mimeType,
      prompt
    };
    
    console.log(`Sending image generation request with ${prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt}`);
    
    const response = await api.post<ImageGenerationResponse>(
      '/gemini/generate-image',
      requestData
    );
    
    // Log the response structure to help with debugging
    console.log('Response structure:', {
      mimeType: response.data.mime_type,
      model: response.data.model,
      hasImageUrl: !!response.data.image_url,
      hasText: !!response.data.text,
      imageLength: response.data.image ? response.data.image.length : 0
    });
    
    let imageUrl: string;
    
    // If image_url is available, use it directly
    if (response.data.image_url) {
      console.log(`Using provided image URL: ${response.data.image_url}`);
      imageUrl = response.data.image_url;
    } else {
      // Fallback to the original base64 approach if image_url is not provided
      if (!response.data.image) {
        throw new Error('No image data returned from the API');
      }
      
      // For compatibility, still handle the base64 case
      const responseMimeType = response.data.mime_type || 'image/jpeg';
      imageUrl = `data:${responseMimeType};base64,${response.data.image}`;
      console.log('Falling back to data URL from base64 image data');
    }
    
    return {
      imageUrl,
      text: response.data.text || null
    };
    
  } catch (error) {
    console.error('Image generation failed:', error);
    // If this is a server error, log more details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
    }
    throw error;
  }
}; 