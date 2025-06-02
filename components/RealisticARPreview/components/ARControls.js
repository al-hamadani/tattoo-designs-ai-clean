// components/RealisticARPreview/components/ARControls.js
import { User, SwitchCamera, Sliders, X, RotateCcw, Download, ZoomIn, ZoomOut, Info } from "lucide-react";
import { BodyPartSelector } from './BodyPartSelector';
export const ARControls = ({
  show,
  settings,
  detectedParts,
  onTogglePose,
  onSwitchCamera,
  onShowAdvanced,
  onClose,
  onReset,
  onCapture,
  onScaleChange,
  onBodyPartChange

}) => {
  // Format detected parts for display
  const getDetectedPartsInfo = () => {
    const detected = [];
    Object.entries(detectedParts).forEach(([part, info]) => {
      if (info.visible) {
        let label = part.replace(/([A-Z])/g, ' $1').trim();
        if (info.section) label += ` (${info.section})`;
        if (info.orientation) label += ` - ${info.orientation}`;
        detected.push(label);
      }
    });
    return detected.join(', ') || 'No body parts detected';
  };

  return (
    <>
      {/* Header controls */}
      <div className={`fixed top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-4 transition-all duration-300 z-20 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}>
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-base sm:text-lg">AR Tattoo Preview</h3>
            {settings.enablePose && (
              <BodyPartSelector
                              currentBodyPart={settings.bodyPart}
                              onBodyPartChange={onBodyPartChange}
                              detectedParts={detectedParts}
                              isExpanded={true}
                              onToggleExpanded={() => {}}
                       />
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onTogglePose}
              className={`p-2 rounded-full text-white transition-colors backdrop-blur-md ${
                settings.enablePose ? 'bg-green-500/30 hover:bg-green-500/40' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={settings.enablePose ? "Disable Body Tracking" : "Enable Body Tracking"}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onSwitchCamera}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onShowAdvanced}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
              title="Advanced settings"
            >
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/40"
              title="Close AR"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent transition-all duration-300 z-20 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={settings.scaleFactor}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(settings.scaleFactor - 0.05) / 0.45 * 100}%, rgba(255,255,255,0.2) ${(settings.scaleFactor - 0.05) / 0.45 * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onReset}
              className="flex-1 bg-white/10 backdrop-blur-md text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-white/20 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onCapture}
              className="flex-1 bg-blue-500 text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};