/**
 * AI Service Factory
 * Creates the correct AI service based on environment configuration
 */

import { ReplicateService } from './replicate.js';

/**
 * Factory function to create AI service instance
 * @param {Object} config - Service configuration
 * @returns {BaseAIService} - Configured AI service instance
 */
export function createAIService(config = {}) {
  const provider = process.env.AI_PROVIDER || 'replicate';
  
  switch (provider.toLowerCase()) {
    case 'replicate':
      return new ReplicateService(config);
    
    // Future providers can be added here
    // case 'openai':
    //   return new OpenAIService(config);
    // case 'anthropic':
    //   return new AnthropicService(config);
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}. Supported providers: replicate`);
  }
}

/**
 * Get available AI providers
 * @returns {Array} - List of available provider names
 */
export function getAvailableProviders() {
  return ['replicate'];
}

/**
 * Validate AI provider configuration
 * @param {string} provider - Provider name to validate
 * @returns {boolean} - True if provider is valid and configured
 */
export function validateProvider(provider) {
  const availableProviders = getAvailableProviders();
  
  if (!availableProviders.includes(provider)) {
    return false;
  }
  
  // Check provider-specific environment variables
  switch (provider) {
    case 'replicate':
      return !!process.env.REPLICATE_API_TOKEN;
    
    default:
      return false;
  }
}

/**
 * Get default AI service instance
 * @returns {BaseAIService} - Default configured AI service
 */
export function getDefaultAIService() {
  return createAIService();
}

// Export service classes for direct use if needed
export { ReplicateService } from './replicate.js';
export { BaseAIService } from './base.js'; 