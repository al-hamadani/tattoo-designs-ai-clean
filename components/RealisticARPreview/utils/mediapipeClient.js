// components/RealisticARPreview/utils/mediapipeClient.js

// Setup global environment for MediaPipe WASM
export const setupMediaPipeEnvironment = () => {
    if (typeof window === 'undefined') return;
  
    // Create required globals
    if (!window.Module) {
      window.Module = {
        onRuntimeInitialized: () => {},
        arguments: [],
        preRun: [],
        postRun: [],
        print: (text) => console.log(text),
        printErr: (text) => console.error(text),
        setStatus: (text) => console.log('Status:', text),
        locateFile: (path) => path,
      };
    }
  
    // Polyfill for MediaPipe's expected environment
    window.createMediapipeSolutionsWasm = () => ({
      locateFile: (path) => path,
    });
  
    // Fix for MediaPipe's internal checks
    window.importScripts = () => {};
  };
  
  // Dynamic loader for MediaPipe
  export const loadMediaPipe = async () => {
    if (typeof window === 'undefined') {
      throw new Error('MediaPipe can only be loaded in browser environment');
    }
  
    setupMediaPipeEnvironment();
  
    // Dynamically import MediaPipe modules
    const [{ Pose }, { SelfieSegmentation }] = await Promise.all([
      import('@mediapipe/pose'),
      import('@mediapipe/selfie_segmentation'),
    ]);
  
    return { Pose, SelfieSegmentation };
  };