/**
 * Base AI Service Class
 * Defines the common interface for all AI service implementations
 */
export class BaseAIService {
  constructor(config = {}) {
    this.config = config;
    this.name = this.constructor.name;
  }

  /**
   * Generate a tattoo design from a text prompt
   * @param {string} prompt - The text description of the desired tattoo
   * @param {Object} options - Generation options (style, complexity, etc.)
   * @returns {Promise<Object>} - Generated image data
   */
  async generateImage(prompt, options = {}) {
    throw new Error(`${this.name} must implement generateImage method`);
  }

  /**
   * Generate a tattoo design with mask support (for coverups/gap fillers)
   * @param {string} prompt - The text description
   * @param {string} image - Base64 encoded original image
   * @param {string} maskData - Base64 encoded mask image
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated image data
   */
  async generateWithMask(prompt, image, maskData, options = {}) {
    throw new Error(`${this.name} must implement generateWithMask method`);
  }

  /**
   * Analyze mask data for better prompt generation
   * @param {string} maskData - Base64 encoded mask image
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeMask(maskData) {
    throw new Error(`${this.name} must implement analyzeMask method`);
  }

  /**
   * Get available models for this service
   * @returns {Array} - List of available models
   */
  getAvailableModels() {
    throw new Error(`${this.name} must implement getAvailableModels method`);
  }

  /**
   * Validate configuration
   * @returns {boolean} - True if configuration is valid
   */
  validateConfig() {
    throw new Error(`${this.name} must implement validateConfig method`);
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} - Health check results
   */
  async healthCheck() {
    throw new Error(`${this.name} must implement healthCheck method`);
  }
} 