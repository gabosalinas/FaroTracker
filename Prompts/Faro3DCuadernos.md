# Documento Maestro

## **Proyecto: App Faro 3D (Documento Maestro)**

La App Faro 3D es una plataforma de diseño y compra que traslada la estética técnica, minimalista y táctil de la marca al dispositivo del cliente.

### **1. El Catálogo (Línea de Autor)**

Sección para la compra de cuadernos pre-diseñados por **Faro 3D**.

* **Contenido:** Colecciones icónicas como **Medicina, Ingeniería, Art**, etc.  
* **UX:** Navegación fluida tipo galería; el cliente elige un modelo y accede directamente al checkout con un diseño ya optimizado por la marca.

### **2. El Modo Creación (Línea Studio)**

Experiencia interactiva de co-diseño modular para la tapa y la contratapa del cuaderno.

* **Términos y Condiciones:** Al ingresar al taller por primera vez, el usuario debe leer y aceptar los términos y condiciones detallados (blindaje de copyright, garantía obligatoria de 6 meses y exclusión de arrepentimiento según Art. 1116 CCyC de Argentina) haciendo scroll completo hasta el final del documento para habilitar el botón de aceptación.
* **Persistencia de Estado:** El editor inicia limpio en su primera ejecución. Una vez que el usuario interactúa, los lienzos recuerdan automáticamente cómo fueron dejados (usando persistencia en `AsyncStorage` y un protector de carga para evitar parpadeos visuales al abrir la app).
* **Configuración Cromática:** Elección rápida y moderna de colores para el marco (**Base**) y el fondo (**Lienzo**) mediante un modal selector de colores.
* **Composición y Galería:** Un catálogo organizado de 659 recursos agrupados por solapas para una búsqueda cómoda:
  * **DIBUJOS:** Diseños genéricos (animales, monumentos, paisajes, memes y objetos cotidianos) diseñados bajo estrictas reglas de MakerWorld (2D plano, vista 100% frontal, sin perspectiva ni sombras y 4 colores sólidos para una extrusión limpia).
  * **LETRAS:** Letras (A-Z), números (0-9) y símbolos en 4 tipografías distintas (Arial, Comic Sans, Georgia, Impact).
  * **ZODIACO:** Los 12 signos astrológicos tradicionales vectorizados.
  * **EMOJIS:** Extenso catálogo de más de 380 emojis nativos del sistema ordenados por categorías.
* **Herramientas de Edición:** Capacidad de tener hasta 5 stickers por cara.
  * **Interacción Precisa:** Zona de selección compacta de 80x80 píxeles.
  * **Movimiento:** Arrastrar (Drag & Drop) en el lienzo (al desplazar más del 80% del sticker fuera del área de diseño se ofrece confirmación para eliminarlo).
  * **Rotación:** Giro de +45° al tocar un sticker ya seleccionado.
  * **Escala:** Long-press rápido para ciclar el tamaño.
  * **Alturas:** Selector individual de relieve ("Nivel Lienzo" o "Sobre Relieve") para cada icono.

### **3. Visualización Inmersiva: El Botón "3D"**

Para romper la bidimensionalidad del diseño técnico, se incluye una función de previsualización avanzada:

* **Función:** Al tocar el botón **"Vista 3D"**, la app genera un render interactivo tridimensional en tiempo real usando ThreeJS en un WebView premium.  
* **Efecto:** El usuario puede rotar el cuaderno en 360°, apreciar el grosor de la tapa, la textura, los reflejos del metal y el sombreado físico real de los elementos configurados en "Sobre Relieve".  
* **Propósito:** Validar la profundidad y el juego de sombras físicas antes de confirmar el pedido.

### **4. ADN y Reglas de Producción**

* **Curaduría Cromática:** Colores de iconos fijos para asegurar armonía y factibilidad.  
* **Colores Sólidos:** Sin gradientes; la riqueza visual reside en el relieve y la combinación de colores planos.  
* **Fidelidad Técnica:** El diseño se realiza en vista ortogonal para precisión, y el 3D se usa solo como instancia de validación estética.

# Flujo de Pantallas

## **Flujo de Pantallas: Faro 3D App**

### **P1. Pantalla de Inicio (The Hub)**

Es la puerta de entrada. Limpia, minimalista, con el logo de Faro 3D.

* **Acción A:** Botón destacado: **"Modo Creación"** (Crea tu propio diseño, con el modal de T&C inicial).  
* **Acción B:** Botón: **"Catálogo de Autor"** (Ver colecciones cerradas).  
* **Acción C:** Icono de "Mis Pedidos" en el pie de página.

### **P2. Pantalla de Catálogo (Línea de Autor)**

Navegación tipo galería vertical con scroll infinito de cards con fotos reales del producto terminado. Al tocar un producto, se abre la ficha de detalle para proceder a la compra.

### **P3. Taller de Composición (El "Canvas")**

Espacio principal de diseño en 2D donde se componen la tapa y contratapa. Contiene el lienzo interactivo, la barra de herramientas de edición de stickers y el selector de galería organizado en solapas. Flotando se encuentra el botón de "Vista 3D" para abrir el visor inmersivo.

### **P4. Ficha Técnica y Envío (Preparación)**

Antes del pago, el usuario completa sus datos:
* **Resumen Visual:** Tapa y Contratapa lado a lado.
* **Cálculo de Envío:** Validación postal en tiempo real (con cotizador para Correo Argentino y tarifa plana de contingencia).
* **Ficha Técnica:** Detalle de colores, stickers y cantidad de relieves.

### **P5. Checkout y Éxito**

* Formulario de pago simulado e integración de subida del pedido a Faro 3D.

### **![][image1]**


