import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Dimensions, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { STICKERS } from '../editor/StickerPicker';

const { width } = Dimensions.get('window');

const ModelDetailScreen = ({ route, navigation }) => {
  const { model } = route.params || { model: { id: '1', name: 'Rutina Kids', image: require('../../../assets/catalog/Formula1/Formula1.jpg'), tagline: 'EDICIÓN ORGANIZADOR DIARIO' } };
  
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' or '3d'
  const [viewerHtml, setViewerHtml] = useState(null);
  const [isLoading3D, setIsLoading3D] = useState(false);

  // Colores y fichas pre-configuradas para cada modelo del catálogo
  const boardPresets = model.id === '1' 
    ? {
        boardColor: '#004F7C',
        accentColor: '#0A2B44',
        textColor: '#FFFFFF',
        rowCount: 4,
        tokens: [
          { id: '1', iconId: 's2', column: 0, row: 0, icon: '🐰' },
          { id: '2', iconId: 's5', column: 1, row: 1, icon: '🐼' },
          { id: '3', iconId: 's12', column: 2, row: 2, icon: '4' },
          { id: '4', iconId: 's43', column: 4, row: 0, icon: '.' }
        ],
        description: 'El tablero de rutina ideal para los más pequeños. Ayuda a organizar sus tareas diarias mediante divertidos iconos imantados de forma visual e intuitiva.'
      }
    : {
        boardColor: '#5E3A8C',
        accentColor: '#2E1254',
        textColor: '#FFFFFF',
        rowCount: 5,
        tokens: [
          { id: '1', iconId: 's25', column: 0, row: 0, icon: 'E' },
          { id: '2', iconId: 's43', column: 2, row: 2, icon: '.' },
          { id: '3', iconId: 's26', column: 4, row: 1, icon: '!' }
        ],
        description: 'Diseño elegante para el seguimiento de metas semanales, meditación, deportes o toma de agua. Organiza tus rutinas con el mejor contraste de sombras físicas.'
      };
  
  // Galería de imágenes (reutilizando las existentes)
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
      setIsLoading3D(true);
      
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
            #canvas-container {
              width: 100%;
              height: 100%;
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
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
        </head>
        <body>
          <div id="loading" class="loader">Cargando 3D...</div>
          <div id="canvas-container"></div>

          <script>
            const boardColor = "${boardPresets.boardColor}";
            const accentColor = "${boardPresets.accentColor}";
            const textColor = "${boardPresets.textColor}";
            const rowCount = ${boardPresets.rowCount};
            const tokens = ${JSON.stringify(boardPresets.tokens)};

            // Setup scene
            const container = document.getElementById('canvas-container');
            const scene = new THREE.Scene();

            // Camera
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 0, 3.5);

            // Renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            // Controls
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 + 0.1;
            controls.minDistance = 1.5;
            controls.maxDistance = 6;

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
            dirLight.position.set(2, 4, 5);
            dirLight.castShadow = true;
            dirLight.shadow.bias = -0.0005;
            scene.add(dirLight);

            // Stainless Steel Fridge
            const fridgeGeom = new THREE.PlaneGeometry(25, 25);
            const fridgeMat = new THREE.MeshStandardMaterial({
              color: 0xd0d4d9,
              roughness: 0.28,
              metalness: 0.85
            });
            const fridgeMesh = new THREE.Mesh(fridgeGeom, fridgeMat);
            fridgeMesh.position.z = -0.15;
            fridgeMesh.receiveShadow = true;
            scene.add(fridgeMesh);

            // Canvas texture for days/slots
            function createBoardTexture(bColor, aColor, tColor, rows) {
              const canvas = document.createElement('canvas');
              canvas.width = 1024;
              canvas.height = 1024;
              const ctx = canvas.getContext('2d');
              
              ctx.fillStyle = bColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.font = 'bold 50px sans-serif';
              ctx.fillStyle = tColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const colW = canvas.width / 7;
              const days = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
              for (let c = 0; c < 7; c++) {
                ctx.fillText(days[c], c * colW + colW / 2, 70);
              }
              
              ctx.strokeStyle = aColor;
              ctx.lineWidth = 5;
              const startY = 150;
              const rowH = (canvas.height - startY - 30) / rows;
              
              for (let r = 0; r < rows; r++) {
                const y = startY + r * rowH + rowH / 2;
                for (let c = 0; c < 7; c++) {
                  ctx.beginPath();
                  ctx.arc(c * colW + colW / 2, y, 44, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
              return new THREE.CanvasTexture(canvas);
            }

            const boardW = 2.4;
            const boardH = 0.35 + rowCount * 0.45;
            const boardT = 0.03;

            const boardGeom = new THREE.BoxGeometry(boardW, boardH, boardT);
            const boardFrontTex = createBoardTexture(boardColor, accentColor, textColor, rowCount);
            
            const frontMat = new THREE.MeshStandardMaterial({ map: boardFrontTex, roughness: 0.6 });
            const sideMat = new THREE.MeshStandardMaterial({ color: parseInt(boardColor.replace('#', '0x')), roughness: 0.6 });
            const boardMaterials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];

            const boardMesh = new THREE.Mesh(boardGeom, boardMaterials);
            boardMesh.castShadow = true;
            boardMesh.receiveShadow = true;
            scene.add(boardMesh);

            // Emojis mapping
            function createEmojiTexture(emoji) {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              ctx.font = '150px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(emoji, 128, 128);
              return new THREE.CanvasTexture(canvas);
            }

            // Render preset tokens
            tokens.forEach(t => {
              const tokenGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.018, 32);
              const topMat = new THREE.MeshStandardMaterial({
                map: createEmojiTexture(t.icon),
                roughness: 0.4,
                transparent: true,
                alphaTest: 0.3
              });
              const bodyMat = new THREE.MeshStandardMaterial({
                color: parseInt(boardColor.replace('#', '0x')),
                roughness: 0.6
              });

              const tokenMesh = new THREE.Mesh(tokenGeom, [bodyMat, topMat, bodyMat]);
              tokenMesh.rotation.x = Math.PI / 2;
              tokenMesh.castShadow = true;
              tokenMesh.receiveShadow = true;

              const stepX = boardW / 7;
              const slotX = (t.column - 3) * stepX;
              const startY = boardH / 2 - 0.12;
              const stepY = (boardH - 0.24) / rowCount;
              const slotY = startY - t.row * stepY - stepY / 2;

              tokenMesh.position.set(slotX, slotY, boardT / 2 + 0.01);
              boardMesh.add(tokenMesh);
            });

            document.getElementById('loading').style.display = 'none';

            window.addEventListener('resize', () => {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            });

            function animate() {
              requestAnimationFrame(animate);
              boardMesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
              controls.update();
              renderer.render(scene, camera);
            }
            animate();
          </script>
        </body>
        </html>
      `;
      setViewerHtml(htmlContent);
      setIsLoading3D(false);
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
          onPress={() => setActiveTab('3d')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === '3d' && styles.activeTabText]}>
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
              {boardPresets.description} Fabricado bajo los más altos estándares técnicos, con colores de base y acento fijos y un set completo de fichas con imanes de neodimio de alta potencia.
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>PRECIO</Text>
              <Text style={styles.priceValue}>$27.800</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.viewerContainer}>
          {isLoading3D ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00E0FF" />
              <Text style={styles.loadingText}>CARGANDO MODELO 3D...</Text>
            </View>
          ) : viewerHtml ? (
            <WebView
              originWhitelist={['*']}
              source={{ html: viewerHtml }}
              style={styles.webview}
              domStorageEnabled={true}
              javaScriptEnabled={true}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>NO SE PUDO CARGAR LA VISTA 3D</Text>
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
  },
  loadingText: {
    color: '#00E0FF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  }
});

export default ModelDetailScreen;
