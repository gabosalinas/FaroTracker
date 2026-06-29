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
const CANVAS_SIZE = width * 0.8;
const CANVAS_WIDTH = CANVAS_SIZE - 20;

const MINI_NOTEBOOK_WIDTH = 110;
const MINI_NOTEBOOK_HEIGHT = 150;
const MINI_PADDING = 10;
const MINI_CANVAS_WIDTH = MINI_NOTEBOOK_WIDTH - (MINI_PADDING * 2);
const scaleFactor = MINI_CANVAS_WIDTH / CANVAS_WIDTH;

const WHATSAPP_NUMBER = '5491163000370'; // WhatsApp de Faro3D
const alias = 'somosfaro3d';
const ORDER_COST_DISPLAY = '$31.500';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbwGJSz3WcXfN4RNtvOm9G506Soh00mzZ2pwMdnx1cDecNhHKtpsSbp3kGH3Ooh4yJzYuw/exec';

const MiniSticker = ({ sticker }) => {
  const originalId = sticker.id.split('-')[0];
  const originalSticker = STICKERS.find(s => s.id === originalId);
  const imageSource = originalSticker ? originalSticker.image : null;
  const iconSource = originalSticker ? originalSticker.icon : null;

  const widthHeight = 100 * scaleFactor;
  const tx = sticker.x * scaleFactor;
  const ty = sticker.y * scaleFactor;
  const rotation = sticker.rotation || 0;
  const scale = sticker.scale || 1;

  return (
    <View
      style={{
        position: 'absolute',
        width: widthHeight,
        height: widthHeight,
        justifyContent: 'center',
        alignItems: 'center',
        left: 0,
        top: 0,
        transform: [
          { translateX: tx },
          { translateY: ty },
          { scale: scale },
          { rotate: `${rotation}deg` }
        ]
      }}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: 80 * scaleFactor, height: 80 * scaleFactor }}
          resizeMode="contain"
        />
      ) : (
        <Text style={{ fontSize: 60 * scaleFactor, textAlign: 'center' }}>
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
  const [colorPickerTarget, setColorPickerTarget] = React.useState('base');
  const [postalCode, setPostalCode] = React.useState('');
  const [shippingCost, setShippingCost] = React.useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = React.useState(false);
  const [termsModalVisible, setTermsModalVisible] = React.useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
  const [isStoreHydrated, setIsStoreHydrated] = React.useState(false);

  const scrollViewRef = React.useRef();
  const frontViewShotRef = React.useRef();
  const backViewShotRef = React.useRef();

  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTimeout = React.useRef(null);
  const scrollXAnim = React.useRef(new Animated.Value(0)).current;

  const {
    frontBaseColor,
    frontCanvasColor,
    backBaseColor,
    backCanvasColor,
    setBaseColor,
    setCanvasColor,
    currentSide,
    setCurrentSide,
    frontStickers,
    backStickers,
    addSticker,
    updateSticker,
    removeSticker,
    resetDesign
  } = useDesignStore();

  const stickers = currentSide === 'front' ? frontStickers : backStickers;
  const baseColor = currentSide === 'front' ? frontBaseColor : backBaseColor;
  const canvasColor = currentSide === 'front' ? frontCanvasColor : backCanvasColor;
  const colors = ['#1A1A1A', '#FFFFFF', '#E5E5E5', '#FF3B30', '#4CD964', '#007AFF', '#FFCC00'];

  const selectedSticker = stickers.find(s => s.id === selectedStickerId);

  const flipAnim = React.useRef(new Animated.Value(0)).current;

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
          dimensions: { length: 21, width: 15, height: 2 }
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

  const handleToggleSide = () => {
    Animated.timing(flipAnim, {
      toValue: 90,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentSide(currentSide === 'front' ? 'back' : 'front');
      flipAnim.setValue(-90);
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  };

  const flipStr = flipAnim.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg']
  });

  const handleSelectSticker = (sticker) => {
    const newStickerId = `${sticker.id}-${Date.now()}`;
    addSticker({
      ...sticker,
      id: newStickerId, // ID único
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      heightLevel: 3 // Default height level
    });
    setSelectedStickerId(newStickerId);
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
    scrollToPage(1);
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

    for (const scheme of schemes) {
      try {
        await Linking.openURL(scheme);
        return true;
      } catch (err) {
        console.log(`No se pudo abrir el esquema ${scheme} directamente:`, err);
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

  const uploadToGoogleDriveBackground = async (frontBase64, backBase64) => {
    if (!GOOGLE_DRIVE_UPLOAD_URL || GOOGLE_DRIVE_UPLOAD_URL.includes('placeholder')) {
      console.log("Subida a Google Drive omitida: URL de Apps Script no configurada.");
      return;
    }

    try {
      const payload = {
        folderName: orderId,
        frontImage: frontBase64,
        backImage: backBase64,
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
    const formatStickersList = (stickers) => {
      if (!stickers || stickers.length === 0) return 'Ninguno';
      const counts = {};
      stickers.forEach(s => {
        const baseId = s.id.split('-')[0];
        const found = STICKERS.find(item => item.id === baseId);
        const name = found ? found.name : baseId;
        counts[name] = (counts[name] || 0) + 1;
      });
      const formatted = Object.entries(counts).map(([name, count]) => {
        return count > 1 ? `${name} x ${count}` : name;
      });
      return formatted.join(', ');
    };

    let text = `Ya realice el pago para el pedido ID ${orderId}\n`;
    text += `Código Postal: ${postalCode}\n`;
    if (shippingCost !== null) {
      text += `Envío (Correo Argentino): ${formatCurrency(shippingCost)}\n`;
      text += `Total Pagado: ${formatCurrency(31500 + shippingCost)}\n\n`;
    } else {
      text += `Total Pagado: ${ORDER_COST_DISPLAY}\n\n`;
    }
    text += `Detalles de mi diseño Faro3D:\n`;
    text += `• TAPA:\n`;
    text += `  - Color de Marco: ${frontBaseColor || 'Default'}\n`;
    text += `  - Color de Fondo: ${frontCanvasColor || 'Default'}\n`;
    text += `  - Stickers: ${formatStickersList(frontStickers)}\n\n`;
    text += `• CONTRATAPA:\n`;
    text += `  - Color de Marco: ${backBaseColor || 'Default'}\n`;
    text += `  - Color de Fondo: ${backCanvasColor || 'Default'}\n`;
    text += `  - Stickers: ${formatStickersList(backStickers)}`;

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

    // Pequeño timeout para permitir que el loading spinner se renderice en el botón
    setTimeout(async () => {
      try {
        const frontBase64 = await frontViewShotRef.current.capture({ format: 'jpg', quality: 0.9, result: 'base64' });
        const backBase64 = await backViewShotRef.current.capture({ format: 'jpg', quality: 0.9, result: 'base64' });

        // Iniciar subida en segundo plano
        uploadToGoogleDriveBackground(frontBase64, backBase64);

        // Mostrar el tooltip flotante desvanecible
        showToast("¡Pedido realizado!");

        // Esperar 1.5s antes de abrir WhatsApp y volver al Hub
        setTimeout(async () => {
          await proceedToWhatsAppAndHome();
        }, 1500);

      } catch (error) {
        console.log("Error al capturar imágenes en checkout:", error);
        Alert.alert("Error", "No se pudo procesar el diseño.");
        setIsProcessingPayment(false);
      }
    }, 50);
  };

  const getAssetBase64 = async (imageModule, stickerId) => {
    try {
      // 1. Try to find the pre-generated base64 mapping first (100% offline & foolproof)
      const originalId = stickerId.split('-')[0];
      const originalSticker = STICKERS.find((item) => item.id === originalId);
      if (originalSticker?.fileName && STICKERS_BASE64[originalSticker.fileName]) {
        const fullBase64 = STICKERS_BASE64[originalSticker.fileName];
        return fullBase64.split(',')[1];
      }

      // 2. Fallback to reading the file from the device filesystem if not pre-generated
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
              console.log("Download failed, trying direct uri:", err);
            }
          }
        }
      }
      
      if (fileUri) {
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('http://') && !fileUri.startsWith('https://')) {
          if (fileUri.startsWith('file:/')) {
            fileUri = fileUri.replace('file:/', 'file:///');
          } else {
            fileUri = `file://${fileUri}`;
          }
        }
      }
      
      if (!fileUri) {
        throw new Error("No file URI resolved.");
      }
      
      return await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    } catch (error) {
      console.log(`Error reading asset for sticker ${stickerId}:`, error);
      return null;
    }
  };

  const handleOpen3DPreview = async () => {
    if (isGenerating3D) return;
    setIsGenerating3D(true);
    
    try {
      // 1. Resolve and read front stickers as base64
      const frontStickersData = await Promise.all(
        frontStickers.map(async (s) => {
          const originalId = s.id.split('-')[0];
          const originalSticker = STICKERS.find((item) => item.id === originalId);
          
          let base64 = null;
          if (originalSticker?.image) {
            base64 = await getAssetBase64(originalSticker.image, s.id);
          }
          
          return {
            id: s.id,
            imageBase64: base64 ? `data:image/png;base64,${base64}` : null,
            remoteUrl: originalSticker?.fileName ? `https://raw.githubusercontent.com/gabosalinas/FaroTracker/master/assets/stickers/${encodeURIComponent(originalSticker.fileName)}` : null,
            icon: originalSticker?.icon || null,
            x: s.x,
            y: s.y,
            scale: s.scale || 1,
            rotation: s.rotation || 0,
            heightLevel: 3,
          };
        })
      );

      // 2. Resolve and read back stickers as base64
      const backStickersData = await Promise.all(
        backStickers.map(async (s) => {
          const originalId = s.id.split('-')[0];
          const originalSticker = STICKERS.find((item) => item.id === originalId);
          
          let base64 = null;
          if (originalSticker?.image) {
            base64 = await getAssetBase64(originalSticker.image, s.id);
          }
          
          return {
            id: s.id,
            imageBase64: base64 ? `data:image/png;base64,${base64}` : null,
            remoteUrl: originalSticker?.fileName ? `https://raw.githubusercontent.com/gabosalinas/FaroTracker/master/assets/stickers/${encodeURIComponent(originalSticker.fileName)}` : null,
            icon: originalSticker?.icon || null,
            x: s.x,
            y: s.y,
            scale: s.scale || 1,
            rotation: s.rotation || 0,
            heightLevel: 3,
          };
        })
      );

      const W_c = CANVAS_SIZE - 20;
      const H_c = CANVAS_SIZE * 1.3 - 20;

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
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
        </head>
        <body>
          <div id="loading" class="loader">Generando 3D...</div>
          <div id="canvas-container"></div>

          <script>
            // Data passed from React Native
            const frontBaseColor = "${frontBaseColor}";
            const backBaseColor = "${backBaseColor}";
            const frontCanvasColor = "${frontCanvasColor}";
            const backCanvasColor = "${backCanvasColor}";
            const frontStickers = ${JSON.stringify(frontStickersData)};
            const backStickers = ${JSON.stringify(backStickersData)};
            const W_c = ${W_c};
            const H_c = ${H_c};

            // Setup scene
            const container = document.getElementById('canvas-container');
            const scene = new THREE.Scene();
            // scene.fog = new THREE.FogExp2(0x000000, 0.15);

            // Camera
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 0, 4.5);

            // Renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.localClippingEnabled = true;
            container.appendChild(renderer.domElement);

            // Controls
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 + 0.1;
            controls.minDistance = 2;
            controls.maxDistance = 10;

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
            scene.add(ambientLight);

            const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
            dirLight1.position.set(5, 5, 5);
            dirLight1.castShadow = true;
            dirLight1.shadow.mapSize.width = 1024;
            dirLight1.shadow.mapSize.height = 1024;
            dirLight1.shadow.camera.near = 4;
            dirLight1.shadow.camera.far = 12;
            dirLight1.shadow.camera.left = -2.2;
            dirLight1.shadow.camera.right = 2.2;
            dirLight1.shadow.camera.top = 2.2;
            dirLight1.shadow.camera.bottom = -2.2;
            dirLight1.shadow.bias = -0.0005;
            scene.add(dirLight1);

            scene.add(camera);

            // Helper to generate text/emoji textures on canvas
            function createEmojiTexture(emoji) {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              ctx.font = '160px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(emoji, 128, 128);
              return new THREE.CanvasTexture(canvas);
            }

            // Create raised frame helper
            function addFrame(parentMesh, width, height, coverT, margin, frameDepth, material, isBack = false) {
              const w = width;
              const h = height;
              const t = coverT;
              const m = margin;
              const d = frameDepth;

              const topBottomGeom = new THREE.BoxGeometry(w, m, d);
              const leftRightGeom = new THREE.BoxGeometry(m, h - 2 * m, d);
              const zPos = isBack ? -(t/2 + d/2) : (t/2 + d/2);

              const meshes = [
                new THREE.Mesh(topBottomGeom, material),
                new THREE.Mesh(topBottomGeom, material),
                new THREE.Mesh(leftRightGeom, material),
                new THREE.Mesh(leftRightGeom, material)
              ];

              meshes[0].position.set(0, h/2 - m/2, zPos);
              meshes[1].position.set(0, -(h/2 - m/2), zPos);
              meshes[2].position.set(-(w/2 - m/2), 0, zPos);
              meshes[3].position.set(w/2 - m/2, 0, zPos);

              meshes.forEach(mesh => {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                parentMesh.add(mesh);
              });
            }

            // Cover Dimensions
            const w = 1.4;
            const h = w * 1.3; // Matches 2D cover height aspect ratio (1.3 * CANVAS_SIZE)
            const t = 0.04;
            const pagesT = 0.04; // Half the thickness for a thinner notebook (fewer pages)

            const frontBaseColorHex = parseInt(frontBaseColor.replace('#', '0x'));
            const backBaseColorHex = parseInt(backBaseColor.replace('#', '0x'));
            const frontCanvasColorHex = parseInt(frontCanvasColor.replace('#', '0x'));
            const backCanvasColorHex = parseInt(backCanvasColor.replace('#', '0x'));

            const sideMaterialFront = new THREE.MeshStandardMaterial({ color: frontBaseColorHex, roughness: 1.0, metalness: 0.0 });
            const sideMaterialBack = new THREE.MeshStandardMaterial({ color: backBaseColorHex, roughness: 1.0, metalness: 0.0 });

            // Create notebook group
            const notebookGroup = new THREE.Group();
            scene.add(notebookGroup);

            // 1. Front Cover Mesh (Solid Base Color)
            const frontCoverGeom = new THREE.BoxGeometry(w, h, t);
            const frontCoverMesh = new THREE.Mesh(frontCoverGeom, sideMaterialFront);
            frontCoverMesh.position.z = pagesT/2 + t/2;
            frontCoverMesh.castShadow = true;
            frontCoverMesh.receiveShadow = true;
            notebookGroup.add(frontCoverMesh);

            // Recessed Canvas
            const CANVAS_SIZE = W_c + 20;
            const margin3D = w * (10 / CANVAS_SIZE);
            const canvasW = w - 2 * margin3D;
            const canvasH = h - 2 * margin3D;

            const frontClippingPlanes = [
              new THREE.Plane(),
              new THREE.Plane(),
              new THREE.Plane(),
              new THREE.Plane()
            ];
            const backClippingPlanes = [
              new THREE.Plane(),
              new THREE.Plane(),
              new THREE.Plane(),
              new THREE.Plane()
            ];

            const localFrontPlanes = [
              new THREE.Plane(new THREE.Vector3(-1, 0, 0), canvasW / 2),
              new THREE.Plane(new THREE.Vector3(1, 0, 0), canvasW / 2),
              new THREE.Plane(new THREE.Vector3(0, -1, 0), canvasH / 2),
              new THREE.Plane(new THREE.Vector3(0, 1, 0), canvasH / 2)
            ];

            const localBackPlanes = [
              new THREE.Plane(new THREE.Vector3(-1, 0, 0), canvasW / 2),
              new THREE.Plane(new THREE.Vector3(1, 0, 0), canvasW / 2),
              new THREE.Plane(new THREE.Vector3(0, -1, 0), canvasH / 2),
              new THREE.Plane(new THREE.Vector3(0, 1, 0), canvasH / 2)
            ];

            const frontCanvasGeom = new THREE.PlaneGeometry(canvasW, canvasH);
            const frontCanvasMat = new THREE.MeshStandardMaterial({ color: frontCanvasColorHex, roughness: 1.0, metalness: 0.0 });
            const frontCanvasMesh = new THREE.Mesh(frontCanvasGeom, frontCanvasMat);
            frontCanvasMesh.position.z = t/2 + 0.001;
            frontCanvasMesh.receiveShadow = true;
            frontCoverMesh.add(frontCanvasMesh);

            // Add raised frame
            addFrame(frontCoverMesh, w, h, t, margin3D, 0.015, sideMaterialFront, false);

            // 2. Back Cover Mesh (Solid Base Color)
            const backCoverGeom = new THREE.BoxGeometry(w, h, t);
            const backCoverMesh = new THREE.Mesh(backCoverGeom, sideMaterialBack);
            backCoverMesh.position.z = -(pagesT/2 + t/2);
            backCoverMesh.castShadow = true;
            backCoverMesh.receiveShadow = true;
            notebookGroup.add(backCoverMesh);

            // Recessed Canvas Back
            const backCanvasGeom = new THREE.PlaneGeometry(canvasW, canvasH);
            const backCanvasMat = new THREE.MeshStandardMaterial({ color: backCanvasColorHex, roughness: 1.0, metalness: 0.0 });
            const backCanvasMesh = new THREE.Mesh(backCanvasGeom, backCanvasMat);
            backCanvasMesh.rotation.y = Math.PI;
            backCanvasMesh.position.z = -(t/2 + 0.001);
            backCanvasMesh.receiveShadow = true;
            backCoverMesh.add(backCanvasMesh);

            // Add raised frame back
            addFrame(backCoverMesh, w, h, t, margin3D, 0.015, sideMaterialBack, true);

            // Helper to generate paper stack texture with sheet stripes
            function createPaperTexture(horizontal = true) {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#fdfdfd'; // Clean bright paper white
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.strokeStyle = '#1a1a1a'; // Dark black-grey gaps
              ctx.lineWidth = 4.0; // Thicker lines
              const steps = 10; // Only 10 stripes
              for (let i = 0; i <= steps; i++) {
                const val = (i / steps) * 256;
                ctx.beginPath();
                if (horizontal) {
                  ctx.moveTo(0, val);
                  ctx.lineTo(256, val);
                } else {
                  ctx.moveTo(val, 0);
                  ctx.lineTo(val, 256);
                }
                ctx.stroke();
              }
              const texture = new THREE.CanvasTexture(canvas);
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              texture.minFilter = THREE.NearestFilter;
              texture.magFilter = THREE.NearestFilter;
              return texture;
            }

            // 3. Paper Pages with sheet texture
            const paperGeom = new THREE.BoxGeometry(w - 0.04, h - 0.04, pagesT);
            
            const paperMatX = new THREE.MeshStandardMaterial({ 
              map: createPaperTexture(false), // Vertical stripes for Left/Right sides where Z maps to U
              roughness: 1.0, 
              metalness: 0.0 
            });
            const paperMatY = new THREE.MeshStandardMaterial({ 
              map: createPaperTexture(true),  // Horizontal stripes for Top/Bottom sides where Z maps to V
              roughness: 1.0, 
              metalness: 0.0 
            });
            const paperMatZ = new THREE.MeshStandardMaterial({ 
              color: 0xd0d0d0, 
              roughness: 1.0, 
              metalness: 0.0 
            });

            const paperMaterials = [
              paperMatX, // Right (+X)
              paperMatX, // Left (-X)
              paperMatY, // Top (+Y)
              paperMatY, // Bottom (-Y)
              paperMatZ, // Front (+Z)
              paperMatZ  // Back (-Z)
            ];

            const paperMesh = new THREE.Mesh(paperGeom, paperMaterials);
            paperMesh.castShadow = true;
            paperMesh.receiveShadow = true;
            notebookGroup.add(paperMesh);

            // Custom Helix Curve for realistic notebook spiral
            class HelixCurve extends THREE.Curve {
              constructor(radius, height, turns, startY) {
                super();
                this.radius = radius;
                this.height = height;
                this.turns = turns;
                this.startY = startY;
              }
              getPoint(t, optionalTarget = new THREE.Vector3()) {
                const angle = t * this.turns * 2 * Math.PI;
                const tx = this.radius * Math.cos(angle);
                const tz = this.radius * Math.sin(angle);
                const ty = this.startY - t * this.height;
                return optionalTarget.set(tx, ty, tz);
              }
            }

            // 4. Spiral Coil
            const spiralGroup = new THREE.Group();
            spiralGroup.position.x = -w/2;
            notebookGroup.add(spiralGroup);

            const spiralHeight = h - 0.1;
            const startY = spiralHeight / 2;
            const spiralPath = new HelixCurve(0.085, spiralHeight, 25, startY); // Adjusted radius from 0.105 to 0.085 to match thinner notebook
            
            // TubeGeometry: path, tubularSegments, radius, radialSegments, closed
            const spiralGeom = new THREE.TubeGeometry(spiralPath, 400, 0.010, 12, false); // Adjusted wire radius from 0.012 to 0.010 for proportionality
            
            // Premium metallic look
            const spiralMat = new THREE.MeshStandardMaterial({ 
              color: 0xe2e8f0,
              roughness: 1.0,
              metalness: 0.0
            });

            const spiralMesh = new THREE.Mesh(spiralGeom, spiralMat);
            spiralMesh.castShadow = true;
            spiralMesh.receiveShadow = true;
            spiralGroup.add(spiralMesh);

            notebookGroup.position.x = 0.05;

            // Load and render stickers
            const textureLoader = new THREE.TextureLoader();
            textureLoader.setCrossOrigin('anonymous');
            const frontStickerMeshes = [];
            const backStickerMeshes = [];

            function addStickersToCanvas(stickers, targetCanvasMesh, isBackCover = false) {
              const targetArray = isBackCover ? backStickerMeshes : frontStickerMeshes;
              stickers.forEach(sticker => {
                let texture;
                let topMat, sideMat, depthMaterial;
                const meshes = [];
                const scale = sticker.scale || 1;
                const baseSize = (80 * canvasW / W_c) * scale;

                const onLoadCallback = () => {
                  if (texture && texture.image) {
                    const imgW = texture.image.width || 1;
                    const imgH = texture.image.height || 1;
                    const aspect = imgW / imgH;
                    
                    meshes.forEach(m => {
                      if (aspect >= 1) {
                        m.scale.set(baseSize, baseSize / aspect, 1);
                      } else {
                        m.scale.set(baseSize * aspect, baseSize, 1);
                      }
                    });
                  }
                  if (topMat) topMat.needsUpdate = true;
                  if (sideMat) sideMat.needsUpdate = true;
                  if (depthMaterial) depthMaterial.needsUpdate = true;
                };

                const onTextureError = (err) => {
                  console.error('Error loading texture for sticker: ' + sticker.id, err);
                };

                if (sticker.imageBase64) {
                  texture = textureLoader.load(sticker.imageBase64, onLoadCallback, undefined, onTextureError);
                } else if (sticker.remoteUrl) {
                  texture = textureLoader.load(sticker.remoteUrl, onLoadCallback, undefined, onTextureError);
                } else if (sticker.icon) {
                  texture = createEmojiTexture(sticker.icon);
                  onLoadCallback();
                }

                if (texture) {
                  const stickerGeom = new THREE.PlaneGeometry(1, 1);
                  
                  topMat = new THREE.MeshStandardMaterial({ 
                    map: texture, 
                    transparent: true,
                    alphaTest: 0.5,
                    side: THREE.DoubleSide,
                    clippingPlanes: isBackCover ? backClippingPlanes : frontClippingPlanes,
                    roughness: 1.0,
                    metalness: 0.0
                  });

                  sideMat = new THREE.MeshStandardMaterial({ 
                    map: texture, 
                    transparent: true,
                    alphaTest: 0.5,
                    side: THREE.DoubleSide,
                    clippingPlanes: isBackCover ? backClippingPlanes : frontClippingPlanes,
                    roughness: 1.0,
                    metalness: 0.0
                  });
                  sideMat.onBeforeCompile = (shader) => {
                    shader.fragmentShader = shader.fragmentShader.replace(
                      '#include <map_fragment>',
                      \`
                      #ifdef USE_MAP
                        vec4 texelColor = texture2D( map, vUv );
                        diffuseColor.a *= texelColor.a;
                        diffuseColor.rgb = texelColor.rgb * 0.85;
                      #endif
                      \`
                    );
                  };

                  depthMaterial = new THREE.MeshDepthMaterial({
                    depthPacking: THREE.RGBADepthPacking,
                    map: texture,
                    alphaMap: texture,
                    alphaTest: 0.5,
                    transparent: true,
                    side: THREE.DoubleSide,
                    clippingPlanes: isBackCover ? backClippingPlanes : frontClippingPlanes
                  });

                  const normalizedX = (sticker.x + 50) / W_c;
                  const normalizedY = (sticker.y + 50) / H_c;
                  const threeX = (normalizedX - 0.5) * canvasW;
                  const threeY = (0.5 - normalizedY) * canvasH;

                  let zOffset = 0.012;
                  const lvl = sticker.heightLevel;
                  if (lvl === 'canvas') {
                    zOffset = 0.001;
                  } else if (lvl === 1 || lvl === '1') {
                    zOffset = 0.004;
                  } else if (lvl === 2 || lvl === '2') {
                    zOffset = 0.008;
                  } else if (lvl === 3 || lvl === '3') {
                    zOffset = 0.012;
                  } else if (lvl === 'frame') {
                    zOffset = 0.012;
                  }

                  const numLayers = lvl === 'canvas' ? 1 : Math.ceil(zOffset / 0.0015);

                  for (let i = 0; i < numLayers; i++) {
                    const isTop = (i === numLayers - 1);
                    const mesh = new THREE.Mesh(stickerGeom, isTop ? topMat : sideMat);
                    
                    mesh.scale.set(baseSize, baseSize, 1);
                    
                    let currentZ = 0.001;
                    if (numLayers > 1) {
                      currentZ = 0.001 + (i / (numLayers - 1)) * (zOffset - 0.001);
                    }
                    
                    mesh.position.set(threeX, threeY, currentZ);
                    mesh.rotation.z = -sticker.rotation * Math.PI / 180;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    mesh.customDepthMaterial = depthMaterial;
                    
                    targetCanvasMesh.add(mesh);
                    meshes.push(mesh);
                    targetArray.push(mesh);
                  }
                }
              });
            }

            addStickersToCanvas(frontStickers, frontCanvasMesh, false);
            addStickersToCanvas(backStickers, backCanvasMesh, true);

            // Hide loader once setup is done
            document.getElementById('loading').style.display = 'none';

            // Resize Handler
            window.addEventListener('resize', () => {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // Animation Loop
            let autoRotate = true;
            container.addEventListener('pointerdown', () => {
              autoRotate = false;
            });

            function animate() {
              requestAnimationFrame(animate);
              if (autoRotate) {
                notebookGroup.rotation.y += 0.008;
              }

              // Update light positions relative to the camera to ensure consistent viewport lighting
              if (dirLight1 && camera) {
                const offset = new THREE.Vector3(2, 2, 2);
                offset.applyMatrix4(camera.matrixWorld);
                dirLight1.position.copy(offset);
              }

              // Dynamic shadow casting toggle based on which cover faces the camera (preventing shadow bleeding)
              if (notebookGroup && camera) {
                const frontNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(notebookGroup.quaternion);
                const toCamera = camera.position.clone().normalize();
                const isFrontFacingCamera = frontNormal.dot(toCamera) > 0;

                frontStickerMeshes.forEach(mesh => {
                  mesh.castShadow = isFrontFacingCamera;
                });
                backStickerMeshes.forEach(mesh => {
                  mesh.castShadow = !isFrontFacingCamera;
                });
              }

              // Update clipping planes to follow the rotating canvas meshes
              if (typeof frontCanvasMesh !== 'undefined' && typeof backCanvasMesh !== 'undefined') {
                frontCanvasMesh.updateMatrixWorld(true);
                backCanvasMesh.updateMatrixWorld(true);
                for (let i = 0; i < 4; i++) {
                  frontClippingPlanes[i].copy(localFrontPlanes[i]).applyMatrix4(frontCanvasMesh.matrixWorld);
                  backClippingPlanes[i].copy(localBackPlanes[i]).applyMatrix4(backCanvasMesh.matrixWorld);
                }
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
      Alert.alert("Error", "No se pudo generar la vista 3D: " + (error instanceof Error ? error.message : String(error)));
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
              <Text style={styles.title}>{currentSide === 'front' ? 'TAPA' : 'CONTRATAPA'}</Text>
            </View>
            <View style={styles.rightHeader}>
              <TouchableOpacity onPress={handleSubirPedido}>
                <Text style={styles.reviewButton}>SUBIR PEDIDO</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.main}>
            {/* Área del Cuaderno (Canvas) */}
            <Animated.View style={[styles.canvasWrapper, { transform: [{ rotateY: flipStr }] }]}>
              <View style={[styles.glowLayer, { width: CANVAS_SIZE + 12, height: CANVAS_SIZE * 1.3 + 12, borderRadius: 20, opacity: 0.45 }]} />
              <View style={[styles.glowLayer, { width: CANVAS_SIZE + 28, height: CANVAS_SIZE * 1.3 + 28, borderRadius: 24, opacity: 0.25 }]} />
              <View style={[styles.glowLayer, { width: CANVAS_SIZE + 48, height: CANVAS_SIZE * 1.3 + 48, borderRadius: 28, opacity: 0.10 }]} />

              <View style={[styles.notebookBase, { backgroundColor: baseColor }]}>
                <TouchableOpacity
                  activeOpacity={1}
                  style={[styles.notebookCanvas, { backgroundColor: canvasColor }]}
                  onPress={() => setSelectedStickerId(null)}
                >
                  {stickers.map(sticker => (
                    <StickerItem 
                      key={sticker.id} 
                      sticker={sticker} 
                      isSelected={selectedStickerId === sticker.id}
                      onSelect={() => setSelectedStickerId(sticker.id)}
                    />
                  ))}
                  <View style={styles.gridOverlay} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Controles de Configuración Rápidos */}
            <View style={styles.controls}>
              <View style={styles.quickSelectorsRow}>
                {/* Selector de Color de Marco */}
                <TouchableOpacity 
                  style={styles.quickSelectorItem} 
                  onPress={() => {
                    setColorPickerTitle('COLOR DE MARCO');
                    setColorPickerTarget('base');
                    setColorPickerVisible(true);
                  }}
                >
                  <Text style={styles.quickSelectorLabel}>MARCO</Text>
                  <View style={[styles.quickColorCircle, { backgroundColor: baseColor }]} />
                </TouchableOpacity>

                {/* Selector de Color de Lienzo */}
                <TouchableOpacity 
                  style={styles.quickSelectorItem} 
                  onPress={() => {
                    setColorPickerTitle('COLOR DE LIENZO');
                    setColorPickerTarget('canvas');
                    setColorPickerVisible(true);
                  }}
                >
                  <Text style={styles.quickSelectorLabel}>LIENZO</Text>
                  <View style={[styles.quickColorCircle, { backgroundColor: canvasColor }]} />
                </TouchableOpacity>

                {/* Borrar Stickers (Red Cross) */}
                <TouchableOpacity 
                  style={styles.quickSelectorItem} 
                  onPress={resetDesign}
                >
                  <Text style={[styles.quickSelectorLabel, { color: '#FF3B30' }]}>LIMPIAR</Text>
                  <View style={styles.deleteCrossCircle}>
                    <Text style={styles.deleteCrossText}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {selectedSticker && (
                <View style={styles.stickerControlPanel}>
                  <Text style={styles.stickerControlTitle}>STICKER SELECCIONADO</Text>
                  


                  <View style={styles.stickerActionRow}>
                    <TouchableOpacity 
                      style={[styles.stickerActionBtn, styles.deleteStickerBtn, { flex: 1 }]}
                      onPress={() => {
                        removeSticker(selectedSticker.id);
                        setSelectedStickerId(null);
                      }}
                    >
                      <Text style={[styles.stickerActionText, styles.deleteStickerText]}>🗑️ BORRAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Botones de Acción Principales */}
              <View style={styles.mainActionsRow}>
                {/* Añadir Sticker */}
                <TouchableOpacity 
                  style={styles.actionCircleBtn} 
                  onPress={() => setPickerVisible(true)}
                >
                  <Text style={styles.actionBtnIcon}>+</Text>
                </TouchableOpacity>

                {/* Ver en 3D */}
                <TouchableOpacity 
                  style={styles.actionTextBtn} 
                  onPress={handleOpen3DPreview}
                >
                  <Text style={styles.actionBtnText}>
                    {isGenerating3D ? 'CARGANDO...' : 'VER EN 3D'}
                  </Text>
                </TouchableOpacity>

                {/* Cambiar de Lado (Tapa / Contratapa) */}
                <TouchableOpacity 
                  style={styles.actionCircleBtn} 
                  onPress={handleToggleSide}
                >
                  <Text style={[styles.actionBtnIcon, { fontSize: 20 }]}>🔄</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ==================== PAGINA 1: PREPARACIÓN ==================== */}
        <View style={{ width: width, height: '100%', backgroundColor: '#000000' }}>
          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <TouchableOpacity onPress={() => scrollToPage(0)}>
                <Text style={styles.backButton}>← EDITAR</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerHeader}>
              <Text style={styles.title}>PREPARACIÓN</Text>
            </View>
            <View style={styles.rightHeader}>
              <TouchableOpacity onPress={() => console.log('Compartir presionado')}>
                <Text style={styles.shareText}>COMPARTIR</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Vista Previa */}
            <View style={styles.previewContainer}>
              <View style={styles.previewRow}>
                {/* TAPA */}
                <View style={styles.notebookContainer}>
                  <View style={{ width: MINI_NOTEBOOK_WIDTH, height: MINI_NOTEBOOK_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={[styles.glowLayer, { width: MINI_NOTEBOOK_WIDTH + 8, height: MINI_NOTEBOOK_HEIGHT + 8, borderRadius: 12, opacity: 0.45 }]} />
                    <View style={[styles.glowLayer, { width: MINI_NOTEBOOK_WIDTH + 18, height: MINI_NOTEBOOK_HEIGHT + 18, borderRadius: 14, opacity: 0.25 }]} />
                    <View style={[styles.glowLayer, { width: MINI_NOTEBOOK_WIDTH + 30, height: MINI_NOTEBOOK_HEIGHT + 30, borderRadius: 16, opacity: 0.10 }]} />

                    <ViewShot ref={frontViewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }}>
                      <View style={[styles.miniNotebook, { backgroundColor: frontBaseColor }]}>
                        <View style={[styles.miniCanvas, { backgroundColor: frontCanvasColor }]}>
                          {frontStickers.map(sticker => (
                            <MiniSticker key={sticker.id} sticker={sticker} />
                          ))}
                        </View>
                      </View>
                    </ViewShot>
                  </View>
                  <Text style={styles.previewSublabel}>TAPA</Text>
                </View>

                {/* CONTRATAPA */}
                <View style={styles.notebookContainer}>
                  <View style={{ width: MINI_NOTEBOOK_WIDTH, height: MINI_NOTEBOOK_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={[styles.glowLayer, { width: MINI_NOTEBOOK_WIDTH + 8, height: MINI_NOTEBOOK_HEIGHT + 8, borderRadius: 12, opacity: 0.45 }]} />
                    <View style={[styles.glowLayer, { width: MINI_NOTEBOOK_WIDTH + 18, height: MINI_NOTEBOOK_HEIGHT + 18, borderRadius: 14, opacity: 0.25 }]} />
                    <View style={[styles.glowLayer, { width: MINI_NOTEBOOK_WIDTH + 30, height: MINI_NOTEBOOK_HEIGHT + 30, borderRadius: 16, opacity: 0.10 }]} />

                    <ViewShot ref={backViewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }}>
                      <View style={[styles.miniNotebook, { backgroundColor: backBaseColor }]}>
                        <View style={[styles.miniCanvas, { backgroundColor: backCanvasColor }]}>
                          {backStickers.map(sticker => (
                            <MiniSticker key={sticker.id} sticker={sticker} />
                          ))}
                        </View>
                      </View>
                    </ViewShot>
                  </View>
                  <Text style={styles.previewSublabel}>CONTRATAPA</Text>
                </View>
              </View>
              <Text style={styles.previewLabel}>VISTA PREVIA DEL DISEÑO</Text>
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

            {/* Resumen de Costos */}
            <View style={styles.costSummaryContainer}>
              <Text style={styles.costSummaryTitle}>RESUMEN DE COMPRA</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Cuaderno Faro3D:</Text>
                <Text style={styles.costValue}>{ORDER_COST_DISPLAY}</Text>
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
                  {shippingCost !== null ? formatCurrency(31500 + shippingCost) : ORDER_COST_DISPLAY}
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
            {/* Card 1: ID de Pedido */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>ID DEL PEDIDO</Text>
              <Text selectable={true} style={[styles.cardValue, styles.orderIdText]}>
                {orderId || 'Generando ID...'}
              </Text>
            </View>

            {/* Card 2: Costo */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>MONTO A PAGAR</Text>
              <Text style={[styles.cardValue, { marginBottom: 0 }]}>
                {shippingCost !== null ? formatCurrency(31500 + shippingCost) : ORDER_COST_DISPLAY}
              </Text>
            </View>

            {/* Card 3: Mercado Pago (Alias) */}
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

            {/* Botón de Confirmación */}
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

      {/* Tooltip Toast Flotante Animado */}
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
              <Text style={styles.title}>DISEÑO 3D INTERACTIVO</Text>
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
              {colors.map((color) => {
                const isSelected = (colorPickerTarget === 'base' ? baseColor : canvasColor) === color;
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
                        setBaseColor(color);
                      } else {
                        setCanvasColor(color);
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 224, 255, 0.2)',
    backgroundColor: '#000000',
  },
  leftHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerHeader: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightHeader: {
    flex: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  sideToggle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E0FF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  reviewButton: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E0FF',
    letterSpacing: 1,
    textAlign: 'right',
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  canvasWrapper: {
    width: CANVAS_SIZE + 40,
    height: CANVAS_SIZE * 1.3, // Proporción A5 aprox, compactada
    justifyContent: 'center',
    alignItems: 'center',
  },
  notebookBase: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE * 1.3,
    borderRadius: 15,
    padding: 10,
    elevation: 10,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 25,
  },
  notebookCanvas: {
    flex: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: '#00E0FF',
  },
  controls: {
    width: '100%',
    paddingHorizontal: 20,
  },
  controlGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#00E0FF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 224, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  colorRow: {
    paddingRight: 20,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#00E0FF',
  },
  nextButton: {
    marginTop: 10,
  },
  editorButton: {
    paddingVertical: 12,
    marginVertical: 4,
  },
  resetButtonContainer: {
    marginTop: 8,
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    borderRadius: 4,
  },
  resetButtonText: {
    color: '#FF3B30',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#666666',
  },

  // Page 1 Styles (Review)
  scrollContent: {
    padding: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#000000',
    padding: 10,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notebookContainer: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  miniNotebook: {
    width: MINI_NOTEBOOK_WIDTH,
    height: MINI_NOTEBOOK_HEIGHT,
    borderRadius: 8,
    padding: MINI_PADDING,
    elevation: 5,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
  },
  miniCanvas: {
    flex: 1,
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  previewSublabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  previewLabel: {
    fontSize: 10,
    color: '#A0A0A0',
    marginTop: 15,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
    marginBottom: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 224, 255, 0.2)',
    paddingBottom: 5,
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  specLabel: {
    fontSize: 13,
    color: '#A0A0A0',
    width: 120,
  },
  colorChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stickerThumb: {
    width: 50,
    height: 50,
    backgroundColor: '#121212',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.2)',
  },
  stickerImage: {
    width: 30,
    height: 30,
  },
  stickerIcon: {
    fontSize: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 224, 255, 0.2)',
  },
  shareText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E0FF',
    textAlign: 'right',
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  postalCodeContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 15,
  },
  postalCodeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E0FF',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  postalCodeInput: {
    backgroundColor: '#121212',
    borderColor: 'rgba(0, 224, 255, 0.3)',
    borderWidth: 1.5,
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  costSummaryContainer: {
    marginTop: 25,
    backgroundColor: 'rgba(20, 22, 28, 0.4)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.2)',
    padding: 16,
    width: '100%',
  },
  costSummaryTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00E0FF',
    letterSpacing: 2,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  costLabel: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  costValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 224, 255, 0.2)',
    paddingTop: 12,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00E0FF',
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Page 2 Styles (Checkout)
  content: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: 'rgba(20, 22, 28, 0.6)',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A0A0A0',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  orderIdText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#00E0FF',
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
    overflow: 'hidden',
    marginBottom: 0,
    textShadowColor: 'rgba(0, 224, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  holderText: {
    fontSize: 13,
    color: '#A0A0A0',
    fontWeight: '600',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  mpButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#00E0FF',
  },
  mpButtonText: {
    color: '#00E0FF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  confirmButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: '#00E0FF',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 13,
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  closeButton: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  // Toast Styles
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
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
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  heightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  heightButton: {
    flex: 1,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedHeightButton: {
    borderColor: '#00E0FF',
    backgroundColor: 'rgba(0, 224, 255, 0.15)',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  heightButtonText: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
  },
  selectedHeightButtonText: {
    color: '#00E0FF',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
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
    textShadowColor: 'rgba(0, 224, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  quickColorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteCrossCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteCrossText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF3B30',
    textAlign: 'center',
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
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
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
});

export default EditorScreen;
