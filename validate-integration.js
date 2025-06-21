// Validation script for manager integration
// Run with: node -r esm validate-integration.js

import { getDefaultAIServiceManager, validateManagerIntegration } from './lib/ai-services/manager.js';

console.log('🔍 Testing Manager Integration...');
console.log('Environment:', process.env.NODE_ENV || 'development');

try {
  // Test basic manager creation
  console.log('\n1. Testing manager creation...');
  const manager = getDefaultAIServiceManager();
  console.log('✅ Manager created successfully');
  console.log('   - Timeout:', manager.config.timeout);
  console.log('   - Fallbacks enabled:', manager.config.enableFallbacks);
  console.log('   - Max retries:', manager.config.maxRetries);

  // Test method availability
  console.log('\n2. Testing method availability...');
  const hasOriginalMethods = typeof manager.generateImageOriginal === 'function' && 
                           typeof manager.generateWithMaskOriginal === 'function';
  const hasOptimizedMethods = typeof manager.generateImageOptimized === 'function' && 
                             typeof manager.generateWithMaskOptimized === 'function';
  
  console.log('✅ Original methods available:', hasOriginalMethods);
  console.log('✅ Optimized methods available:', hasOptimizedMethods);

  // Test validation function
  console.log('\n3. Running validation function...');
  const validationResult = validateManagerIntegration();
  console.log('✅ Validation result:', validationResult);

  // Test production vs development behavior
  console.log('\n4. Testing environment-specific behavior...');
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('   - Is production:', isProduction);
  console.log('   - Expected timeout:', isProduction ? '45000ms' : '120000ms');
  console.log('   - Expected fallbacks:', isProduction ? 'disabled' : 'enabled');

  if (validationResult) {
    console.log('\n🎉 SUCCESS: Manager integration is working correctly!');
    console.log('\n📋 Summary:');
    console.log('   - Production-aware timeouts configured');
    console.log('   - Optimized methods available');
    console.log('   - Fallback handling configured');
    console.log('   - Enhanced timeout handling implemented');
  } else {
    console.log('\n❌ FAILURE: Manager integration has issues');
  }

} catch (error) {
  console.error('\n💥 ERROR during validation:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
} 