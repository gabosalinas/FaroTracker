import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, Animated, PanResponder, TouchableOpacity, Image, Dimensions, View } from 'react-native';
import { STICKERS } from './StickerPicker';
import useDesignStore from '../../store/useDesignStore';

const { width } = Dimensions.get('window');
const BOARD_WIDTH = width * 0.92;
const PADDING_X = 10;
const COLUMN_WIDTH = (BOARD_WIDTH - 2 * PADDING_X) / 7;
const ROW_HEIGHT = 45;
const HEADER_HEIGHT = 35;
const TOKEN_RADIUS = 18;

const getSlotPosition = (col, r) => {
  const centerX = PADDING_X + col * COLUMN_WIDTH + COLUMN_WIDTH / 2;
  const centerY = HEADER_HEIGHT + r * ROW_HEIGHT + ROW_HEIGHT / 2;
  return {
    x: centerX - TOKEN_RADIUS,
    y: centerY - TOKEN_RADIUS
  };
};

const StickerItem = ({ sticker, isSelected, onSelect }) => {
  const { boardColor, accentColor, placeToken, removePlacedToken } = useDesignStore();

  // Posición inicial estática basada en su celda actual
  const initialPos = getSlotPosition(sticker.column, sticker.row);
  const pan = useRef(new Animated.ValueXY(initialPos)).current;

  // Sincronizar posición animada cuando cambian fila o columna
  useEffect(() => {
    const pos = getSlotPosition(sticker.column, sticker.row);
    Animated.spring(pan, {
      toValue: pos,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [sticker.column, sticker.row]);

  const originalId = sticker.iconId;
  const originalSticker = STICKERS.find(s => s.id === originalId);
  const imageSource = originalSticker ? originalSticker.image : null;
  const iconSource = originalSticker ? originalSticker.icon : null;

  // PanResponder para el movimiento de arrastre (Drag & Drop)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        if (onSelect) onSelect();
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const currentX = pan.x._value;
        const currentY = pan.y._value;

        // Coordenadas del centro del token durante el release
        const tokenCenterX = currentX + TOKEN_RADIUS;
        const tokenCenterY = currentY + TOKEN_RADIUS;

        // Calcular columna y fila más cercanas
        const col = Math.round((tokenCenterX - PADDING_X - COLUMN_WIDTH / 2) / COLUMN_WIDTH);
        const row = Math.round((tokenCenterY - HEADER_HEIGHT - ROW_HEIGHT / 2) / ROW_HEIGHT);

        const rowCount = useDesignStore.getState().rowCount;
        const colValid = col >= 0 && col <= 6;
        const rowValid = row >= 0 && row < rowCount;

        if (colValid && rowValid) {
          const slotPos = getSlotPosition(col, row);
          const slotCenterX = slotPos.x + TOKEN_RADIUS;
          const slotCenterY = slotPos.y + TOKEN_RADIUS;
          const dist = Math.sqrt(Math.pow(tokenCenterX - slotCenterX, 2) + Math.pow(tokenCenterY - slotCenterY, 2));

          if (dist < 35) {
            // Imantar al slot
            placeToken(sticker.id, sticker.iconId, col, row);
            return;
          }
        }

        // Si se arrastró muy lejos o fuera, remover del tablero
        removePlacedToken(sticker.id);
      }
    })
  ).current;

  const handlePress = () => {
    if (onSelect) onSelect();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y }
          ],
          backgroundColor: boardColor,
          borderColor: isSelected ? '#FFFFFF' : accentColor,
        },
        isSelected && styles.selectedContainer
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {imageSource ? (
          <Image source={imageSource} style={styles.stickerImage} resizeMode="contain" />
        ) : (
          <Text style={styles.stickerIcon}>{iconSource}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TOKEN_RADIUS * 2,
    height: TOKEN_RADIUS * 2,
    borderRadius: TOKEN_RADIUS,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Sombra premium para simular relieve físico de la ficha
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerImage: {
    width: 24,
    height: 24,
  },
  stickerIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default StickerItem;
