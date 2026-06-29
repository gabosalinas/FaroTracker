# 📋 Requerimientos del Proyecto - Faro 3D App

Este documento detalla las especificaciones de diseño, requerimientos funcionales, requerimientos técnicos y reglas de negocio para la aplicación móvil **Faro 3D**, basadas en el [Documento Maestro](Prompts/Faro3DCuadernos.md).

---

## 🎨 1. Concepto y ADN de Marca

La aplicación **Faro 3D** es una plataforma móvil de co-diseño e interactividad para la línea de cuadernos físicos premium de la marca **Faro 3D**. Su propuesta de valor combina la precisión del diseño técnico minimalista con la estimulación táctil del relieve físico.

### 📏 Reglas del ADN de Diseño
*   **Curaduría Cromática:** La gama de colores es fija y controlada. Sólo se permiten combinaciones pre-aprobadas para garantizar estética, armonía y factibilidad de manufactura.
*   **Colores Planos (Solid Colors):** No se permiten gradientes ni texturas complejas de impresión sobre los elementos. La riqueza visual y de sombras físicas reside en el juego de relieves planos superpuestos.
*   **Fidelidad Técnica vs Validación Estética:**
    *   La personalización del lienzo se realiza en **vista ortogonal de 2D** para asegurar precisión geométrica y de alineamiento.
    *   La previsualización interactiva **3D** se utiliza estrictamente como validación estética de profundidad y sombras físicas antes de la producción.

---

## 🛠️ 2. Requerimientos Funcionales (Flujo de Pantallas)

### P1. El Hub (Pantalla de Inicio)
*   **Navegación Principal:**
    *   Acceso directo al **Modo Creación (Línea Studio)** para personalizar cuadernos.
    *   Acceso al **Catálogo de Autor** para visualizar y comprar modelos prediseñados de Faro 3D.
    *   Acceso al menú de perfil / pedidos del usuario.
*   **Alineamiento Estético:** Interfaz ultra-minimalista, con fondo oscuro sólido (`#000000`) y detalles de iluminación glow en cian/blanco técnico.

### P2. Catálogo (Línea de Autor)
*   **Navegación e Interacción:**
    *   Listado vertical de colecciones curadas (ej. *Medicina*, *Ingeniería*, *Fórmula 1*).
    *   Cada tarjeta (Card) de producto muestra fotos en alta definición de productos terminados.
    *   Al tocar una tarjeta, se abre la vista de **Detalle del Modelo** con pestañas de *Fotos de la Galería* e interacción *3D* del modelo.
    *   Información del modelo: Nombre del producto, Tagline, descripción extendida, precio fijo, y opción para agregar al carrito / ir al checkout.

### P3. Configuración de Base (Inicio del Modo Creación)
*   **Controles de Entrada:**
    *   Lienzo ortogonal 2D vacío del cuaderno.
    *   Selector circular para configurar el **Color de Base** física del cuaderno.
    *   Selector circular para configurar el **Color de Fondo** (Lienzo) de la tapa.
*   **Navegación:** Botón para proceder a la adición de gráficos (Diseñar Tapa).

### P4. Taller de Composición (El "Canvas")
*   **Adición de Elementos (Stickers):**
    *   Galería inferior categorizada por nichos temáticos (Música, Juegos, Profesión, Deportes, Retro).
    *   Toque simple sobre un sticker para agregarlo al centro del lienzo.
*   **Límites de Composición:**
    *   Máximo de **5 stickers** por cara (Tapa y Contratapa de manera independiente).
*   **Manipulación Dinámica (Por Elemento):**
    *   Selección táctil sobre el sticker activo en el lienzo.
    *   Herramientas para **Escalar** (redimensionamiento libre), **Rotar** (rotación en 360 grados), y **Mover** (traslación en coordenadas X/Y).
    *   Controlador de **Relieve (Toggle Plano / Sobre Relieve)** para definir si el sticker se fabrica de forma plana o sobresale de la superficie (generando efecto tridimensional en el render).
*   **Previsualización Estética 3D:**
    *   Botón flotante "Vista 3D" en el lienzo.
    *   Al activarlo, renderiza el cuaderno 3D en tiempo real reflejando los colores elegidos, stickers posicionados y sus alturas relativas (sobre relieve).
    *   Permite gestos táctiles de rotación y traslación interactiva de la cámara 3D.

### P5. Contratapa (Simetría)
*   **Giro del Cuaderno:**
    *   Botón de "Girar Cuaderno" para alternar la visualización del canvas entre Tapa (Front) y Contratapa (Back).
    *   Replica la misma lógica funcional de la pantalla P4 (taller de composición) de forma independiente para el reverso del cuaderno.

### P6. Resumen y Ficha Técnica
*   **Revisión Final:**
    *   Presentación lado a lado de la Tapa y Contratapa personalizadas.
    *   **Checklist Técnico:** Color de Base, Color de Fondo, cantidad total de stickers y desglose de diseños con "Sobre Relieve" configurados.
*   **Confirmación:** Botón para proceder al pago ("Confirmar y Comprar").

### P7. Checkout y Éxito de Compra
*   **Procesamiento:**
    *   Formulario de datos de envío y métodos de pago.
    *   Pantalla de éxito que muestra un mensaje de confirmación de ingreso a cola de producción.
*   **Compartir:**
    *   Botón "Compartir diseño" para exportar la tapa/contratapa personalizada como imagen PNG/JPG y abrir la hoja de compartir nativa del dispositivo.

---

## ⚙️ 3. Requerimientos Técnicos

### Framework y Entorno
*   **Framework Principal:** React Native usando **Expo SDK 54** y React Native **0.81**.
*   **Navegación:** React Navigation v7 (Stack Navigator para transiciones fluidas entre el Hub, Editor y Catalog).
*   **Estilo Visual:** Hojas de estilo nativas (StyleSheet) implementando un tema oscuro con contrastes de color cian técnico (`#00E0FF`), blanco (`#FFFFFF`) y grises apagados sobre fondo `#000000`.

### Arquitectura de Estado
*   **Mapeo del Estado:**
    *   Uso de la librería **Zustand v5** para almacenar y sincronizar la configuración del diseño a través del store [useDesignStore.js](src/store/useDesignStore.js).
    *   **Persistencia:** Integración de `persist` middleware de Zustand con `@react-native-async-storage/async-storage` para autoguardar la composición localmente.
    *   **Modelo de Datos en Tapa/Contratapa:**
        *   `frontBaseColor` / `backBaseColor` (string HEX)
        *   `frontCanvasColor` / `backCanvasColor` (string HEX)
        *   `frontStickers` / `backStickers` (Array de objetos sticker con propiedades: `id`, `name`, `x`, `y`, `scale`, `rotation`, `isRelief`).

### Motor Tridimensional (3D Rendering)
*   **Visualización en la Ficha Técnica / Detalle del Catálogo:**
    *   Integración de un componente `WebView` (`react-native-webview`) para renderizar un entorno HTML/JS local.
    *   Consumo del elemento interactivo web `<model-viewer>` de Google.
    *   **Evitación de Restricciones CORS:** Carga local de assets 3D binarios (archivos `.glb`) mediante la resolución asíncrona de recursos en Expo (`expo-asset` y `expo-file-system`) y su conversión a Data URIs codificados en **Base64** antes de inyectarlos en el WebView.

### Recursos del Sistema Nativos
*   **Captura de Canvas (Exportación):** Utilización de `react-native-view-shot` para capturar la vista bidimensional ortogonal (el lienzo 2D del cuaderno) como una imagen nativa.
*   **Compartido:** Integración de la API de Expo Sharing (`expo-sharing`) para abrir el menú de compartición de archivos del sistema operativo y permitir el guardado o envío de las capturas del cuaderno.

---

## 📈 4. Reglas de Negocio y Manufactura

1.  **Validación de Capacidad:** El sistema de composición debe bloquear estrictamente la adición de nuevos elementos gráficos cuando el contador de stickers alcanza el máximo de 5 por cara.
2.  **Validación del Relieve:** Para evitar fallas en la impresión 3D/producción, los stickers tridimensionales deben mantener tamaños de escala y márgenes de superposición seguros que el editor debe resguardar (evitar colisiones extremas o stickers saliendo del margen del lienzo del cuaderno A5).
