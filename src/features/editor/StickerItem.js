import React, { useRef } from 'react';
import { StyleSheet, Text, Animated, PanResponder, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { STICKERS } from './StickerPicker';
import useDesignStore from '../../store/useDesignStore';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width * 0.8;

const StickerItem = ({ sticker, isSelected, onSelect }) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x || 0, y: sticker.y || 0 })).current;
  
  const scaleAnim = useRef(new Animated.Value(sticker.scale || 1)).current;
  const rotationAnim = useRef(new Animated.Value(sticker.rotation || 0)).current;

  const scaleRef = useRef(sticker.scale || 1);
  const rotationRef = useRef(sticker.rotation || 0);

  const updateSticker = useDesignStore(state => state.updateSticker);
  const removeSticker = useDesignStore(state => state.removeSticker);

  const originalId = sticker.id.split('-')[0];
  const originalSticker = STICKERS.find(s => s.id === originalId);
  const imageSource = originalSticker ? originalSticker.image : null;
  const iconSource = originalSticker ? originalSticker.icon : null;

  // PanResponder para el movimiento (Drag)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Solo activamos el drag si el movimiento es significativo
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
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
        const x = pan.x._value;
        const y = pan.y._value;

        // Calcular porcentaje del sticker que queda fuera del lienzo (W_c, H_c)
        const W_c = CANVAS_SIZE - 20;
        const H_c = (CANVAS_SIZE * 1.3) - 20;

        const overlap_x = Math.max(0, Math.min(x + 80, W_c) - Math.max(x, 0));
        const overlap_y = Math.max(0, Math.min(y + 80, H_c) - Math.max(y, 0));

        const area_overlap = overlap_x * overlap_y;
        const area_total = 6400;
        const percentage_inside = area_overlap / area_total;

        if (percentage_inside < 0.2) {
          // Más del 80% está por fuera. Confirmar eliminación.
          Alert.alert(
            "Borrar Sticker",
            "¿Querés eliminar este sticker del diseño?",
            [
              {
                text: "No",
                onPress: () => {
                  // Ajustar posición para devolverlo completamente dentro del lienzo
                  const safe_x = Math.max(0, Math.min(x, W_c - 80));
                  const safe_y = Math.max(0, Math.min(y, H_c - 80));
                  
                  updateSticker(sticker.id, { x: safe_x, y: safe_y });
                  
                  // Animación suave de rebote hacia la posición segura
                  Animated.spring(pan, {
                    toValue: { x: safe_x, y: safe_y },
                    useNativeDriver: false
                  }).start();
                },
                style: "cancel"
              },
              {
                text: "Sí, Borrar",
                onPress: () => {
                  removeSticker(sticker.id);
                },
                style: "destructive"
              }
            ]
          );
        } else {
          // Menos del 80% afuera, simplemente guardar su nueva posición
          updateSticker(sticker.id, { x, y });
        }
      }
    })
  ).current;

  // Ciclo de escala: 1 -> 1.5 -> 2 -> 1
  const handleLongPress = () => {
    if (onSelect) onSelect();
    scaleRef.current = scaleRef.current >= 4 ? 1 : scaleRef.current + 0.5;
    updateSticker(sticker.id, { scale: scaleRef.current });
    Animated.spring(scaleAnim, {
      toValue: scaleRef.current,
      useNativeDriver: false
    }).start();
  };

  // Ciclo de rotación: +45 grados por tap (sólo si ya está seleccionado, de lo contrario sólo lo selecciona)
  const handlePress = () => {
    if (!isSelected) {
      if (onSelect) onSelect();
    } else {
      rotationRef.current += 45;
      updateSticker(sticker.id, { rotation: rotationRef.current });
      Animated.spring(rotationAnim, {
        toValue: rotationRef.current,
        useNativeDriver: false
      }).start();
    }
  };

  const rotateStr = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
            { rotate: rotateStr }
          ]
        },
        isSelected && styles.selectedContainer
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        onPress={handlePress} 
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.8}
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
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stickerImage: {
    width: 80,
    height: 80,
  },
  stickerIcon: {
    fontSize: 60,
    textAlign: 'center',
  },
  selectedContainer: {
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 224, 255, 0.05)',
  },
});

export default StickerItem;
