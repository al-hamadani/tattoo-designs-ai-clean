/**
 * AI Service Manager
 * High-level manager for AI services with fallbacks and optimization
 */

import { createAIService, validateProvider } from './index.js';

/**
 * AI Service Manager Class
 * Handles smart routing, fallbacks, and optimization
 */
export class AIServiceManager {
  constructor(config = {}) {
    this.config = {
      enableFallbacks: true,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...config
    };
    
    this.primaryService = null;
    this.fallbackServices = [];
    this.serviceHealth = new Map();
    
    this.initializeServices();
  }

  /**
   * Initialize primary and fallback services
   */
  initializeServices() {
    try {
      // Initialize primary service
      const primaryProvider = process.env.AI_PROVIDER || 'replicate';
      if (validateProvider(primaryProvider)) {
        this.primaryService = createAIService({ provider: primaryProvider });
      }
      
      // Initialize fallback services if enabled
      if (this.config.enableFallbacks) {
        this.initializeFallbacks();
      }
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
    }
  }

  /**
   * Initialize fallback services
   */
  initializeFallbacks() {
    const fallbackProviders = ['replicate']; // Add more as needed
    
    for (const provider of fallbackProviders) {
      if (provider !== process.env.AI_PROVIDER && validateProvider(provider)) {
        try {
          const fallbackService = createAIService({ provider });
          this.fallbackServices.push(fallbackService);
        } catch (error) {
          console.warn(`Failed to initialize fallback service ${provider}:`, error);
        }
      }
    }
  }

  /**
   * Generate image with smart routing and fallbacks
   */
  async generateImage(prompt, options = {}) {
    const startTime = Date.now();
    
    // Try primary service first
    if (this.primaryService) {
      try {
        const result = await this.executeWithTimeout(
          () => this.primaryService.generateImage(prompt, options),
          this.config.timeout
        );
        
        if (result.success) {
          return {
            ...result,
            provider: 'primary',
            executionTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('Primary service failed:', error.message);
        this.updateServiceHealth(this.primaryService, false);
      }
    }

    // Try fallback services
    if (this.config.enableFallbacks) {
      for (const fallbackService of this.fallbackServices) {
        try {
          const result = await this.executeWithTimeout(
            () => fallbackService.generateImage(prompt, options),
            this.config.timeout
          );
          
          if (result.success) {
            return {
              ...result,
              provider: 'fallback',
              executionTime: Date.now() - startTime
            };
          }
        } catch (error) {
          console.warn('Fallback service failed:', error.message);
          this.updateServiceHealth(fallbackService, false);
        }
      }
    }

    // All services failed
    return {
      success: false,
      error: 'All AI services are currently unavailable',
      provider: 'none',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Generate with mask support
   */
  async generateWithMask(prompt, image, maskData, options = {}) {
    const startTime = Date.now();
    
    // Try primary service first
    if (this.primaryService) {
      try {
        const result = await this.executeWithTimeout(
          () => this.primaryService.generateWithMask(prompt, image, maskData, options),
          this.config.timeout
        );
        
        if (result.success) {
          return {
            ...result,
            provider: 'primary',
            executionTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('Primary service failed:', error.message);
        this.updateServiceHealth(this.primaryService, false);
      }
    }

    // Try fallback services
    if (this.config.enableFallbacks) {
      for (const fallbackService of this.fallbackServices) {
        try {
          const result = await this.executeWithTimeout(
            () => fallbackService.generateWithMask(prompt, image, maskData, options),
            this.config.timeout
          );
          
          if (result.success) {
            return {
              ...result,
              provider: 'fallback',
              executionTime: Date.now() - startTime
            };
          }
        } catch (error) {
          console.warn('Fallback service failed:', error.message);
          this.updateServiceHealth(fallbackService, false);
        }
      }
    }

    // All services failed
    return {
      success: false,
      error: 'All AI services are currently unavailable',
      provider: 'none',
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Analyze mask with optimization
   */
  async analyzeMask(maskData) {
    // Use the healthiest service for analysis
    const service = this.getHealthiestService();
    
    if (!service) {
      return {
        success: false,
        error: 'No AI services available for mask analysis'
      };
    }

    try {
      const result = await this.executeWithTimeout(
        () => service.analyzeMask(maskData),
        this.config.timeout
      );
      
      if (result.success) {
        this.updateServiceHealth(service, true);
      }
      
      return result;
    } catch (error) {
      this.updateServiceHealth(service, false);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }

  /**
   * Get the healthiest available service
   */
  getHealthiestService() {
    const services = [this.primaryService, ...this.fallbackServices].filter(Boolean);
    
    if (services.length === 0) return null;
    
    // Sort by health score (higher is better)
    return services.sort((a, b) => {
      const healthA = this.getServiceHealth(a);
      const healthB = this.getServiceHealth(b);
      return healthB.score - healthA.score;
    })[0];
  }

  /**
   * Update service health status
   */
  updateServiceHealth(service, success) {
    const serviceId = service.name || 'unknown';
    const current = this.serviceHealth.get(serviceId) || {
      successes: 0,
      failures: 0,
      lastSuccess: null,
      lastFailure: null
    };

    if (success) {
      current.successes++;
      current.lastSuccess = Date.now();
    } else {
      current.failures++;
      current.lastFailure = Date.now();
    }

    this.serviceHealth.set(serviceId, current);
  }

  /**
   * Get service health information
   */
  getServiceHealth(service) {
    const serviceId = service.name || 'unknown';
    const health = this.serviceHealth.get(serviceId) || {
      successes: 0,
      failures: 0,
      lastSuccess: null,
      lastFailure: null
    };

    const total = health.successes + health.failures;
    const successRate = total > 0 ? health.successes / total : 0;
    
    // Calculate health score (0-100)
    let score = successRate * 100;
    
    // Penalize recent failures
    if (health.lastFailure && Date.now() - health.lastFailure < 60000) {
      score *= 0.5;
    }
    
    // Bonus for recent successes
    if (health.lastSuccess && Date.now() - health.lastSuccess < 60000) {
      score *= 1.2;
    }

    return {
      ...health,
      successRate,
      score: Math.min(100, Math.max(0, score))
    };
  }

  /**
   * Get overall system health
   */
  async getSystemHealth() {
    const health = {
      primary: this.primaryService ? await this.primaryService.healthCheck() : null,
      fallbacks: await Promise.all(
        this.fallbackServices.map(service => service.healthCheck())
      ),
      serviceHealth: Object.fromEntries(
        [this.primaryService, ...this.fallbackServices]
          .filter(Boolean)
          .map(service => [
            service.name,
            this.getServiceHealth(service)
          ])
      )
    };

    return {
      overall: health.primary?.success || health.fallbacks.some(h => h.success),
      details: health
    };
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      services: {}
    };

    for (const [serviceId, health] of this.serviceHealth.entries()) {
      const total = health.successes + health.failures;
      stats.totalRequests += total;
      stats.successfulRequests += health.successes;
      stats.failedRequests += health.failures;
      
      stats.services[serviceId] = {
        total,
        successes: health.successes,
        failures: health.failures,
        successRate: total > 0 ? (health.successes / total) * 100 : 0,
        healthScore: this.getServiceHealth({ name: serviceId }).score
      };
    }

    if (stats.totalRequests > 0) {
      stats.successRate = (stats.successfulRequests / stats.totalRequests) * 100;
    }

    return stats;
  }
}

/**
 * Create default AI service manager instance
 */
export function createAIServiceManager(config = {}) {
  return new AIServiceManager(config);
}

/**
 * Get default AI service manager
 */
export function getDefaultAIServiceManager() {
  return createAIServiceManager();
} 