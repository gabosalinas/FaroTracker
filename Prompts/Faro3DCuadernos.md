# Documento Maestro

## **Proyecto: App FaroTracker (Documento Maestro)**

FaroTracker es una plataforma interactiva de co-diseño y compra que traslada la estética técnica, minimalista y táctil de la marca al diseño de agendas visuales y tableros de seguimiento físicos y magnéticos (ideados para adherirse a superficies metálicas como heladeras).

### **1. El Catálogo (Líneas de Autor)**

Sección orientada a la compra de organizadores y rastreadores temáticos prediseñados por **FaroTracker**.

* **Contenido:** Colecciones preconfiguradas con sets cerrados de fichas (e.g., **Organizador Infantil, Hábitos Saludables, Fitness & Nutrición, Trabajo Semanal**).
* **UX:** Galería interactiva con fotos reales del producto. El cliente elige un modelo pre-establecido y accede directamente al checkout con una configuración estándar recomendada.

### **2. El Modo Creación (Línea Studio)**

Experiencia interactiva y modular para personalizar el tablero organizador y configurar el set de fichas magnéticas a medida.

* **Términos y Condiciones:** Al ingresar al taller de diseño por primera vez, el usuario debe leer y aceptar los términos y condiciones detallados (exclusión de arrepentimiento según Art. 1116 CCyC de Argentina para productos personalizados, garantía de 6 meses y derechos de propiedad intelectual) haciendo scroll completo para habilitar el botón de aceptación.
* **Persistencia de Estado:** El editor guarda automáticamente el estado del diseño del tablero (colores y fichas colocadas/seleccionadas) mediante `AsyncStorage`, impidiendo parpadeos visuales al cargar la app.
* **Configuración Cromática del Tablero:** Elección de tres variables de color:
  * **Color de Base:** Color de fondo general del tablero.
  * **Color de Acento:** Color de los bordes y el delineado circular de las ranuras (Slots).
  * **Color de Texto/Días:** Color para la tipografía de los días de la semana (L, Ma, Mi, J, V, S, D).
* **Diseño del Tablero (Grid Semanal Dinámico):**
  * Estructura de 7 columnas fijas para los días de la semana: **L (Lunes), Ma (Martes), Mi (Miércoles), J (Jueves), V (Viernes), S (Sábado), D (Domingo)**.
  * **Filas dinámicas:** El usuario puede agregar o remover filas al tablero (mínimo 1, máximo 6 filas; por defecto 4) mediante botones de control rápido en el editor (`+ Filas` / `- Filas`).
  * Cada ranura es un slot circular imantado.
* **Configurador del Set de Fichas (Token Pack):**
  * El usuario selecciona qué iconos magnéticos quiere incluir en su pack físico y la cantidad de cada uno.
  * **Estética de las Fichas (Tokens):**
    * Cada ficha circular tiene como color de fondo (base de la ficha) el mismo color seleccionado como **Color de Base** del tablero.
    * El icono gráfico que va sobre la ficha se renderiza con su representación de color original (dibujos, emojis, zodiaco, tipografías).
  * **Inventario / Galería de Iconos:**
    * **DIBUJOS:** Diseños genéricos (animales, monumentos, paisajes, memes y objetos cotidianos) diseñados bajo estrictas reglas de MakerWorld (2D plano, vista 100% frontal, sin perspectiva ni sombras y 4 colores sólidos para una extrusión limpia).
    * **LETRAS:** Letras (A-Z), números (0-9) y símbolos en 4 tipografías distintas (Arial, Comic Sans, Georgia, Impact).
    * **ZODIACO:** Los 12 signos astrológicos tradicionales vectorizados.
    * **EMOJIS:** Extenso catálogo de más de 380 emojis nativos del sistema ordenados por categorías.
  * **Control de Cantidades:** Selector numérico (+ / -) para definir la cantidad de fichas físicas que se ordenarán de cada diseño. Se muestra un indicador del total acumulado de fichas del pedido.
* **Lienzo Interactivo (El Canvas 2D):**
  * El usuario puede arrastrar fichas desde su inventario de fichas seleccionadas y posicionarlas en las ranuras circulares disponibles del tablero.
  * **Imantación (Snap):** Al soltar una ficha cerca de una de las ranuras circulares, esta se acopla ("snappea") automáticamente al centro de la ranura.
  * **Remoción:** Si se arrastra una ficha fuera del tablero, se quita del canvas (vuelve al inventario de previsualización).

### **3. Visualización Inmersiva: El Botón "3D"**

Para validar el producto antes de mandarlo a fabricar, se incluye un visor tridimensional interactivo:

* **Función:** Al tocar el botón **"Vista 3D"**, se abre un visor en tiempo real usando ThreeJS en un WebView premium.
* **Efecto:** Muestra el tablero personalizado de FaroTracker adherido magnéticamente sobre la superficie metálica de una puerta de heladera premium. El render refleja los colores seleccionados (Base, Acento y Texto de días), la cantidad exacta de filas del tablero, y las fichas colocadas en sus respectivas ranuras circulares. Las fichas tendrán relieve real y su color de fondo coincidirá con el del tablero.
* **Propósito:** Validar la composición, contraste y profundidad del conjunto antes de la compra.

### **4. ADN y Reglas de Producción**

* **Curaduría Cromática:** Colores de fondo del tablero y fichas fijos para asegurar armonía y factibilidad de extrusión de plástico/imán.
* **Fidelidad Técnica:** El diseño del tablero se compone en vista ortogonal 2D para garantizar precisión geométrica, dejando el 3D únicamente para validación visual de profundidad.

# Flujo de Pantallas

### **P1. Pantalla de Inicio (The Hub)**
* **Acción A:** Botón destacado: **"Crear Tablero (Studio)"** (Ingreso al Modo Creación con modal de T&C inicial).
* **Acción B:** Botón: **"Modelos Listos (Catálogo)"** (Ver tableros y sets prediseñados).
* **Acción C:** Icono de "Mis Pedidos" en el pie de página.

### **P2. Pantalla de Catálogo (Línea de Autor)**
* Galería vertical de modelos temáticos prediseñados. Al seleccionar uno, se accede a una pantalla de detalle con fotos del set físico y el visor 3D con la configuración por defecto para su compra directa.

### **P3. Taller de Composición (El Canvas 2D)**
* Área de diseño dividida en dos secciones principales:
  1. **Tablero Interactivo (7 x N slots):** Render ortogonal del tablero donde se pueden colocar, mover y retirar las fichas en sus respectivos días. Controles para agregar/quitar filas y selectores de color para Base, Acento y Texto.
  2. **Configurador del Pack de Fichas:** Panel inferior o pestaña que permite navegar por el catálogo de iconos, agregarlos al set físico y ajustar la cantidad de cada uno.
* Botón flotante **"Vista 3D"** para activar la previsualización del tablero en la heladera.

### **P4. Ficha Técnica y Resumen del Pedido**
* **Resumen Visual:** Vista del tablero tal como fue preconfigurado.
* **Desglose del Pedido:** Detalle de colores, cantidad de filas, desglose de fichas seleccionadas y cantidad de cada una.
* **Precio del Pedido:** Cálculo de precio estático (funcionalidad de precio dinámico reservada para fases futuras).
* **Cálculo de Envío:** Cotización postal integrada para Correo Argentino.

### **P5. Checkout y Compra Exitosa**
* Formulario de pago simulado e integración de subida del pedido a FaroTracker.
* Botón **"Compartir diseño"** para exportar el tablero personalizado como imagen PNG.


