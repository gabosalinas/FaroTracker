import React from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import packageJson from '../../../package.json';

const HubScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.header}>
        <Text style={styles.logo}>FARO 3D</Text>
        <Text style={styles.tagline}>Cuadernos</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Editor')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuButtonText}>MODO CREACIÓN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Catalog')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuButtonText}>CATÁLOGO DE AUTOR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => console.log('Mis Pedidos')}
          activeOpacity={0.7}
          style={{ marginBottom: 10 }}
        >
          <Text style={styles.footerLink}>MIS PEDIDOS</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>{packageJson.version}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 30,
  },
  header: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#CCCCCC',
    marginTop: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 224, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  menu: {
    flex: 2,
    justifyContent: 'center',
  },
  menuButton: {
    borderWidth: 2,
    borderColor: '#00E0FF',
    borderRadius: 4,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // Shadow glow for iOS
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 3,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  footer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 13,
    letterSpacing: 2,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  versionText: {
    fontSize: 11,
    color: '#666666',
    letterSpacing: 1.5,
    marginTop: 5,
    fontWeight: '600',
  },
});

export default HubScreen;
