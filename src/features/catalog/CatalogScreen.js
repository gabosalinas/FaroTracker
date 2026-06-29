import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODELS = [
  {
    id: '1',
    name: 'Rutina Kids',
    image: require('../../../assets/catalog/Formula1/Formula1.jpg'),
    tagline: 'EDICIÓN ORGANIZADOR DIARIO',
  },
  {
    id: '2',
    name: 'Faro Hábitos',
    image: require('../../../assets/catalog/Caminito/Caminito.jpg'),
    tagline: 'EDICIÓN SEGUIMIENTO SEMANAL',
  }
];

const CatalogScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backButton}>← VOLVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MODELOS DE AUTOR</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={MODELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ModelDetail', { model: item })}
          >
            <ImageBackground source={item.image} style={styles.cardImage} resizeMode="cover">
              <View style={styles.cardOverlay}>
                <View style={styles.cardContent}>
                  <Text style={styles.modelName}>{item.name.toUpperCase()}</Text>
                  <Text style={styles.modelTagline}>{item.tagline}</Text>
                </View>
                <View style={styles.viewButton}>
                  <Text style={styles.viewText}>VER DETALLES</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 224, 255, 0.3)',
  },
  backButton: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  list: {
    padding: 20,
  },
  card: {
    height: 180,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    overflow: 'hidden',
    // Shadow glow for iOS
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 5,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardContent: {
    justifyContent: 'flex-start',
  },
  modelName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modelTagline: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#00E0FF',
    marginTop: 6,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  viewButton: {
    alignSelf: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#00E0FF',
    paddingBottom: 2,
  },
  viewText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  }
});

export default CatalogScreen;
// trigger reload
