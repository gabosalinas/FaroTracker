import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const Button = ({ title, onPress, variant = 'primary', style }) => {
  const isSecondary = variant === 'secondary';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isSecondary ? styles.secondaryButton : styles.primaryButton,
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.text,
        isSecondary ? styles.secondaryText : styles.primaryText
      ]}>
        {title.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 2,
  },
  primaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: '#00E0FF',
    // Glow shadow for iOS
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  primaryText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  secondaryText: {
    color: '#FFFFFF',
  },
});

export default Button;
