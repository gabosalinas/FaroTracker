import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useDesignStore = create(
  persist(
    (set) => ({
      // Colores iniciales
      boardColor: '#4F9EE9',
      accentColor: '#000000',
      textColor: '#FFFFFF',
      
      // Cantidad de filas (1-6)
      rowCount: 4,
      
      // Inventario del set de fichas: [{ iconId, quantity }]
      tokenPack: [],
      
      // Fichas colocadas en el tablero: [{ id, iconId, column, row }]
      placedTokens: [],
      
      // Acciones de color
      setBoardColor: (color) => set({ boardColor: color }),
      setAccentColor: (color) => set({ accentColor: color }),
      setTextColor: (color) => set({ textColor: color }),
      
      // Acciones de estructura
      setRowCount: (count) => set((state) => {
        const nextCount = Math.min(6, Math.max(1, count));
        // Filtrar fichas que queden fuera del nuevo límite de filas
        const filteredPlaced = state.placedTokens.filter(t => t.row < nextCount);
        return {
          rowCount: nextCount,
          placedTokens: filteredPlaced
        };
      }),
      
      // Acciones de set de fichas (inventario)
      updateTokenPackQuantity: (iconId, delta) => set((state) => {
        const existingIndex = state.tokenPack.findIndex(t => t.iconId === iconId);
        let newTokenPack = [...state.tokenPack];
        let targetQuantity = 0;

        if (existingIndex > -1) {
          const currentQty = state.tokenPack[existingIndex].quantity;
          const nextQty = currentQty + delta;
          if (nextQty <= 0) {
            newTokenPack.splice(existingIndex, 1);
            targetQuantity = 0;
          } else {
            newTokenPack[existingIndex] = { iconId, quantity: nextQty };
            targetQuantity = nextQty;
          }
        } else if (delta > 0) {
          newTokenPack.push({ iconId, quantity: delta });
          targetQuantity = delta;
        }

        // Si la nueva cantidad física es menor que la cantidad de fichas de este tipo colocadas en el grid,
        // remover los excesos colocados (de atrás hacia adelante).
        const placedOfType = state.placedTokens.filter(t => t.iconId === iconId);
        let newPlacedTokens = [...state.placedTokens];
        
        if (placedOfType.length > targetQuantity) {
          const toRemoveCount = placedOfType.length - targetQuantity;
          let removed = 0;
          for (let i = newPlacedTokens.length - 1; i >= 0; i--) {
            if (newPlacedTokens[i].iconId === iconId) {
              newPlacedTokens.splice(i, 1);
              removed++;
              if (removed >= toRemoveCount) break;
            }
          }
        }

        return {
          tokenPack: newTokenPack,
          placedTokens: newPlacedTokens
        };
      }),
      
      // Acciones sobre el tablero (colocar fichas)
      placeToken: (id, iconId, column, row) => set((state) => {
        // Remover cualquier otra ficha que esté colocada en la misma posición (Slot Lock)
        let cleanedPlaced = state.placedTokens.filter(t => !(t.column === column && t.row === row) && t.id !== id);
        
        // Agregar la ficha en su nueva posición
        cleanedPlaced.push({ id, iconId, column, row });
        
        return {
          placedTokens: cleanedPlaced
        };
      }),
      
      removePlacedToken: (id) => set((state) => ({
        placedTokens: state.placedTokens.filter(t => t.id !== id)
      })),

      resetDesign: () => set({
        boardColor: '#4F9EE9',
        accentColor: '#000000',
        textColor: '#FFFFFF',
        rowCount: 4,
        tokenPack: [],
        placedTokens: []
      })
    }),
    {
      name: 'farotracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDesignStore;
