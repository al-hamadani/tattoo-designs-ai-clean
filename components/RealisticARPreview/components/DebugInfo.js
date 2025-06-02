export const DebugInfo = ({ show, fps, additionalInfo }) => {
  if (!show) return null;
  
  return (
    <div className="absolute top-4 left-4 text-white text-xs bg-black/50 backdrop-blur-sm p-2 rounded z-50">
      <div>FPS: {fps}</div>
      {additionalInfo && <div>{additionalInfo}</div>}
    </div>
  );
};