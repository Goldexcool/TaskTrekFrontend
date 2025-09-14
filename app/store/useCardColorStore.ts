import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Available color schemes for cards and columns
export const CARD_COLORS = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: 'Green', value: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { name: 'Red', value: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { name: 'Gray', value: 'bg-black-100 text-gray-800 dark:bg-black-800 dark:text-gray-300' },
];

// Default color for new columns
export const DEFAULT_COLOR = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';

// Define color store interface
interface CardColorState {
  colors: Record<string, string>;
  getCardColor: (id: string) => string;
  setCardColor: (id: string, color: string) => void;
  removeCardColor: (id: string) => void;
}

// Create the store with persistence
const useCardColorStore = create<CardColorState>()(
  persist(
    (set, get) => ({
      colors: {},
      
      getCardColor: (id: string) => {
        // Generate a deterministic color if not explicitly set
        if (!get().colors[id]) {
          // Use a hash of the ID to pick a color from CARD_COLORS
          const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const colorIndex = hash % CARD_COLORS.length;
          return CARD_COLORS[colorIndex].value;
        }
        return get().colors[id] || DEFAULT_COLOR;
      },
      
      setCardColor: (id: string, color: string) => 
        set(state => ({
          colors: {
            ...state.colors,
            [id]: color
          }
        })),
      
      removeCardColor: (id: string) =>
        set(state => {
          const newColors = { ...state.colors };
          delete newColors[id];
          return { colors: newColors };
        })
    }),
    {
      name: 'column-colors', // localStorage key
    }
  )
);

export default useCardColorStore;