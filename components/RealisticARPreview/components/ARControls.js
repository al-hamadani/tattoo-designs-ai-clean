import { User, SwitchCamera, Sliders, X, RotateCcw, Download, ZoomIn, ZoomOut, Info, Eye, EyeOff } from "lucide-react";
import { BodyPartSelector } from './BodyPartSelector';
export const ARControls = ({
  show,
  showAdvanced,
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
    return detected.length;
  };

  return (
    <>
      {/* Header controls */}
      <div className={`fixed top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 sm:p-4 transition-all duration-300 z-40 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}>
        <div className="flex items-center justify-between">
          {/* Left side - Body part selector */}
          <div className="flex items-center gap-2 flex-1">
            <BodyPartSelector
              currentBodyPart={settings.bodyPart}
              onBodyPartChange={onBodyPartChange}
              detectedParts={detectedParts}
              isExpanded={false}
              onToggleExpanded={() => {}}
            />

            {/* Tracking status - make it smaller on mobile */}
            {settings.enablePose && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Tracking ({getDetectedPartsInfo()} parts)
              </div>
            )}
          </div>

          {/* Right side - Control buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePose}
              className={`p-2 rounded-full text-white transition-all backdrop-blur-md ${
                settings.enablePose
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={settings.enablePose ? 'Disable tracking' : 'Enable tracking'}
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={onSwitchCamera}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>

            {!showAdvanced && (
              <button
                onClick={onShowAdvanced}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                title="Settings"
              >
                <Sliders className="w-5 h-5" />
              </button>
            )}

            {/* Close button - make it more prominent */}
            <button
              onClick={onClose}
              className="p-2 bg-red-500 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile tracking status */}
        {settings.enablePose && (
          <div className="sm:hidden mt-2 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Tracking ({getDetectedPartsInfo()} parts)
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent transition-all duration-300 z-40 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        <div className="px-4 sm:px-6 pt-6 pb-6">
          {/* Scale control with visual feedback */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-white/70 mb-2">
              <span>Size</span>
              <span>{Math.round(settings.scaleFactor * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={settings.scaleFactor}
                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                    ((settings.scaleFactor - 0.05) / 0.45) * 100
                  }%, rgba(255,255,255,0.2) ${
                    ((settings.scaleFactor - 0.05) / 0.45) * 100
                  }%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onReset}
              className="flex-1 bg-white/10 backdrop-blur-md text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onCapture}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Save Photo</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};