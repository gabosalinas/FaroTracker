import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useDesignStore = create(
  persist(
    (set) => ({
      // Colores iniciales
      frontBaseColor: '#1A1A1A',
      frontCanvasColor: '#FFFFFF',
      backBaseColor: '#1A1A1A',
      backCanvasColor: '#FFFFFF',
      
      // Lado actual
      currentSide: 'front',
      
      // Stickers
      frontStickers: [],
      backStickers: [],
      
      // Acciones
      setBaseColor: (color) => set((state) => {
        return state.currentSide === 'front' 
          ? { frontBaseColor: color }
          : { backBaseColor: color };
      }),
      setCanvasColor: (color) => set((state) => {
        return state.currentSide === 'front' 
          ? { frontCanvasColor: color }
          : { backCanvasColor: color };
      }),
      setCurrentSide: (side) => set({ currentSide: side }),
      
      addSticker: (sticker) => set((state) => {
        const side = state.currentSide === 'front' ? 'frontStickers' : 'backStickers';
        if (state[side].length >= 5) return state;
        return { [side]: [...state[side], sticker] };
      }),
      
      updateSticker: (id, newProps) => set((state) => {
        const side = state.currentSide === 'front' ? 'frontStickers' : 'backStickers';
        return {
          [side]: state[side].map(s => s.id === id ? { ...s, ...newProps } : s)
        };
      }),
      
      removeSticker: (id) => set((state) => {
        const side = state.currentSide === 'front' ? 'frontStickers' : 'backStickers';
        return {
          [side]: state[side].filter(s => s.id !== id)
        };
      }),

      resetDesign: () => set({
        frontBaseColor: '#1A1A1A',
        frontCanvasColor: '#FFFFFF',
        backBaseColor: '#1A1A1A',
        backCanvasColor: '#FFFFFF',
        frontStickers: [],
        backStickers: [],
        currentSide: 'front'
      })
    }),
    {
      name: 'faro3d-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDesignStore;
