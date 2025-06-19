import { useRef } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';

export default function ImageUploadAndMask({ uploadedImage, setUploadedImage, fileInputRef, showCamera, setShowCamera, handleImageUpload, DrawingCanvas, drawingCanvasRef, maskColor = '#3B82F6', eraseColor = '#ffffff', children }) {
  return (
    <div>
      {!uploadedImage ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Upload a clear photo showing the area you want to work with
          </p>
          <div className="flex justify-center gap-4">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Photo
              </div>
            </label>
            <button 
              onClick={() => setShowCamera(true)}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <DrawingCanvas
            ref={drawingCanvasRef}
            image={uploadedImage}
            maskColor={maskColor}
            eraseColor={eraseColor}
          />
          <button
            onClick={() => {
              setUploadedImage(null);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Upload different photo
          </button>
          {children}
        </div>
      )}
    </div>
  );
} 