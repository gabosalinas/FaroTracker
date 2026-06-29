import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Animated, Platform, StatusBar, ActivityIndicator, Alert, Image, Linking, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import ViewShot from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import useDesignStore from '../../store/useDesignStore';
import Button from '../../components/Button';
import StickerPicker, { STICKERS } from './StickerPicker';
import StickerItem from './StickerItem';
import { STICKERS_BASE64 } from './StickersBase64';
import { TERMS_AND_CONDITIONS } from './termsText';

const { width } = Dimensions.get('window');
const BOARD_WIDTH = width * 0.92;
const PADDING_X = 10;
const COLUMN_WIDTH = (BOARD_WIDTH - 2 * PADDING_X) / 7;
const ROW_HEIGHT = 45;
const HEADER_HEIGHT = 35;
const TOKEN_RADIUS = 18;

// Dimensiones de la vista previa pequeña en el resumen
const MINI_BOARD_WIDTH = 180;
const MINI_PADDING_X = 6;
const MINI_COLUMN_WIDTH = (MINI_BOARD_WIDTH - 2 * MINI_PADDING_X) / 7;
const MINI_ROW_HEIGHT = 26;
const MINI_HEADER_HEIGHT = 18;
const MINI_TOKEN_RADIUS = 9;

const WHATSAPP_NUMBER = '5491163000370'; // WhatsApp de FaroTracker
const alias = 'somosfaro3d';
const ORDER_COST_DISPLAY = '$27.800'; // Precio base
const GOOGLE_DRIVE_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbwGJSz3WcXfN4RNtvOm9G506Soh00mzZ2pwMdnx1cDecNhHKtpsSbp3kGH3Ooh4yJzYuw/exec';

const MiniToken = ({ token }) => {
  const originalId = token.iconId;
  const originalSticker = STICKERS.find(s => s.id === originalId);
  const imageSource = originalSticker ? originalSticker.image : null;
  const iconSource = originalSticker ? originalSticker.icon : null;

  // Calcular coordenadas relativas para la miniatura
  const centerX = MINI_PADDING_X + token.column * MINI_COLUMN_WIDTH + MINI_COLUMN_WIDTH / 2;
  const centerY = MINI_HEADER_HEIGHT + token.row * MINI_ROW_HEIGHT + MINI_ROW_HEIGHT / 2;
  const tx = centerX - MINI_TOKEN_RADIUS;
  const ty = centerY - MINI_TOKEN_RADIUS;

  const { boardColor, accentColor } = useDesignStore.getState();

  return (
    <View
      style={{
        position: 'absolute',
        width: MINI_TOKEN_RADIUS * 2,
        height: MINI_TOKEN_RADIUS * 2,
        borderRadius: MINI_TOKEN_RADIUS,
        borderWidth: 1,
        borderColor: accentColor,
        backgroundColor: boardColor,
        justifyContent: 'center',
        alignItems: 'center',
        left: tx,
        top: ty,
      }}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: MINI_TOKEN_RADIUS * 1.3, height: MINI_TOKEN_RADIUS * 1.3 }}
          resizeMode="contain"
        />
      ) : (
        <Text style={{ fontSize: MINI_TOKEN_RADIUS * 1.1, textAlign: 'center' }}>
          {iconSource}
        </Text>
      )}
    </View>
  );
};

const EditorScreen = ({ navigation }) => {
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [orderId, setOrderId] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState('');
  const [custom3DVisible, setCustom3DVisible] = React.useState(false);
  const [custom3DHtml, setCustom3DHtml] = React.useState(null);
  const [isGenerating3D, setIsGenerating3D] = React.useState(false);
  const [selectedStickerId, setSelectedStickerId] = React.useState(null);
  const [colorPickerVisible, setColorPickerVisible] = React.useState(false);
  const [colorPickerTitle, setColorPickerTitle] = React.useState('');
  const [colorPickerTarget, setColorPickerTarget] = React.useState('base'); // 'base', 'accent', 'text'
  const [postalCode, setPostalCode] = React.useState('');
  const [shippingCost, setShippingCost] = React.useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = React.useState(false);
  const [termsModalVisible, setTermsModalVisible] = React.useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
  const [isStoreHydrated, setIsStoreHydrated] = React.useState(false);

  const scrollViewRef = React.useRef();
  const boardViewShotRef = React.useRef();
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTimeout = React.useRef(null);
  const scrollXAnim = React.useRef(new Animated.Value(0)).current;

  const {
    boardColor,
    accentColor,
    textColor,
    rowCount,
    tokenPack,
    placedTokens,
    setBoardColor,
    setAccentColor,
    setTextColor,
    setRowCount,
    updateTokenPackQuantity,
    placeToken,
    removePlacedToken,
    resetDesign
  } = useDesignStore();

  const colors = {
    base: ['#004F7C', '#1A1A1A', '#5E3A8C', '#2E5A27', '#8C3B3B', '#D28B2B'],
    accent: ['#0A2B44', '#000000', '#2E1254', '#122D10', '#3D1515', '#573305', '#FFFFFF'],
    text: ['#8C7D70', '#FFFFFF', '#00E0FF', '#CCCCCC', '#000000']
  };

  const selectedToken = placedTokens.find(s => s.id === selectedStickerId);

  // Limpiar timer de toast y listener de scroll al desmontar
  React.useEffect(() => {
    const listenerId = scrollXAnim.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({ x: value, animated: false });
    });
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
      scrollXAnim.removeListener(listenerId);
    };
  }, []);

  React.useEffect(() => {
    const unsubHydrate = useDesignStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });

    if (useDesignStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
    }

    return () => {
      unsubHydrate();
    };
  }, []);

  const handleTermsScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptTerms = () => {
    setTermsModalVisible(false);
  };

  const formatCurrency = (value) => {
    return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const fetchShippingCostFromAPI = async (cp) => {
    if (!cp || cp.trim().length < 4) {
      setShippingCost(null);
      return;
    }

    setIsCalculatingShipping(true);
    try {
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originZipCode: '1716',
          destinationZipCode: cp,
          packageWeightGrams: 500,
          dimensions: { length: 30, width: 20, height: 2 }
        }),
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      const sentData = JSON.parse(data.data);
      const destination = sentData.destinationZipCode;
      
      const cleanCP = destination.trim().replace(/[^0-9]/g, '');
      const cpNumber = parseInt(cleanCP.substring(0, 4), 10);
      
      let calculatedCost = 5200;
      
      if (cpNumber >= 1000 && cpNumber <= 1499) {
        calculatedCost = 4800;
      } else if (cpNumber >= 1500 && cpNumber <= 1999) {
        calculatedCost = 5200;
      } else if (cpNumber >= 2000 && cpNumber <= 3999) {
        calculatedCost = 6800;
      } else if (cpNumber >= 4000 && cpNumber <= 7999) {
        calculatedCost = 7900;
      } else if (cpNumber >= 8000 && cpNumber <= 9999) {
        calculatedCost = 9400;
      }

      setShippingCost(calculatedCost);
    } catch (error) {
      console.log("Error consultando la API de envío:", error);
      const cleanCP = cp.trim().replace(/[^0-9]/g, '');
      const cpNumber = parseInt(cleanCP.substring(0, 4), 10) || 1000;
      let fallbackCost = 5200;
      if (cpNumber >= 1000 && cpNumber <= 1499) fallbackCost = 4800;
      else if (cpNumber >= 1500 && cpNumber <= 1999) fallbackCost = 5200;
      else if (cpNumber >= 2000 && cpNumber <= 3999) fallbackCost = 6800;
      else if (cpNumber >= 4000 && cpNumber <= 7999) fallbackCost = 7900;
      else if (cpNumber >= 8000 && cpNumber <= 9999) fallbackCost = 9400;
      setShippingCost(fallbackCost);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  React.useEffect(() => {
    const cleanCP = postalCode.trim().replace(/[^0-9]/g, '');
    if (cleanCP.length >= 4) {
      const delayDebounce = setTimeout(() => {
        fetchShippingCostFromAPI(cleanCP);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      setShippingCost(null);
    }
  }, [postalCode]);

  const showToast = (message) => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    setToastMessage(message);

    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage('');
      });
    }, 2000);
  };

  const handleSelectSticker = (sticker) => {
    updateTokenPackQuantity(sticker.id, 1);
    showToast("Ficha agregada al pack físico!");
  };

  const handleSpawnTokenOnGrid = (iconId) => {
    // Verificar si quedan tokens de este tipo disponibles para colocar
    const placedCount = placedTokens.filter(t => t.iconId === iconId).length;
    const packItem = tokenPack.find(t => t.iconId === iconId);
    const totalQty = packItem ? packItem.quantity : 0;

    if (placedCount >= totalQty) {
      showToast("Ya colocaste todas las fichas de este tipo disponibles.");
      return;
    }

    // Buscar primera posición libre en la cuadrícula
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < 7; c++) {
        const occupied = placedTokens.some(t => t.column === c && t.row === r);
        if (!occupied) {
          const uniqueId = `${iconId}-${Date.now()}`;
          placeToken(uniqueId, iconId, c, r);
          showToast("Colocada en el tablero");
          return;
        }
      }
    }
    showToast("¡El tablero está lleno!");
  };

  const scrollToPage = (page) => {
    Animated.spring(scrollXAnim, {
      toValue: page * width,
      friction: 6.5,
      tension: 30,
      useNativeDriver: false
    }).start();
  };

  const handleSubirPedido = () => {
    if (placedTokens.length === 0) {
      Alert.alert("Tablero Vacío", "¿Querés proceder a revisar tu tablero sin ninguna ficha colocada?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Continuar", onPress: () => scrollToPage(1) }
      ]);
    } else {
      scrollToPage(1);
    }
  };

  const handleConfirmAndGoToCheckout = () => {
    if (!postalCode || postalCode.trim() === '') {
      Alert.alert('Código Postal Requerido', 'Por favor, ingresa tu código postal antes de continuar.');
      return;
    }
    if (isCalculatingShipping) {
      Alert.alert('Calculando Envío', 'Por favor, espera a que termine de calcularse el costo de envío.');
      return;
    }
    if (shippingCost === null) {
      Alert.alert('Código Postal Inválido', 'Por favor, ingresa un código postal válido para calcular el envío.');
      return;
    }
    const timestamp = Date.now();
    const userId = 'USER_123';
    const generatedOrderId = `${timestamp}_${userId}`;
    setOrderId(generatedOrderId);
    scrollToPage(2);
  };

  const copyAliasToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(alias);
      showToast("¡Alias copiado!");
    } catch (error) {
      showToast("Error al copiar alias");
    }
  };

  const openMercadoPagoApp = async () => {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.openApplication('com.mercadopago.wallet');
        return true;
      } catch (err) {
        console.log("No se pudo abrir Mercado Pago mediante IntentLauncher en Android:", err);
      }
    }

    const schemes = ['mercadopago://', 'mpago://'];
    for (const scheme of schemes) {
      try {
        const canOpen = await Linking.canOpenURL(scheme).catch(() => false);
        if (canOpen) {
          await Linking.openURL(scheme);
          return true;
        }
      } catch (err) {
        console.log(`Error al verificar esquema ${scheme}:`, err);
      }
    }

    try {
      await Linking.openURL('https://www.mercadopago.com.ar');
      return true;
    } catch (err) {
      showToast("Error al abrir Mercado Pago");
      return false;
    }
  };

  const uploadToGoogleDriveBackground = async (boardBase64) => {
    if (!GOOGLE_DRIVE_UPLOAD_URL || GOOGLE_DRIVE_UPLOAD_URL.includes('placeholder')) {
      console.log("Subida a Google Drive omitida: URL de Apps Script no configurada.");
      return;
    }

    try {
      const payload = {
        folderName: orderId,
        frontImage: boardBase64,
        backImage: "",
        postalCode: postalCode
      };

      const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Resultado de subida a Google Drive:", result);
    } catch (error) {
      console.log("Error al subir imágenes a Google Drive en segundo plano:", error);
    }
  };

  const proceedToWhatsAppAndHome = async () => {
    const formatPackList = () => {
      if (!tokenPack || tokenPack.length === 0) return 'Ninguna';
      return tokenPack.map(t => {
        const found = STICKERS.find(item => item.id === t.iconId);
        const name = found ? found.name : t.iconId;
        return `${name} x${t.quantity}`;
      }).join(', ');
    };

    let text = `Ya realice el pago para el pedido ID ${orderId}\n`;
    text += `Código Postal: ${postalCode}\n`;
    if (shippingCost !== null) {
      text += `Envío (Correo Argentino): ${formatCurrency(shippingCost)}\n`;
      text += `Total Pagado: ${formatCurrency(27800 + shippingCost)}\n\n`;
    } else {
      text += `Total Pagado: ${ORDER_COST_DISPLAY}\n\n`;
    }
    text += `Detalles de mi tablero FaroTracker:\n`;
    text += `• TABLERO:\n`;
    text += `  - Color de Base: ${boardColor}\n`;
    text += `  - Color de Acento: ${accentColor}\n`;
    text += `  - Color de Texto de Días: ${textColor}\n`;
    text += `  - Filas: ${rowCount}\n`;
    text += `  - Set de Fichas físico: ${formatPackList()}\n`;
    text += `  - Fichas colocadas en grid: ${placedTokens.length} colocadas`;

    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
    const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

    try {
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      console.log("No se pudo abrir WhatsApp:", err);
      Alert.alert("Error", "No se pudo abrir WhatsApp. Verifica si la aplicación está instalada.");
    } finally {
      navigation.popToTop();
    }
  };

  const handlePaymentConfirmation = () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    setTimeout(async () => {
      try {
        const boardBase64 = await boardViewShotRef.current.capture({ format: 'jpg', quality: 0.9, result: 'base64' });

        // Iniciar subida en segundo plano
        uploadToGoogleDriveBackground(boardBase64);

        showToast("¡Pedido realizado!");

        setTimeout(async () => {
          await proceedToWhatsAppAndHome();
        }, 1500);

      } catch (error) {
        console.log("Error al capturar imagen del tablero:", error);
        Alert.alert("Error", "No se pudo procesar la captura de tu tablero.");
        setIsProcessingPayment(false);
      }
    }, 50);
  };

  const getAssetBase64 = async (imageModule, stickerId) => {
    try {
      const originalId = stickerId.split('-')[0];
      const originalSticker = STICKERS.find((item) => item.id === originalId);
      if (originalSticker?.fileName && STICKERS_BASE64[originalSticker.fileName]) {
        const fullBase64 = STICKERS_BASE64[originalSticker.fileName];
        return fullBase64.split(',')[1];
      }

      const [asset] = await Asset.loadAsync(imageModule);
      await asset.downloadAsync();
      
      let fileUri = asset.localUri || asset.uri;
      
      if (Platform.OS === 'android' && (!fileUri || !fileUri.startsWith('file://'))) {
        if (asset.hash) {
          const cacheUri = `${FileSystem.cacheDirectory}ExponentAsset-${asset.hash}.${asset.type}`;
          const exists = await FileSystem.getInfoAsync(cacheUri).then(info => info.exists).catch(() => false);
          if (exists) {
            fileUri = cacheUri;
          } else if (asset.uri && (asset.uri.startsWith('http') || asset.uri.startsWith('https'))) {
            try {
              const downloadResult = await FileSystem.downloadAsync(asset.uri, cacheUri);
              fileUri = downloadResult.uri;
            } catch (err) {
              console.log("Download failed:", err);
            }
          }
        }
      }
      
      if (fileUri) {
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('http://') && !fileUri.startsWith('https://')) {
          fileUri = fileUri.startsWith('file:/') ? fileUri.replace('file:/', 'file:///') : `file://${fileUri}`;
        }
      }
      
      if (!fileUri) throw new Error("No file URI");
      return await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    } catch (error) {
      console.log(`Error reading asset for token ${stickerId}:`, error);
      return null;
    }
  };

  const handleOpen3DPreview = async () => {
    if (isGenerating3D) return;
    setIsGenerating3D(true);
    
    try {
      // Resolver y codificar los tokens en base64 para inyectar en WebView
      const tokensData = await Promise.all(
        placedTokens.map(async (t) => {
          const originalId = t.iconId;
          const originalSticker = STICKERS.find((item) => item.id === originalId);
          
          let base64 = null;
          if (originalSticker?.image) {
            base64 = await getAssetBase64(originalSticker.image, t.id);
          }
          
          return {
            id: t.id,
            iconId: t.iconId,
            column: t.column,
            row: t.row,
            imageBase64: base64 ? `data:image/png;base64,${base64}` : null,
            remoteUrl: originalSticker?.fileName ? `https://raw.githubusercontent.com/gabosalinas/FaroTracker/master/assets/stickers/${encodeURIComponent(originalSticker.fileName)}` : null,
            icon: originalSticker?.icon || null
          };
        })
      );

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
          <script>
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
          </script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
        </head>
        <body>
          <div id="loading" class="loader">Generando Vista 3D...</div>
          <div id="canvas-container"></div>

          <script>
            const boardColor = "${boardColor}";
            const accentColor = "${accentColor}";
            const textColor = "${textColor}";
            const rowCount = ${rowCount};
            const placedTokens = ${JSON.stringify(tokensData)};

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
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
            dirLight.position.set(2, 4, 5);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 1024;
            dirLight.shadow.mapSize.height = 1024;
            dirLight.shadow.bias = -0.0005;
            scene.add(dirLight);

            const fridgeLight = new THREE.PointLight(0xffffff, 0.35, 10);
            fridgeLight.position.set(-2, 3, 4);
            scene.add(fridgeLight);

            // 1. Metal Fridge Door Background
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

            // 2. Dynamic Board Texture Generator (Canvas)
            function createBoardTexture(bColor, aColor, tColor, rows) {
              const canvas = document.createElement('canvas');
              canvas.width = 1024;
              canvas.height = 1024;
              const ctx = canvas.getContext('2d');
              
              // Base Color
              ctx.fillStyle = bColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Header Font
              ctx.font = 'bold 50px Courier New, sans-serif';
              ctx.fillStyle = tColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const colW = canvas.width / 7;
              const days = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
              
              for (let c = 0; c < 7; c++) {
                const x = c * colW + colW / 2;
                ctx.fillText(days[c], x, 70);
              }
              
              // Draw slot rings
              ctx.strokeStyle = aColor;
              ctx.lineWidth = 5;
              const startY = 150;
              const rowH = (canvas.height - startY - 30) / rows;
              
              for (let r = 0; r < rows; r++) {
                const y = startY + r * rowH + rowH / 2;
                for (let c = 0; c < 7; c++) {
                  const x = c * colW + colW / 2;
                  ctx.beginPath();
                  ctx.arc(x, y, 44, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
              
              const tex = new THREE.CanvasTexture(canvas);
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              return tex;
            }

            // 3. Board Mesh
            const boardW = 2.4;
            const boardH = 0.35 + rowCount * 0.45;
            const boardT = 0.03;

            const boardGeom = new THREE.BoxGeometry(boardW, boardH, boardT);
            
            const boardFrontTex = createBoardTexture(boardColor, accentColor, textColor, rowCount);
            const frontMat = new THREE.MeshStandardMaterial({
              map: boardFrontTex,
              roughness: 0.6,
              metalness: 0.1
            });
            const sideMat = new THREE.MeshStandardMaterial({
              color: parseInt(boardColor.replace('#', '0x')),
              roughness: 0.6,
              metalness: 0.1
            });

            // Materials array: Right, Left, Top, Bottom, Front, Back
            const boardMaterials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];
            
            const boardMesh = new THREE.Mesh(boardGeom, boardMaterials);
            boardMesh.castShadow = true;
            boardMesh.receiveShadow = true;
            scene.add(boardMesh);

            // 4. Generate text/emoji textures on canvas
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

            const textureLoader = new THREE.TextureLoader();
            textureLoader.setCrossOrigin('anonymous');

            // 5. Render Placed Tokens (as physical circular cylinders)
            const tokenRadius = 0.12;
            const tokenHeight = 0.018;

            placedTokens.forEach(t => {
              let iconTexture;
              
              const onLoadCallback = () => {
                if (iconTexture) iconTexture.needsUpdate = true;
              };

              if (t.imageBase64) {
                iconTexture = textureLoader.load(t.imageBase64, onLoadCallback);
              } else if (t.remoteUrl) {
                iconTexture = textureLoader.load(t.remoteUrl, onLoadCallback);
              } else if (t.icon) {
                iconTexture = createEmojiTexture(t.icon);
              }

              // Cilindro en 3D
              const tokenGeom = new THREE.CylinderGeometry(tokenRadius, tokenRadius, tokenHeight, 32);
              
              // Cara superior (Icono)
              const topMaterial = new THREE.MeshStandardMaterial({
                map: iconTexture || null,
                roughness: 0.4,
                metalness: 0.1,
                transparent: true,
                alphaTest: 0.3
              });

              // Lateral y base (Coincide con el color de base del tablero)
              const bodyMaterial = new THREE.MeshStandardMaterial({
                color: parseInt(boardColor.replace('#', '0x')),
                roughness: 0.6,
                metalness: 0.1
              });

              const tokenMaterials = [
                bodyMaterial,  // Lateral
                topMaterial,   // Superior
                bodyMaterial   // Inferior
              ];

              const tokenMesh = new THREE.Mesh(tokenGeom, tokenMaterials);
              tokenMesh.rotation.x = Math.PI / 2;
              tokenMesh.castShadow = true;
              tokenMesh.receiveShadow = true;

              // Calcular posición local del slot en 3D relative a las dimensiones del board
              const stepX = boardW / 7;
              const slotX = (t.column - 3) * stepX; // Centrado en X (-3 a +3)
              
              // Distribución en Y
              const startY = boardH / 2 - 0.12;
              const stepY = (boardH - 0.24) / rowCount;
              const slotY = startY - t.row * stepY - stepY / 2;

              tokenMesh.position.set(slotX, slotY, boardT / 2 + tokenHeight / 2 + 0.002);
              boardMesh.add(tokenMesh);
            });

            // Ocultar cargador
            document.getElementById('loading').style.display = 'none';

            window.addEventListener('resize', () => {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // Animación
            let autoRotate = true;
            container.addEventListener('pointerdown', () => { autoRotate = false; });

            function animate() {
              requestAnimationFrame(animate);
              if (autoRotate) {
                boardMesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
              }
              controls.update();
              renderer.render(scene, camera);
            }
            animate();
          </script>
        </body>
        </html>
      `;

      setCustom3DHtml(htmlContent);
      setCustom3DVisible(true);
    } catch (error) {
      console.log("Error generating 3D preview:", error);
      Alert.alert("Error", "No se pudo generar la vista 3D.");
    } finally {
      setIsGenerating3D(false);
    }
  };

  if (!isStoreHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#00E0FF" style={{ marginBottom: 15 }} />
        <Text style={{ color: '#00E0FF', fontWeight: '800', letterSpacing: 2, fontSize: 12 }}>
          CARGANDO DISEÑO...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal={true}
        pagingEnabled={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ width: width * 3 }}
      >
        {/* ==================== PAGINA 0: EDITOR ==================== */}
        <View style={{ width: width, height: '100%' }}>
          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backButton}>←</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerHeader}>
              <Text style={styles.title}>FAROTRACKER STUDIO</Text>
            </View>
            <View style={styles.rightHeader}>
              <TouchableOpacity onPress={handleSubirPedido}>
                <Text style={styles.reviewButton}>SUBIR PEDIDO</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.main}>
            {/* Tablero organizador semanal 2D */}
            <ViewShot ref={boardViewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }}>
              <View style={[styles.trackerBoard, { backgroundColor: boardColor, borderColor: accentColor }]}>
                {/* Cabecera de días */}
                <View style={styles.boardHeaderRow}>
                  {['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'].map((day, idx) => (
                    <View key={idx} style={styles.boardHeaderCell}>
                      <Text style={[styles.boardHeaderText, { color: textColor }]}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Slots Circulares */}
                <View style={styles.boardSlotsContainer}>
                  {Array.from({ length: rowCount }).map((_, rIdx) => (
                    <View key={rIdx} style={styles.boardRow}>
                      {Array.from({ length: 7 }).map((_, cIdx) => (
                        <View
                          key={cIdx}
                          style={[styles.boardSlotCircle, { borderColor: accentColor }]}
                        />
                      ))}
                    </View>
                  ))}
                </View>

                {/* Fichas colocadas */}
                {placedTokens.map(token => (
                  <StickerItem
                    key={token.id}
                    sticker={token}
                    isSelected={selectedStickerId === token.id}
                    onSelect={() => setSelectedStickerId(token.id)}
                  />
                ))}
              </View>
            </ViewShot>

            <View style={styles.controls}>
              {/* Controles de Filas (+ y -) */}
              <View style={styles.rowControls}>
                <Text style={styles.rowControlsLabel}>FILAS: {rowCount}</Text>
                <View style={styles.rowButtonsRow}>
                  <TouchableOpacity
                    style={styles.rowBtn}
                    onPress={() => setRowCount(rowCount - 1)}
                    disabled={rowCount <= 1}
                  >
                    <Text style={styles.rowBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rowBtn}
                    onPress={() => setRowCount(rowCount + 1)}
                    disabled={rowCount >= 6}
                  >
                    <Text style={styles.rowBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Controles Cromáticos */}
              <View style={styles.quickSelectorsRow}>
                <TouchableOpacity
                  style={styles.quickSelectorItem}
                  onPress={() => {
                    setColorPickerTitle('COLOR DE TABLERO (BASE)');
                    setColorPickerTarget('base');
                    setColorPickerVisible(true);
                  }}
                >
                  <Text style={styles.quickSelectorLabel}>BASE</Text>
                  <View style={[styles.quickColorCircle, { backgroundColor: boardColor }]} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickSelectorItem}
                  onPress={() => {
                    setColorPickerTitle('COLOR DE RANURAS (ACENTO)');
                    setColorPickerTarget('accent');
                    setColorPickerVisible(true);
                  }}
                >
                  <Text style={styles.quickSelectorLabel}>ACENTO</Text>
                  <View style={[styles.quickColorCircle, { backgroundColor: accentColor }]} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickSelectorItem}
                  onPress={() => {
                    setColorPickerTitle('COLOR DE TEXTO');
                    setColorPickerTarget('text');
                    setColorPickerVisible(true);
                  }}
                >
                  <Text style={styles.quickSelectorLabel}>TEXTO</Text>
                  <View style={[styles.quickColorCircle, { backgroundColor: textColor }]} />
                </TouchableOpacity>
              </View>

              {/* Ficha seleccionada: Acción borrar del tablero */}
              {selectedToken && (
                <View style={styles.stickerControlPanel}>
                  <Text style={styles.stickerControlTitle}>FICHA COLOCADA SELECCIONADA</Text>
                  <View style={styles.stickerActionRow}>
                    <TouchableOpacity
                      style={[styles.stickerActionBtn, styles.deleteStickerBtn, { flex: 1 }]}
                      onPress={() => {
                        removePlacedToken(selectedToken.id);
                        setSelectedStickerId(null);
                        showToast("Ficha quitada del tablero");
                      }}
                    >
                      <Text style={[styles.stickerActionText, styles.deleteStickerText]}>🗑️ QUITAR DEL TABLERO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Botón Acción Principal: Abrir Galería o ver 3D */}
              <View style={styles.mainActionsRow}>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => setPickerVisible(true)}
                >
                  <Text style={styles.actionBtnIcon}>+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionTextBtn}
                  onPress={handleOpen3DPreview}
                >
                  <Text style={styles.actionBtnText}>
                    {isGenerating3D ? 'CARGANDO...' : 'VER EN 3D'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={resetDesign}
                >
                  <Text style={[styles.actionBtnIcon, { fontSize: 20, color: '#FF3B30' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Listado de Fichas en tu Pack (Inventario) */}
            <View style={styles.packInventoryContainer}>
              <Text style={styles.packInventoryTitle}>FICHAS EN TU PACK FÍSICO ({tokenPack.reduce((acc, t) => acc + t.quantity, 0)}):</Text>
              {tokenPack.length === 0 ? (
                <View style={styles.emptyPackPlaceholder}>
                  <Text style={styles.emptyPackText}>El set de fichas está vacío. Toca "+" para agregar.</Text>
                </View>
              ) : (
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.packScroll}>
                  {tokenPack.map(item => {
                    const found = STICKERS.find(s => s.id === item.iconId);
                    const imageSource = found ? found.image : null;
                    const iconSource = found ? found.icon : null;
                    const placedCount = placedTokens.filter(t => t.iconId === item.iconId).length;

                    return (
                      <View key={item.iconId} style={styles.inventoryItemCard}>
                        <TouchableOpacity
                          style={styles.inventorySpawnButton}
                          onPress={() => handleSpawnTokenOnGrid(item.iconId)}
                        >
                          <View style={[styles.inventoryCircleIcon, { backgroundColor: boardColor, borderColor: accentColor }]}>
                            {imageSource ? (
                              <Image source={imageSource} style={styles.inventoryImage} resizeMode="contain" />
                            ) : (
                              <Text style={styles.inventoryText}>{iconSource}</Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        <Text style={styles.inventoryPlacedQty}>{placedCount} / {item.quantity}</Text>

                        <View style={styles.inventoryQuantityControls}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateTokenPackQuantity(item.iconId, -1)}
                          >
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateTokenPackQuantity(item.iconId, 1)}
                          >
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </View>

        {/* ==================== PAGINA 1: PREPARACIÓN ==================== */}
        <View style={{ width: width, height: '100%', backgroundColor: '#000000' }}>
          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <TouchableOpacity onPress={() => scrollToPage(0)}>
                <Text style={styles.backButton}>← TABLERO</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerHeader}>
              <Text style={styles.title}>PREPARACIÓN</Text>
            </View>
            <View style={styles.rightHeader}>
              <View style={{ width: 60 }} />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Vista Previa del Tablero */}
            <View style={styles.previewContainer}>
              <View style={styles.previewRow}>
                <View style={[styles.miniBoard, { backgroundColor: boardColor, borderColor: accentColor, height: MINI_HEADER_HEIGHT + rowCount * MINI_ROW_HEIGHT + 10 }]}>
                  {/* Min header */}
                  <View style={{ flexDirection: 'row', height: MINI_HEADER_HEIGHT, alignItems: 'center' }}>
                    {['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'].map((day, idx) => (
                      <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: textColor }}>{day}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Mini slots */}
                  {Array.from({ length: rowCount }).map((_, rIdx) => (
                    <View key={rIdx} style={{ flexDirection: 'row', height: MINI_ROW_HEIGHT, alignItems: 'center' }}>
                      {Array.from({ length: 7 }).map((_, cIdx) => (
                        <View
                          key={cIdx}
                          style={{
                            flex: 1,
                            height: MINI_TOKEN_RADIUS * 2,
                            maxHeight: MINI_TOKEN_RADIUS * 2,
                            margin: 1,
                            borderRadius: MINI_TOKEN_RADIUS,
                            borderWidth: 0.8,
                            borderStyle: 'dashed',
                            borderColor: accentColor,
                            alignSelf: 'center',
                          }}
                        />
                      ))}
                    </View>
                  ))}
                  {/* Mini tokens */}
                  {placedTokens.map(token => (
                    <MiniToken key={token.id} token={token} />
                  ))}
                </View>
              </View>
              <Text style={styles.previewLabel}>TABLERO ORGANIZADOR DE HELADERA</Text>
            </View>

            {/* Código Postal */}
            <View style={styles.postalCodeContainer}>
              <Text style={styles.postalCodeLabel}>CÓDIGO POSTAL</Text>
              <TextInput
                style={styles.postalCodeInput}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Ej: C1024CWN o 1425"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="default"
                autoCapitalize="characters"
              />
            </View>

            {/* Resumen del pedido */}
            <View style={styles.costSummaryContainer}>
              <Text style={styles.costSummaryTitle}>RESUMEN DEL TRACKER</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Base del Tablero ({rowCount} filas):</Text>
                <Text style={styles.costValue}>{ORDER_COST_DISPLAY}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Total de Fichas Magnéticas:</Text>
                <Text style={styles.costValue}>x{tokenPack.reduce((acc, t) => acc + t.quantity, 0)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Envío (Correo Argentino):</Text>
                {isCalculatingShipping ? (
                  <ActivityIndicator size="small" color="#00E0FF" style={{ marginLeft: 10 }} />
                ) : (
                  <Text style={styles.costValue}>
                    {shippingCost !== null ? formatCurrency(shippingCost) : 'Ingresa CP'}
                  </Text>
                )}
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL:</Text>
                <Text style={styles.totalValue}>
                  {shippingCost !== null ? formatCurrency(27800 + shippingCost) : ORDER_COST_DISPLAY}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Confirmar y Comprar"
              onPress={handleConfirmAndGoToCheckout}
            />
          </View>
        </View>

        {/* ==================== PAGINA 2: METODO DE PAGO ==================== */}
        <View style={{ width: width, height: '100%', backgroundColor: '#000000' }}>
          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <TouchableOpacity onPress={() => scrollToPage(1)}>
                <Text style={styles.closeButton}>VOLVER</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerHeader}>
              <Text style={styles.title}>MÉTODO DE PAGO</Text>
            </View>
            <View style={styles.rightHeader}>
              <View style={{ width: 40 }} />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>ID DEL PEDIDO</Text>
              <Text selectable={true} style={[styles.cardValue, styles.orderIdText]}>
                {orderId || 'Generando ID...'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>MONTO A PAGAR</Text>
              <Text style={[styles.cardValue, { marginBottom: 0 }]}>
                {shippingCost !== null ? formatCurrency(27800 + shippingCost) : ORDER_COST_DISPLAY}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>ALIAS DE TRANSFERENCIA</Text>
              <Text style={[styles.cardValue, { marginBottom: 8 }]}>{alias}</Text>
              <Text style={styles.holderText}>Titular: Gabriel Faro</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={copyAliasToClipboard}>
                  <Text style={styles.copyButtonText}>COPIAR ALIAS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.mpButton]} onPress={openMercadoPagoApp}>
                  <Text style={styles.mpButtonText}>ABRIR MP</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, isProcessingPayment && { opacity: 0.7, backgroundColor: '#555555' }]}
              onPress={handlePaymentConfirmation}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>YA REALICÉ EL PAGO</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      <StickerPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectSticker}
      />

      {toastMessage ? (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      {/* 3D Preview Modal */}
      <Modal
        visible={custom3DVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCustom3DVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <TouchableOpacity onPress={() => setCustom3DVisible(false)}>
                <Text style={styles.backButton}>← VOLVER</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerHeader}>
              <Text style={styles.title}>VISTA 3D EN HELADERA</Text>
            </View>
            <View style={{ flex: 1 }} />
          </View>
          
          <View style={{ flex: 1 }}>
            {custom3DHtml ? (
              <WebView
                originWhitelist={['*']}
                source={{ html: custom3DHtml, baseUrl: 'https://raw.githubusercontent.com' }}
                style={{ flex: 1, backgroundColor: '#000000' }}
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
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={colorPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setColorPickerVisible(false)}
        >
          <View style={styles.colorModalContent}>
            <Text style={styles.colorModalTitle}>{colorPickerTitle}</Text>
            <View style={styles.colorPaletteGrid}>
              {(colorPickerTarget === 'base' ? colors.base : colorPickerTarget === 'accent' ? colors.accent : colors.text).map((color) => {
                const isSelected = (colorPickerTarget === 'base' ? boardColor : colorPickerTarget === 'accent' ? accentColor : textColor) === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorPaletteCircle,
                      { backgroundColor: color },
                      isSelected && styles.selectedColorPaletteCircle
                    ]}
                    onPress={() => {
                      if (colorPickerTarget === 'base') {
                        setBoardColor(color);
                      } else if (colorPickerTarget === 'accent') {
                        setAccentColor(color);
                      } else {
                        setTextColor(color);
                      }
                      setColorPickerVisible(false);
                    }}
                  />
                );
              })}
            </View>
            <TouchableOpacity style={styles.closeColorModalBtn} onPress={() => setColorPickerVisible(false)}>
              <Text style={styles.closeColorModalBtnText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Términos y Condiciones */}
      <Modal
        visible={termsModalVisible}
        transparent={false}
        animationType="fade"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000', padding: 20 }}>
          <View style={styles.termsHeader}>
            <Text style={styles.termsTitle}>TÉRMINOS Y CONDICIONES</Text>
          </View>
          
          <ScrollView
            style={styles.termsScroll}
            contentContainerStyle={styles.termsScrollContent}
            onScroll={handleTermsScroll}
            scrollEventThrottle={16}
          >
            <Text style={styles.termsSubtitle}>Por favor, lee y acepta los términos antes de continuar</Text>
            
            {TERMS_AND_CONDITIONS.map((section, index) => (
              <React.Fragment key={index}>
                <Text style={styles.termsSectionTitle}>{section.title}</Text>
                <Text style={styles.termsText}>{section.content}</Text>
              </React.Fragment>
            ))}

            <Text style={styles.termsScrollEndMarker}>--- FIN DE LOS TÉRMINOS Y CONDICIONES ---</Text>
          </ScrollView>

          <View style={styles.termsFooter}>
            {!hasScrolledToBottom && (
              <Text style={styles.scrollAlertText}>* Debes desplazarte hasta el final del texto para poder aceptar.</Text>
            )}
            <TouchableOpacity
              style={[styles.termsAcceptButton, !hasScrolledToBottom && styles.termsDisabledButton]}
              disabled={!hasScrolledToBottom}
              onPress={handleAcceptTerms}
            >
              <Text style={styles.termsAcceptButtonText}>ACEPTAR Y CONTINUAR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.termsDeclineButton}
              onPress={() => {
                setTermsModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.termsDeclineButtonText}>DECLINAR Y VOLVER</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 224, 255, 0.15)',
  },
  backButton: {
    color: '#00E0FF',
    fontSize: 16,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  reviewButton: {
    color: '#00E0FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  main: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackerBoard: {
    width: BOARD_WIDTH,
    borderRadius: 16,
    borderWidth: 2.5,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  boardHeaderRow: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    alignItems: 'center',
  },
  boardHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  boardSlotsContainer: {
    marginTop: 5,
  },
  boardRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    alignItems: 'center',
  },
  boardSlotCircle: {
    flex: 1,
    height: TOKEN_RADIUS * 2,
    maxHeight: TOKEN_RADIUS * 2,
    margin: 2,
    borderRadius: TOKEN_RADIUS,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignSelf: 'center',
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 22, 28, 0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.15)',
    width: '100%',
  },
  rowControlsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  rowButtonsRow: {
    flexDirection: 'row',
  },
  rowBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rowBtnText: {
    color: '#00E0FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    width: '100%',
    marginTop: 10,
  },
  packInventoryContainer: {
    width: '100%',
    backgroundColor: '#111216',
    borderWidth: 1,
    borderColor: '#222530',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  packInventoryTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8C7D70',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  emptyPackPlaceholder: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyPackText: {
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
  },
  packScroll: {
    flexDirection: 'row',
  },
  inventoryItemCard: {
    width: 75,
    backgroundColor: '#1C1E24',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2C2F3A',
  },
  inventorySpawnButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryCircleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryImage: {
    width: 20,
    height: 20,
  },
  inventoryText: {
    fontSize: 18,
  },
  inventoryPlacedQty: {
    fontSize: 10,
    color: '#00E0FF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  inventoryQuantityControls: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'space-between',
    width: '100%',
  },
  qtyBtn: {
    flex: 0.45,
    height: 20,
    backgroundColor: '#262933',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  miniBoard: {
    width: MINI_BOARD_WIDTH,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 5,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Reused old styles for compatibility
  scrollContent: {
    padding: 15,
  },
  content: {
    padding: 15,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(20, 22, 28, 0.4)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#222530',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewLabel: {
    color: '#8C7D70',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 5,
  },
  postalCodeContainer: {
    backgroundColor: '#14161C',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222530',
  },
  postalCodeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#00E0FF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  postalCodeInput: {
    height: 45,
    backgroundColor: '#090A0D',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    borderWidth: 1.5,
    borderColor: '#222530',
  },
  costSummaryContainer: {
    backgroundColor: '#14161C',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.15)',
  },
  costSummaryTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222530',
    paddingBottom: 6,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  costLabel: {
    color: '#888888',
    fontSize: 12,
  },
  costValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 224, 255, 0.2)',
    paddingTop: 10,
  },
  totalLabel: {
    color: '#00E0FF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: '#00E0FF',
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#222530',
    backgroundColor: '#000000',
  },
  card: {
    backgroundColor: '#14161C',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222530',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8C7D70',
    letterSpacing: 2,
    marginBottom: 6,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 13,
    color: '#00E0FF',
    letterSpacing: 0.5,
  },
  holderText: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mpButton: {
    backgroundColor: '#009EE3',
  },
  mpButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  confirmButton: {
    backgroundColor: '#00E0FF',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '900',
    letterSpacing: 2,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#111216',
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1000,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  glowLayer: {
    position: 'absolute',
    backgroundColor: '#00E0FF',
  },
  stickerControlPanel: {
    backgroundColor: 'rgba(20, 22, 28, 0.75)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  stickerControlTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  stickerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  stickerActionBtn: {
    flex: 0.31,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deleteStickerBtn: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  deleteStickerText: {
    color: '#FF3B30',
  },
  quickSelectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 22, 28, 0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.15)',
  },
  quickSelectorItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickSelectorLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E0FF',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  quickColorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mainActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  actionCircleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(20, 22, 28, 0.8)',
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  actionTextBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#00E0FF',
    textAlign: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  colorModalContent: {
    width: '85%',
    backgroundColor: '#14161C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  colorModalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 24,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  colorPaletteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedColorPaletteCircle: {
    borderColor: '#00E0FF',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  closeColorModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  closeColorModalBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  termsHeader: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 224, 255, 0.2)',
    marginBottom: 15,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00E0FF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  termsScroll: {
    flex: 1,
    backgroundColor: '#0F1015',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  termsScrollContent: {
    paddingBottom: 30,
  },
  termsSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  termsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E0FF',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 18,
    textAlign: 'justify',
  },
  termsScrollEndMarker: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 10,
    letterSpacing: 2,
  },
  termsFooter: {
    paddingTop: 15,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 224, 255, 0.1)',
    marginTop: 15,
    alignItems: 'center',
    width: '100%',
  },
  scrollAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFCC00',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  termsAcceptButton: {
    backgroundColor: '#00E0FF',
    borderRadius: 4,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 3,
  },
  termsDisabledButton: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
    elevation: 0,
  },
  termsAcceptButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1.5,
  },
  termsDeclineButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsDeclineButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B30',
    letterSpacing: 1.5,
  },
  // Custom styles for FaroTracker
  canvasWrapper: {
    width: BOARD_WIDTH,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowButtonsRow: {
    flexDirection: 'row',
  },
  miniNotebook: {
    width: MINI_BOARD_WIDTH,
    borderRadius: 8,
    padding: MINI_PADDING_X,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCanvas: {
    width: MINI_CANVAS_WIDTH,
    height: MINI_CANVAS_WIDTH * 1.3,
  },
});

export default EditorScreen;
