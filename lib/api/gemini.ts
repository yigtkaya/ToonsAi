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
): Promise<string> => {
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
      imageLength: response.data.image ? response.data.image.length : 0
    });
    
    if (!response.data.image) {
      throw new Error('No image data returned from the API');
    }
    
    // Due to issues with file URIs on Android, we'll return the raw data URL directly
    // This is more reliable across platforms
    const responseMimeType = response.data.mime_type || 'image/jpeg';
    
    // Check if the image is too large for data URL handling (over 1MB)
    // if (response.data.image.length > 1000000) {
    //   console.log(`Image is large (${response.data.image.length} bytes), saving to file`);
      
    //   // Save large images to file to avoid rendering issues
    //   const fileExtension = responseMimeType.includes('png') ? '.png' : '.jpg';
    //   const filename = `gemini_image_${Date.now()}${fileExtension}`;
    //   const filePath = `${FileSystem.cacheDirectory}${filename}`;
      
    //   try {
    //     await FileSystem.writeAsStringAsync(filePath, response.data.image, {
    //       encoding: FileSystem.EncodingType.Base64,
    //     });
        
    //     console.log(`Large image saved to file: ${filePath}`);
        
    //     // Attempt to validate the image by reading it with ImageManipulator
    //     try {
    //       // Validate and optimize the image to ensure it's in a proper format
    //       const result = await ImageManipulator.manipulateAsync(
    //         filePath,
    //         [], // No manipulations, just validate 
    //         { compress: 1.0 } // Keep quality the same
    //       );
          
    //       console.log(`Validated image format, using: ${result.uri}`);
    //       return result.uri;
    //     } catch (validationError) {
    //       console.error('Image validation failed:', validationError);
    //       console.log('Falling back to original file path');
    //       // Continue with original file path
    //       return filePath;
    //     }
    //   } catch (fileError) {
    //     console.error('Failed to save large image to file:', fileError);
    //     // Continue to data URL as fallback
    //   }
    // }
    // For smaller images or if file saving failed, use data URL
    const imageDataUrl = `data:${responseMimeType};base64,${response.data.image}`;
    
    console.log(`Created data URL (length: ${imageDataUrl.length})`);
    console.log(`Image MIME type: ${responseMimeType}`);
    
    // Validate that the base64 data is valid
    const isValidBase64 = response.data.image && /^[A-Za-z0-9+/=]+$/.test(response.data.image);
    if (!isValidBase64) {
      console.warn('Warning: Generated image may contain invalid base64 characters');
    }
    
    return imageDataUrl;
    
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