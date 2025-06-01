// components/RealisticARPreview/components/ErrorDisplay.js
import { Camera } from 'lucide-react';

export const ErrorDisplay = ({ error, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50 p-4">
      <div className="bg-gray-800 text-white rounded-xl p-6 max-w-md w-full text-center space-y-4">
        <Camera className="w-12 h-12 mx-auto text-red-400" />
        <p className="text-lg font-semibold">AR Preview Error</p>
        <p className="text-sm text-gray-300">{error}</p>
        <button 
          onClick={onClose} 
          className="bg-blue-600 rounded-lg px-4 py-2 text-white hover:bg-blue-700 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};