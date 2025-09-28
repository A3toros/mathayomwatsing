import React from 'react';
import { DRAWING_TOOLS, COLOR_PALETTE } from '../utils/constants';

const Toolbar = ({ currentTool, currentColor, onToolChange, onColorChange }) => {
  const tools = [
    { id: DRAWING_TOOLS.PENCIL, icon: '✏️', label: 'Pencil' },
    { id: DRAWING_TOOLS.LINE, icon: '📏', label: 'Line' },
    { id: DRAWING_TOOLS.RECTANGLE, icon: '⬜', label: 'Rectangle' },
    { id: DRAWING_TOOLS.CIRCLE, icon: '⭕', label: 'Circle' },
    { id: DRAWING_TOOLS.PAN, icon: '✋', label: 'Pan' },
  ];

  const colors = COLOR_PALETTE;

  return (
    <div className="absolute top-4 left-4 flex flex-col space-y-2">
      {/* Tools */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col space-y-1">
        <div className="text-xs text-gray-500 mb-1">Tools</div>
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
              currentTool === tool.id 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}
      </div>
      
      {/* Colors */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col space-y-1">
        <div className="text-xs text-gray-500 mb-1">Colors</div>
        <div className="grid grid-cols-2 gap-1">
          {colors.map(color => (
            <button
              key={color}
              className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                currentColor === color 
                  ? 'border-gray-800 shadow-md scale-110' 
                  : 'border-gray-300 hover:border-gray-500 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
