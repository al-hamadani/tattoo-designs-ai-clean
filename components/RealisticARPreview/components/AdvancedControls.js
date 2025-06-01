// components/RealisticARPreview/components/AdvancedControls.js
import { BLEND_MODES, BODY_PARTS } from '../utils/constants';

export const AdvancedControls = ({ show, settings, onUpdateSettings }) => {
  const handleSettingChange = (key, value) => {
    onUpdateSettings(prev => ({ ...prev, [key]: value }));
  };

  const allBodyParts = [
    { value: 'auto', label: 'Auto-Detect' },
    { value: 'manual', label: 'Manual Position' },
    ...Object.entries(BODY_PARTS).flatMap(([category, parts]) => 
      parts.map(part => ({
        value: part,
        label: part.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        category
      }))
    )
  ];

  return (
    <div className={`fixed top-16 sm:top-20 right-3 sm:right-4 bg-black/70 backdrop-blur-lg rounded-lg p-3 sm:p-4 text-white w-[280px] sm:w-[320px] z-30 shadow-xl transition-all duration-300 ${
      show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
    }`}>
      <h4 className="font-semibold mb-3 text-sm sm:text-base">Advanced Settings</h4>
      <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
        <div>
          <label className="text-xs sm:text-sm mb-1 block">Body Part:</label>
          <select
            value={settings.bodyPart}
            onChange={(e) => handleSettingChange('bodyPart', e.target.value)}
            className="w-full p-2 bg-white/10 rounded text-xs sm:text-sm backdrop-blur-sm"
          >
            {allBodyParts.map(part => (
              <option key={part.value} value={part.value} className="bg-gray-800">
                {part.category && `[${part.category}] `}{part.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs sm:text-sm mb-1 block">
            Opacity: {Math.round(settings.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={settings.opacity}
            onChange={(e) => handleSettingChange('opacity', parseFloat(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm mb-1 block">
            Rotation: {settings.rotationDeg}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={settings.rotationDeg}
            onChange={(e) => handleSettingChange('rotationDeg', parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm mb-1 block">Blend Mode:</label>
          <select
            value={settings.blendMode}
            onChange={(e) => handleSettingChange('blendMode', e.target.value)}
            className="w-full p-2 bg-white/10 rounded text-xs sm:text-sm backdrop-blur-sm"
          >
            {BLEND_MODES.map(mode => (
              <option key={mode.value} value={mode.value} className="bg-gray-800">
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-white/20">
          <h5 className="text-xs font-semibold mb-2">Position Offset</h5>
          <div className="space-y-2">
            <div>
              <label className="text-xs block mb-1">
                X: {Math.round(settings.offset.x * 100)}%
              </label>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={settings.offset.x}
                onChange={(e) => handleSettingChange('offset', {
                  ...settings.offset,
                  x: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">
                Y: {Math.round(settings.offset.y * 100)}%
              </label>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={settings.offset.y}
                onChange={(e) => handleSettingChange('offset', {
                  ...settings.offset,
                  y: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};