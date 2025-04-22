/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ChromePicker } from 'react-color';

interface BoardColorSelectorProps {
  initialColor?: string;
  onColorChange: (color: string) => void;
}

const BoardColorSelector: React.FC<BoardColorSelectorProps> = ({ 
  initialColor = '#6366F1', // Default indigo color
  onColorChange 
}) => {
  const [color, setColor] = useState(initialColor);
  const [showPicker, setShowPicker] = useState(false);
  
  const handleColorChange = (newColor: any) => {
    setColor(newColor.hex);
    onColorChange(newColor.hex);
  };
  
  return (
    <div className="relative">
      <div 
        className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => setShowPicker(!showPicker)}
        aria-label="Select color"
      />
      
      {showPicker && (
        <div className="absolute z-10 mt-2">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowPicker(false)}
          />
          <ChromePicker 
            color={color} 
            onChange={handleColorChange}
            disableAlpha={true}
          />
        </div>
      )}
    </div>
  );
};

export default BoardColorSelector;