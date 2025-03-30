# API Module for ToonsAi

This module provides a clean, TypeScript-based interface for making API calls to the Gemini AI backend services.

## Structure

- `client.ts` - Base API client with Fetch implementation
- `types.ts` - TypeScript interfaces for API requests and responses
- `gemini.ts` - Specific functions for Gemini AI endpoints
- `testing.ts` - Utility functions for testing API endpoints
- `index.ts` - Exports all API functions and types

## Usage

### Basic Usage

Import the functions you need:

```typescript
import { checkHealth, generateText, analyzeImage } from "../lib/api";
```

### Health Check

```typescript
try {
  const healthStatus = await checkHealth();
  console.log("API Status:", healthStatus);
} catch (error) {
  console.error("Health check failed:", error);
}
```

### Text Generation

```typescript
try {
  const result = await generateText(
    "Write a short poem about space", // prompt
    0.7, // temperature (optional, default: 0.7)
    1000 // maxTokens (optional, default: 1000)
  );
  console.log("Generated text:", result.text);
} catch (error) {
  console.error("Text generation failed:", error);
}
```

### Image Analysis

```typescript
import * as ImagePicker from "expo-image-picker";

// Pick an image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 1,
});

if (!result.canceled && result.assets && result.assets.length > 0) {
  try {
    const imageUri = result.assets[0].uri;
    const analysis = await analyzeImage(
      imageUri, // local URI of the image
      true, // detailed analysis (optional, default: true)
      "image/jpeg" // mime type (optional, default: 'image/jpeg')
    );
    console.log("Image analysis:", analysis);
  } catch (error) {
    console.error("Image analysis failed:", error);
  }
}
```

## Testing

For testing all endpoints at once:

```typescript
import { testAllEndpoints } from "../lib/api";

// Test all endpoints (pass an image URI to also test image analysis)
testAllEndpoints()
  .then(() => console.log("All tests completed"))
  .catch((error) => console.error("Test failed:", error));
```

For testing a specific endpoint:

```typescript
import { testEndpoint } from "../lib/api";

// Test health endpoint
testEndpoint("health")
  .then((result) => console.log("Health test result:", result))
  .catch((error) => console.error("Health test failed:", error));

// Test text generation with custom parameters
testEndpoint("text", {
  prompt: "Write a haiku about mountains",
  temperature: 0.8,
  maxTokens: 500,
})
  .then((result) => console.log("Text generation test result:", result))
  .catch((error) => console.error("Text generation test failed:", error));

// Test image analysis with a specific image
testEndpoint("image", {
  imageUri: "/path/to/image.jpg",
  detailed: true,
  mimeType: "image/jpeg",
})
  .then((result) => console.log("Image analysis test result:", result))
  .catch((error) => console.error("Image analysis test failed:", error));
```

## Configuration

The API base URL is configured in `client.ts`. Update this URL to match your backend:

```typescript
// In client.ts
const BASE_URL = "http://YOUR_SERVER_IP:8000/api/v1";
```

For different environments:

- Android Emulator: `http://10.0.2.2:8000/api/v1`
- iOS Simulator: `http://localhost:8000/api/v1`
- Real device: Use your development machine's IP, e.g., `http://192.168.1.5:8000/api/v1`
