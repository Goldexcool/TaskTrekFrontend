import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { CARD_COLORS } from '@/app/store/useCardColorStore';

interface BoardColorPickerProps {
  initialBackgroundColor?: string;
  initialColorScheme?: string;
  onBackgroundColorChange: (color: string) => void;
  onColorSchemeChange: (scheme: string) => void;
}

const BoardColorPicker: React.FC<BoardColorPickerProps> = ({
  initialBackgroundColor = '#6366F1', // Default indigo color
  initialColorScheme,
  onBackgroundColorChange,
  onColorSchemeChange
}) => {
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [colorScheme, setColorScheme] = useState(initialColorScheme || CARD_COLORS[0].value);
  const [showPicker, setShowPicker] = useState(false);
  
  // Handle background color change
  const handleBackgroundColorChange = (newColor: string) => {
    setBackgroundColor(newColor);
    onBackgroundColorChange(newColor);
  };
  
  // Handle color scheme change
  const handleColorSchemeChange = (newScheme: string) => {
    setColorScheme(newScheme);
    onColorSchemeChange(newScheme);
  };
  
  return (
    <div className="space-y-4">
      {/* Background color picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Board Background
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div 
              className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
              style={{ backgroundColor }}
              onClick={() => setShowPicker(!showPicker)}
              aria-label="Select background color"
            />
            {showPicker && (
              <div className="absolute z-10 mt-2">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowPicker(false)}
                />
                <HexColorPicker 
                  color={backgroundColor}
                  onChange={handleBackgroundColorChange}
                />
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {backgroundColor}
          </span>
        </div>
      </div>
      
      {/* Card color scheme picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Color Scheme
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CARD_COLORS.map((colorOption) => (
            <button
              key={colorOption.name}
              type="button"
              className={`rounded-md py-2 px-3 text-xs font-medium ${colorOption.value} border ${
                colorScheme === colorOption.value 
                ? 'ring-2 ring-offset-2 ring-indigo-500' 
                : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => handleColorSchemeChange(colorOption.value)}
              title={colorOption.name}
            >
              {colorOption.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BoardColorPicker;