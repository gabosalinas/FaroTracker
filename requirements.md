# 📋 Requerimientos del Proyecto - FaroTracker

Este documento detalla las especificaciones de diseño, requerimientos funcionales, requerimientos técnicos y reglas de negocio para la aplicación móvil **FaroTracker**, basadas en el [Documento Maestro](Prompts/Faro3DCuadernos.md).

---

## 🎨 1. Concepto y ADN de Marca

La aplicación **FaroTracker** es una plataforma móvil de co-diseño e interactividad para la línea de tableros organizadores y agendas visuales magnéticas físicas de la marca **FaroTracker**. Su propuesta de valor combina la personalización cromática del organizador con un set modular de fichas (tokens) imantadas con relieve tridimensional táctil.

### 📏 Reglas del ADN de Diseño
*   **Curaduría Cromática:** La gama de colores es fija y controlada. El usuario puede cambiar tres variables principales:
    *   **Color de Base:** El fondo principal del tablero físico y las fichas.
    *   **Color de Acento:** El borde del tablero y la delimitación de las ranuras circulares de los slots.
    *   **Color de Texto:** La tipografía técnica de los días de la semana.
*   **Alineamiento Estético:** Se evitan gradientes y texturas complejas de impresión sobre la base. La riqueza visual y de sombras físicas reside en el relieve técnico de las fichas y la combinación de colores planos.
*   **Unificación Cromática de las Fichas:** Para asegurar la consistencia y la factibilidad del producto físico, la base circular de las fichas siempre tomará el **Color de Base** seleccionado para el tablero. Los iconos en sí se renderizan sobre la ficha usando sus colores originales.
*   **Fidelidad Técnica vs Validación Estética:**
    *   La personalización del lienzo se realiza en **vista ortogonal de 2D** para asegurar precisión geométrica y de alineamiento en la cuadrícula de slots.
    *   La previsualización interactiva **3D** se utiliza estrictamente como validación estética de profundidad y sombras físicas sobre una heladera antes de la producción.

---

## 🛠️ 2. Requerimientos Funcionales (Flujo de Pantallas)

### P1. El Hub (Pantalla de Inicio)
*   **Navegación Principal:**
    *   Acceso directo al **Modo Creación (Línea Studio)** para personalizar el tablero y fichas.
    *   Acceso al **Catálogo de Modelos Listos** para comprar tableros y sets prediseñados de FaroTracker.
    *   Acceso al menú de perfil / pedidos del usuario.
*   **Alineamiento Estético:** Interfaz ultra-minimalista, con fondo oscuro sólido (`#000000`) y detalles de iluminación glow en cian/blanco técnico.

### P2. Catálogo (Modelos Listos)
*   **Navegación e Interacción:**
    *   Listado vertical de colecciones curadas (ej. *Organizador Infantil*, *Hábitos Saludables*, *Planificador de Comidas*).
    *   Cada tarjeta de producto muestra fotos en alta definición del producto terminado con su set estándar de fichas.
    *   Al tocar una tarjeta, se abre la vista de **Detalle del Modelo** con pestañas de *Fotos* e interacción *3D* del modelo por defecto.
    *   Información del modelo: Nombre del producto, Tagline, descripción, precio y botón de compra directa.

### P3. Taller de Composición (El "Canvas" 2D)
*   **Controles Cromáticos y de Estructura:**
    *   Selectores para configurar el **Color de Base**, **Color de Acento** y **Color de Texto/Días** del tablero.
    *   Controles rápidos para **Agregar Fila** y **Quitar Fila** (mínimo 1 fila, máximo 6 filas, por defecto 4 filas de slots).
*   **Lienzo del Tablero (Grid Semanal):**
    *   Columnas fijas etiquetadas **L, Ma, Mi, J, V, S, D** en la cabecera.
    *   Ranuras circulares delineadas con el color de acento, dispuestas en una cuadrícula de 7 columnas por N filas.
*   **Configurador del Set de Fichas (Token Pack):**
    *   Un cajón inferior o galería organizada por solapas (Dibujos, Letras, Zodiaco, Emojis) para buscar iconos.
    *   Selector numérico (+ / -) al lado de cada icono seleccionado para definir la cantidad física de fichas a ordenar de ese tipo.
    *   Se muestra un indicador del total de fichas agregadas al pack.
*   **Manipulación Dinámica (Canvas):**
    *   El usuario puede arrastrar fichas desde su inventario de fichas del pack hacia las ranuras del tablero.
    *   **Atracción (Snap):** Al soltar una ficha cerca de una de las ranuras circulares del tablero, ésta se imanta (snap) automáticamente en el centro de la ranura.
    *   **Remoción:** Si se arrastra una ficha fuera del tablero, se quita del canvas de previsualización (vuelve a la lista del pack).
*   **Previsualización Estética 3D:**
    *   Botón flotante "Vista 3D". Al activarlo, abre un visor interactivo que renderiza el tablero en 3D adherido a una puerta de heladera de acero inoxidable, con los colores exactos, la cantidad de filas definida y las fichas colocadas en relieve tridimensional.

### P4. Ficha Técnica y Resumen del Pedido
*   **Revisión Final:**
    *   Presentación del tablero configurado con sus colores y filas actuales.
    *   **Checklist Técnico:** Color de Base, Color de Acento, Color de Texto, cantidad de filas del tablero y listado detallado del pack de fichas con cantidades (ej. *15x Icono Agua, 5x Icono Gym*).
*   **Cálculo de Envío:** Cotizador integrado para Correo Argentino.
*   **Confirmación:** Botón para proceder al pago ("Confirmar y Comprar").

### P5. Checkout y Éxito de Compra
*   **Procesamiento:** Formulario de envío y de pago simulado.
*   **Compartir:** Botón "Compartir diseño" para exportar el tablero personalizado como imagen PNG nativa usando `react-native-view-shot` y `expo-sharing`.

---

## ⚙️ 3. Requerimientos Técnicos

### Framework y Entorno
*   **Framework Principal:** React Native usando **Expo SDK 54** y React Native **0.81**.
*   **Navegación:** React Navigation v7 (Stack Navigator).
*   **Estilo Visual:** Hojas de estilo nativas (StyleSheet) con un tema oscuro minimalista.

### Arquitectura de Estado
*   **Mapeo del Estado (Zustand v5):**
    *   El store [useDesignStore.js](src/store/useDesignStore.js) se sincroniza mediante `persist` middleware con `@react-native-async-storage/async-storage`.
    *   **Modelo de Datos:**
        *   `boardColor` (string HEX)
        *   `accentColor` (string HEX)
        *   `textColor` (string HEX)
        *   `rowCount` (number, entre 1 y 6)
        *   `tokenPack` (Array de objetos `{ iconId, quantity }`)
        *   `placedTokens` (Array de objetos `{ id, iconId, column, row }`)

### Motor Tridimensional (3D Rendering)
*   **Visualización en WebView:**
    *   Consumo de Three.js local dentro de un `WebView`.
    *   **Escena 3D:**
        *   Renderizado de un plano de fondo con material metálico cepillado y texturas realistas (la heladera).
        *   El tablero como un bloque extruido con las esquinas redondeadas y sus respectivos slots circulares.
        *   Los tokens se renderizan como cilindros cortos en 3D (con el color de fondo coincidiendo con el del tablero y la textura del icono mapeada en la cara frontal superior) colocados en las posiciones correspondientes a los slots ocupados.
        *   Cálculo físico de luces (DirectionalLight y AmbientLight) para proyectar sombras suaves de las fichas sobre el tablero y de éste sobre la heladera.

### Recursos del Sistema Nativos
*   **Captura de Canvas (Exportación):** Utilización de `react-native-view-shot` para capturar el lienzo 2D del tablero.
*   **Compartido:** Integración de la API de Expo Sharing (`expo-sharing`) para abrir el menú de compartición de archivos del sistema operativo.

---

## 📈 4. Reglas de Negocio y Manufactura

1.  **Límite de Fila Dinámica:** El tablero debe restringirse estrictamente a un mínimo de 1 fila y un máximo de 6 filas de slots por razones de estabilidad estructural del producto imantado.
2.  **Imantación Unívoca (Slot Lock):** Una ranura circular individual del tablero solo puede contener una ficha a la vez. Si el usuario intenta colocar otra ficha en una ranura ya ocupada, la ficha anterior se desplaza o regresa al inventario.
3.  **Color de Ficha Vinculado:** Por restricciones de inyección de plástico/producción física, la base de la ficha debe coincidir exactamente con el color de base seleccionado para el tablero organizador. El editor debe sincronizar de forma reactiva el color de fondo de las fichas con el del tablero tanto en el lienzo 2D como en la previsualización 3D.
4.  **Cálculo de Precios:** En esta versión, se maneja un precio de pedido fijo para el tablero base con un set predeterminado de fichas (el cálculo dinámico escalable por ficha individual queda diferido para fases de desarrollo futuras).
