import React from 'react';
import useCardColorStore, { CARD_COLORS } from '@/app/store/useCardColorStore';

interface TaskColorPickerProps {
  taskId: string;
  onClose: () => void;
}

const TaskColorPicker: React.FC<TaskColorPickerProps> = ({ taskId, onClose }) => {
  const { getCardColor, setCardColor } = useCardColorStore();
  const currentColor = getCardColor(taskId);
  
  return (
    <div className="absolute z-50 mt-1 right-0 bg-white dark:bg-black-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[150px]">
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">Card Color</h4>
      <div className="grid grid-cols-3 gap-1">
        {CARD_COLORS.map((colorOption) => (
          <button
            key={colorOption.name}
            className={`h-6 w-6 rounded-md ${colorOption.value} border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-indigo-500 ${
              currentColor === colorOption.value ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => {
              setCardColor(taskId, colorOption.value);
              onClose();
            }}
            aria-label={`Set card color to ${colorOption.name}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskColorPicker;