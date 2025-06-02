// components/RealisticARPreview/components/BodyPartSelector.js
import { useState } from 'react';
import { ChevronDown, Target, User } from 'lucide-react';
import { BODY_PARTS } from '../utils/constants';

export const BodyPartSelector = ({ 
  currentBodyPart, 
  onBodyPartChange, 
  detectedParts,
  isExpanded,
  onToggleExpanded 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Flatten body parts with categories
  const allBodyParts = [
    { value: 'auto', label: '🎯 Auto-Detect', category: 'Smart' },
    { value: 'manual', label: '✋ Manual Position', category: 'Manual' },
    ...Object.entries(BODY_PARTS).flatMap(([category, parts]) => 
      parts.map(part => ({
        value: part,
        label: part.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        category,
        isDetected: isPartDetected(part, detectedParts)
      }))
    )
  ];

  function isPartDetected(partName, detected) {
    // Map part names to detection status
    const partMap = {
      'left-arm': detected.leftArm?.visible,
      'right-arm': detected.rightArm?.visible,
      'left-forearm': detected.leftArm?.visible && detected.leftArm?.section !== 'upper',
      'right-forearm': detected.rightArm?.visible && detected.rightArm?.section !== 'upper',
      'left-hand': detected.leftHand?.visible,
      'right-hand': detected.rightHand?.visible,
      'chest': detected.chest?.visible && detected.chest?.orientation === 'front',
      'back': detected.back?.visible,
      'neck': detected.neck?.visible,
      'face': detected.face?.visible,
      'left-leg': detected.leftLeg?.visible,
      'right-leg': detected.rightLeg?.visible,
      'left-calf': detected.leftLeg?.visible && detected.leftLeg?.section !== 'upper',
      'right-calf': detected.rightLeg?.visible && detected.rightLeg?.section !== 'upper',
      'left-foot': detected.leftFoot?.visible,
      'right-foot': detected.rightFoot?.visible,
    };
    return partMap[partName] || false;
  }

  const getCurrentLabel = () => {
    const current = allBodyParts.find(p => p.value === currentBodyPart);
    return current?.label || 'Select Body Part';
  };

  const getDetectedCount = () => {
    return allBodyParts.filter(p => p.isDetected).length;
  };

  if (!isExpanded) {
    // Compact mode - just a button
    return (
      <button
        onClick={onToggleExpanded}
        className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
        title="Body part selection"
      >
        <Target className="w-5 h-5 sm:w-6 sm:h-6" />
        {getDetectedCount() > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {getDetectedCount()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all min-w-[200px]"
      >
        <User className="w-4 h-4" />
        <span className="flex-1 text-left text-sm">{getCurrentLabel()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 left-0 right-0 bg-black/80 backdrop-blur-lg rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {['Smart', 'Manual', 'Arms', 'Torso', 'Legs', 'Head'].map(category => {
              const categoryParts = allBodyParts.filter(p => p.category === category);
              if (categoryParts.length === 0) return null;

              return (
                <div key={category}>
                  <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider">
                    {category}
                  </div>
                  {categoryParts.map(part => (
                    <button
                      key={part.value}
                      onClick={() => {
                        onBodyPartChange(part.value);
                        setShowDropdown(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 transition-colors ${
                        currentBodyPart === part.value ? 'bg-white/20 text-white' : 'text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {part.label}
                        {part.isDetected && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Detected
                          </span>
                        )}
                      </span>
                      {currentBodyPart === part.value && (
                        <span className="text-blue-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};