import { checkHealth, generateText, analyzeImage, generateImage } from './gemini';

/**
 * Test all API endpoints and log the results
 * @param testImage Optional image URI to test image analysis and generation
 */
export const testAllEndpoints = async (testImage?: string): Promise<void> => {
  console.log('Starting API endpoint tests...');
  
  try {
    // Test health check
    console.log('Testing health check endpoint...');
    const healthResult = await checkHealth();
    console.log('Health check result:', healthResult);
    
    // Test text generation
    console.log('Testing text generation endpoint...');
    const textResult = await generateText('Write a short poem about technology');
    console.log('Text generation result:', textResult);
    
    // Test image analysis if an image is provided
    if (testImage) {
      console.log('Testing image analysis endpoint...');
      const imageResult = await analyzeImage(testImage);
      console.log('Image analysis result:', imageResult);
      
      // Test image generation if analysis was successful
      console.log('Testing image generation endpoint...');
      const generationPrompt = 'Transform this image into a cartoon';
      const generatedImage = await generateImage(testImage, generationPrompt, imageResult.description);
      console.log('Image generation completed, data URL length:', generatedImage.length);
    } else {
      console.log('Skipping image analysis and generation tests (no test image provided)');
    }
    
    console.log('All API tests completed successfully!');
  } catch (error) {
    console.error('API test failed:', error);
  }
};

/**
 * Test a single API endpoint
 * @param endpoint The name of the endpoint to test
 * @param params Optional parameters for the test
 */
export const testEndpoint = async (
  endpoint: 'health' | 'text' | 'image-analysis' | 'image-generation',
  params?: any
): Promise<any> => {
  try {
    switch (endpoint) {
      case 'health':
        return await checkHealth();
        
      case 'text':
        const prompt = params?.prompt || 'Write a short poem about technology';
        const temperature = params?.temperature || 0.7;
        const maxTokens = params?.maxTokens || null;
        const topP = params?.topP || 0.95;
        const topK = params?.topK || 40;
        return await generateText(prompt, temperature, maxTokens, topP, topK);
        
      case 'image-analysis':
        if (!params?.imageUri) {
          throw new Error('No image URI provided for image analysis test');
        }
        const detailed = params?.detailed !== undefined ? params.detailed : true;
        const mimeType = params?.mimeType || 'image/jpeg';
        return await analyzeImage(params.imageUri, detailed, mimeType);
        
      case 'image-generation':
        if (!params?.imageUri) {
          throw new Error('No image URI provided for image generation test');
        }
        if (!params?.prompt) {
          throw new Error('No prompt provided for image generation test');
        }
        const description = params?.description;
        const imageMimeType = params?.mimeType || 'image/jpeg';
        return await generateImage(params.imageUri, params.prompt, description, imageMimeType);
        
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  } catch (error) {
    console.error(`Test for ${endpoint} endpoint failed:`, error);
    throw error;
  }
}; 