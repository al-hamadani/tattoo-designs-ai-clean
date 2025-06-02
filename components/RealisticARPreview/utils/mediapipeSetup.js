// components/RealisticARPreview/utils/mediapipeSetup.js

// Setup browser environment for MediaPipe
export const setupMediaPipeEnvironment = () => {
    if (typeof window !== 'undefined') {
      // MediaPipe expects these globals
      window.createMediapipeSolutionsWasm = () => {
        return {
          locateFile: (file) => {
            console.log('MediaPipe locateFile called for:', file);
            return file;
          }
        };
      };
  
      // Fix for Module.arguments error
      if (!window.Module) {
        window.Module = {
          arguments: [],
          preRun: [],
          postRun: [],
          print: console.log,
          printErr: console.error,
          setStatus: (text) => console.log('Module status:', text),
          monitorRunDependencies: () => {},
        };
      }
    }
  };