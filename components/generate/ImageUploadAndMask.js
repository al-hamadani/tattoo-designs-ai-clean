// components/generate/ImageUploadAndMask.js - Updated version
import { useRef } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';

export default function ImageUploadAndMask({ 
  uploadedImage, 
  setUploadedImage, 
  fileInputRef, 
  showCamera, 
  setShowCamera, 
  handleImageUpload, 
  DrawingCanvas, 
  drawingCanvasRef, 
  maskColor = '#3B82F6', 
  eraseColor = '#ffffff', 
  children,
  hidePhotoOptions = false,
  useWhiteCanvas = false,
  penColor
}) {
  // Use provided penColor or fall back to maskColor
  const finalPenColor = penColor || maskColor;
  
  return (
    <div>
      {!uploadedImage || uploadedImage === 'white-canvas' ? (
        <div className="space-y-4">
          <DrawingCanvas
            ref={drawingCanvasRef}
            image={uploadedImage}
            maskColor={finalPenColor}
            eraseColor={eraseColor}
            useWhiteCanvas={true}
          />
          {children}
        </div>
      ) : (
        <div className="space-y-4">
          <DrawingCanvas
            ref={drawingCanvasRef}
            image={uploadedImage}
            maskColor={finalPenColor}
            eraseColor={eraseColor}
            useWhiteCanvas={useWhiteCanvas}
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