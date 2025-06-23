let activeContexts = 0;
const MAX_CONTEXTS = 8; // Conservative limit

export const webglContextManager = {
  canCreateContext() {
    return activeContexts < MAX_CONTEXTS;
  },
  
  registerContext() {
    activeContexts++;
    // console.log(`WebGL contexts active: ${activeContexts}`);
  },
  
  unregisterContext() {
    activeContexts = Math.max(0, activeContexts - 1);
    // console.log(`WebGL contexts active: ${activeContexts}`);
  },
  
  getActiveCount() {
    return activeContexts;
  }
};