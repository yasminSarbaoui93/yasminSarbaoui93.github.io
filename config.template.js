// Configuration Template for Sedna FM Mood Selector
// Copy this file to 'config.js' and fill in your actual values
// IMPORTANT: config.js is gitignored and should NEVER be committed to the repository

export const config = {
  // Azure OpenAI Configuration
  // Get these values from Microsoft AI Foundry: https://ai.azure.com/
  azureOpenAI: {
    // Your Azure OpenAI endpoint URL
    // Example: "https://your-resource-name.openai.azure.com/"
    endpoint: "YOUR_AZURE_OPENAI_ENDPOINT_HERE",
    
    // Your Azure OpenAI API key
    // Found in Azure Portal > Your OpenAI Resource > Keys and Endpoint
    apiKey: "YOUR_AZURE_OPENAI_API_KEY_HERE",
    
    // Your deployment name for the model
    // Example: "gpt-5" or "gpt-5-nano"
    deploymentName: "YOUR_DEPLOYMENT_NAME_HERE"
  },

  // Azure Function Configuration
  // This is the endpoint for your deployed mood recommendation function
  azureFunction: {
    // Your Azure Function endpoint URL
    // Example: "https://your-function-app.azurewebsites.net/api/GetMoodRecommendation"
    endpoint: "YOUR_AZURE_FUNCTION_ENDPOINT_HERE"
  }
};

// Configuration validation
export function validateConfig() {
  const errors = [];

  // Check Azure OpenAI configuration
  if (!config.azureOpenAI.endpoint || config.azureOpenAI.endpoint === "YOUR_AZURE_OPENAI_ENDPOINT_HERE") {
    errors.push("Azure OpenAI endpoint is not configured");
  }
  if (!config.azureOpenAI.apiKey || config.azureOpenAI.apiKey === "YOUR_AZURE_OPENAI_API_KEY_HERE") {
    errors.push("Azure OpenAI API key is not configured");
  }
  if (!config.azureOpenAI.deploymentName || config.azureOpenAI.deploymentName === "YOUR_DEPLOYMENT_NAME_HERE") {
    errors.push("Azure OpenAI deployment name is not configured");
  }

  // Check Azure Function configuration
  if (!config.azureFunction.endpoint || config.azureFunction.endpoint === "YOUR_AZURE_FUNCTION_ENDPOINT_HERE") {
    errors.push("Azure Function endpoint is not configured");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors: errors
    };
  }

  return {
    valid: true,
    errors: []
  };
}
