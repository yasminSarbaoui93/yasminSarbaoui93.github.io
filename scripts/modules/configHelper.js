// Test configuration module
// This file demonstrates how to use and test the configuration

import { config, validateConfig } from '../config.template.js';

/**
 * Test configuration loading and validation
 */
export function testConfiguration() {
  console.log('Testing configuration...');
  
  const validation = validateConfig();
  
  if (!validation.valid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(error => {
      console.error(`  - ${error}`);
    });
    console.error('\n📖 Setup Instructions:');
    console.error('  1. Copy config.template.js to config.js');
    console.error('  2. Fill in your Azure OpenAI credentials');
    console.error('  3. See README.md for detailed setup guide');
    return false;
  }
  
  console.log('✅ Configuration is valid');
  console.log('Configuration summary:');
  console.log(`  - Endpoint: ${config.azureOpenAI.endpoint}`);
  console.log(`  - Deployment: ${config.azureOpenAI.deploymentName}`);
  console.log(`  - Function: ${config.azureFunction.endpoint}`);
  return true;
}

/**
 * Safe configuration loader with error handling
 * Use this in production code to handle missing config gracefully
 */
export async function loadConfiguration() {
  try {
    // Try to load the actual config.js file
    const { config: userConfig, validateConfig: validate } = await import('../config.js');
    
    const validation = validate();
    if (!validation.valid) {
      throw new Error('Configuration validation failed: ' + validation.errors.join(', '));
    }
    
    return {
      success: true,
      config: userConfig,
      error: null
    };
  } catch (error) {
    // Config file doesn't exist or is invalid
    console.error('Configuration error:', error.message);
    
    return {
      success: false,
      config: null,
      error: error.message,
      instructions: [
        'Configuration file not found or invalid.',
        'Please follow these steps:',
        '1. Copy config.template.js to config.js',
        '2. Fill in your Azure OpenAI credentials',
        '3. See README.md for detailed instructions'
      ]
    };
  }
}

/**
 * Display configuration error to user
 */
export function displayConfigError(error, instructions) {
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.id = 'config-error';
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4444;
    color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 500px;
    z-index: 9999;
    font-family: Arial, sans-serif;
  `;
  
  let html = `<h3 style="margin-top:0;">⚠️ Configuration Error</h3>`;
  html += `<p>${error}</p>`;
  if (instructions && instructions.length > 0) {
    html += '<ul style="text-align:left;">';
    instructions.forEach(instruction => {
      html += `<li>${instruction}</li>`;
    });
    html += '</ul>';
  }
  html += '<p><small>See README.md for detailed setup instructions</small></p>';
  
  errorDiv.innerHTML = html;
  document.body.appendChild(errorDiv);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConfiguration();
}
