export default function ComplexitySelector({ complexity, setComplexity, placement, setPlacement, size, setSize, complexityLevels, placementOptions, sizeOptions }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detail Level
        </label>
        <select
          value={complexity}
          onChange={(e) => setComplexity(e.target.value)}
          className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        >
          {complexityLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Placement
        </label>
        <select
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        >
          {placementOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size Guide
        </label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
        >
          {sizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 