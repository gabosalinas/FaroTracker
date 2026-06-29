import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Dimensions, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const { width } = Dimensions.get('window');

const ModelDetailScreen = ({ route, navigation }) => {
  const { model } = route.params || { model: { id: '1', name: 'Fórmula 1', image: require('../../../assets/catalog/Formula1/Formula1.jpg'), tagline: 'EDICIÓN ESPECIAL RACING' } };
  
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' or '3d'
  const [viewerHtml, setViewerHtml] = useState(null);
  const [isLoading3D, setIsLoading3D] = useState(false);
  
  // Gallery images list
  const photos = model.id === '1'
    ? [
        model.image,
        require('../../../assets/catalog/Formula1/Formula1_spread.jpg'),
        require('../../../assets/catalog/Formula1/Formula1_back_new.jpg'),
        require('../../../assets/catalog/Formula1/Formula1_detail1.jpg'),
        require('../../../assets/catalog/Formula1/Formula1_detail2.jpg'),
      ]
    : [
        model.image,
        require('../../../assets/catalog/Caminito/Caminito_photo1.png'),
        require('../../../assets/catalog/Caminito/Caminito_photo2.jpg'),
        require('../../../assets/catalog/Caminito/Caminito_photo3.jpg'),
        require('../../../assets/catalog/Caminito/Caminito_photo4.jpg'),
      ];
  
  const [selectedPhoto, setSelectedPhoto] = useState(photos[0]);
  
  useEffect(() => {
    if (activeTab === '3d') {
      async function setup3D() {
        try {
          setIsLoading3D(true);
          
          // 1. Resolve and download the GLB asset
          const [glbAsset] = await Asset.loadAsync(require('../../../assets/catalog/Formula1/Formula1.glb'));
          await glbAsset.downloadAsync();
          
          let glbLocalUri = glbAsset.localUri || glbAsset.uri;
          console.log("GLB asset resolved to:", glbLocalUri);

          if (Platform.OS === 'android' && (!glbLocalUri || !glbLocalUri.startsWith('file://'))) {
            if (glbAsset.hash) {
              const cacheUri = `${FileSystem.cacheDirectory}ExponentAsset-${glbAsset.hash}.${glbAsset.type}`;
              const exists = await FileSystem.getInfoAsync(cacheUri).then(info => info.exists).catch(() => false);
              if (exists) {
                glbLocalUri = cacheUri;
              } else if (glbAsset.uri && (glbAsset.uri.startsWith('http') || glbAsset.uri.startsWith('https'))) {
                try {
                  const downloadResult = await FileSystem.downloadAsync(glbAsset.uri, cacheUri);
                  glbLocalUri = downloadResult.uri;
                } catch (err) {
                  console.log("GLB Download failed:", err);
                }
              }
            }
          }

          if (glbLocalUri) {
            if (!glbLocalUri.startsWith('file://') && !glbLocalUri.startsWith('http://') && !glbLocalUri.startsWith('https://')) {
              if (glbLocalUri.startsWith('file:/')) {
                glbLocalUri = glbLocalUri.replace('file:/', 'file:///');
              } else {
                glbLocalUri = `file://${glbLocalUri}`;
              }
            }
          }

          if (!glbLocalUri) {
            throw new Error("No GLB file URI resolved.");
          }

          // 2. Read the asset as a Base64 string to bypass WebView CORS restrictions for local files
          const base64Data = await FileSystem.readAsStringAsync(glbLocalUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const glbDataUri = `data:application/octet-stream;base64,${base64Data}`;
          
          // 3. Define the HTML content for Google <model-viewer> using the inline Base64 data URI
          const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  background-color: #000000;
                  overflow: hidden;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                model-viewer {
                  width: 100%;
                  height: 100%;
                  background-color: #000000;
                  --poster-color: transparent;
                }
                .loader {
                  position: absolute;
                  color: #00E0FF;
                  font-family: sans-serif;
                  font-size: 14px;
                  font-weight: bold;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  pointer-events: none;
                  text-shadow: 0 0 8px rgba(0, 224, 255, 0.8);
                  z-index: 10;
                }
              </style>
              <script>
                // Forward WebView console logs to React Native
                const logToRN = (type, args) => {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: type,
                      message: args.map(arg => {
                        if (arg instanceof Error) {
                          return arg.message + '\n' + arg.stack;
                        } else if (typeof arg === 'object') {
                          try { return JSON.stringify(arg); } catch (e) { return String(arg); }
                        }
                        return String(arg);
                      }).join(' ')
                    }));
                  }
                };
                console.log = (...args) => logToRN('log', args);
                console.error = (...args) => logToRN('error', args);
                console.warn = (...args) => logToRN('warn', args);
                window.onerror = (message, source, lineno, colno, error) => {
                  logToRN('error', ['Global error:', message, 'at', source, 'line', lineno, 'col', colno, error]);
                  return false;
                };
              </script>
              <!-- Load model-viewer element -->
              <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
            </head>
            <body>
              <div id="loading" class="loader">Cargando 3D...</div>
              <model-viewer 
                id="viewer"
                src="${glbDataUri}" 
                alt="Modelo 3D del Cuaderno" 
                auto-rotate 
                camera-controls 
                shadow-intensity="1.5"
                shadow-softness="0.8"
                exposure="1.0"
                environment-image="neutral"
              >
              </model-viewer>
              <script>
                const viewer = document.getElementById('viewer');
                const loading = document.getElementById('loading');
                viewer.addEventListener('load', () => {
                  loading.style.display = 'none';
                });
              </script>
            </body>
            </html>
          `;
          
          // Set HTML content directly to state to render in WebView
          setViewerHtml(htmlContent);
          setIsLoading3D(false);
        } catch (error) {
          console.log("Error setting up 3D viewer:", error);
          setIsLoading3D(false);
        }
      }
      setup3D();
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backButton}>← VOLVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{model.name.toUpperCase()}</Text>
        <View style={{ width: 60 }} />
      </View>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>FOTOS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === '3d' && styles.activeTab]}
          disabled={model.id !== '1'}
          onPress={() => setActiveTab('3d')}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.tabText, 
            activeTab === '3d' && styles.activeTabText,
            model.id !== '1' && styles.disabledTabText
          ]}>
            VISTA 3D
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'photos' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Photo Showcase */}
          <View style={styles.mainImageContainer}>
            <Image source={selectedPhoto} style={styles.mainImage} resizeMode="contain" />
          </View>
          
          {/* Carousel Thumbnails */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailCarousel}>
            {photos.map((photo, index) => (
              <TouchableOpacity 
                key={`thumb-${index}`} 
                style={[styles.thumbnailWrapper, selectedPhoto === photo && styles.selectedThumbnail]}
                onPress={() => setSelectedPhoto(photo)}
                activeOpacity={0.8}
              >
                <Image source={photo} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Product Details info */}
          <View style={styles.detailsContainer}>
            <Text style={styles.modelName}>{model.name}</Text>
            <Text style={styles.tagline}>{model.tagline}</Text>
            
            <View style={styles.separator} />
            
            <Text style={styles.sectionTitle}>DESCRIPCIÓN</Text>
            <Text style={styles.descriptionText}>
              Diseño de autor premium inspirado en la velocidad y el diseño técnico automovilístico. 
              Fabricado con tapa y contratapa en relieve físico multicapa ("Sobre Relieve") 
              de gran definición técnica sobre base negra mate de alta densidad y durabilidad.
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>PRECIO</Text>
              <Text style={styles.priceValue}>$31.500</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.viewerContainer}>
          {isLoading3D ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00E0FF" />
              <Text style={styles.loadingText}>CARGANDO MODELO 3D...</Text>
              <Text style={styles.loadingSubtext}>
                Estamos preparando la geometría tridimensional interactiva.
              </Text>
            </View>
          ) : viewerHtml ? (
            <WebView
              originWhitelist={['*']}
              source={{ html: viewerHtml, baseUrl: 'https://raw.githubusercontent.com' }}
              style={styles.webview}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              mixedContentMode="always"
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'log') {
                    console.log('[WebView Log]', data.message);
                  } else if (data.type === 'warn') {
                    console.warn('[WebView Warn]', data.message);
                  } else if (data.type === 'error') {
                    console.error('[WebView Error]', data.message);
                  }
                } catch (e) {
                  console.log('[WebView Msg]', event.nativeEvent.data);
                }
              }}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>NO SE PUDO CARGAR EL MODELO 3D</Text>
              <Text style={styles.loadingSubtext}>
                Verifica que el archivo del modelo esté presente en la app.
              </Text>
            </View>
          )}
        </View>
      )}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00E0FF',
  },
  tabText: {
    color: '#888888',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2,
  },
  activeTabText: {
    color: '#00E0FF',
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainImageContainer: {
    width: width,
    height: 300,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailCarousel: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
  },
  thumbnailWrapper: {
    width: 70,
    height: 70,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#333333',
    marginRight: 12,
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: '#00E0FF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modelName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 11,
    color: '#00E0FF',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    fontWeight: '400',
  },
  priceContainer: {
    marginTop: 30,
    backgroundColor: 'rgba(0, 224, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00E0FF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#00E0FF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 20,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  loadingSubtext: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 59, 48, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  disabledTabText: {
    color: '#333333',
  }
});

export default ModelDetailScreen;
