# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+)

Hola, es un placer saludarte y acompañarte en la creación de tu proyecto. Lograr una visualización fluida e inmersiva con modelos Live2D requiere una base técnica sólida. A continuación, presento mi propuesta de arquitectura, análisis de stack y gestión de assets para garantizar alto rendimiento y facilidad de mantenimiento.

---

## 1. Análisis de Stack Técnico

Para el renderizado de Live2D, existen varias opciones en el entorno web. Tras evaluarlas, esta es mi recomendación:

### Opciones evaluadas:
1. **WebGL puro (con el SDK oficial de Cubism)**: Es el enfoque más a bajo nivel. Aunque otorga máximo control, es altamente complejo de mantener, requiere gestionar buffers, shaders, ciclo de dibujado y matemáticas matriciales manualmente.
2. **Three.js**: Excelente para entornos 3D, pero al integrarlo con modelos 2D como Live2D añade un *overhead* (sobrecarga de procesamiento) innecesario.
3. **PixiJS + pixi-live2d-display**: PixiJS es el motor 2D basado en WebGL más rápido y maduro de la web. `pixi-live2d-display` es una librería que envuelve el Cubism SDK y abstrae toda la complejidad de carga de archivos y renderizado.

### Elección Recomendada: **PixiJS (v6) + `pixi-live2d-display` (Cubism 4)**
**Justificación:**
* **Rendimiento:** PixiJS está altamente optimizado para gráficos 2D por lotes (batching), lo que minimiza las llamadas de dibujo (draw calls) en la GPU.
* **Mantenibilidad:** `pixi-live2d-display` se encarga del parseo de archivos `.moc3`, `.model3.json` y de los sistemas de físicas nativos. El código necesario se reduce de cientos de líneas en WebGL puro a apenas ~15 líneas de código.
* **Compatibilidad SDK 4.0+:** Utilizando los bundles específicos (`live2dcubismcore.min.js` y `cubism4.min.js`), el ecosistema da soporte completo y sin errores de runtime a los últimos modelos exportados.

---

## 2. Arquitectura de Carga y Gestión de Assets

El principal reto de Live2D es que un único modelo está fragmentado en decenas de archivos (`.moc3`, texturas PNG, archivos de físicas `.physics3.json` y múltiples animaciones `.motion3.json`).

Para un entorno escalable, recomiendo esta arquitectura lógica:

1. **Estructura de Directorios Aislada:**
   Cada modelo debe residir en su propia carpeta (ej. `xch001_01/`), conteniendo su archivo maestro `.model3.json`. Todos los paths dentro de este JSON deben ser relativos a su directorio.
2. **Carga Asíncrona bajo Demanda (Lazy Loading):**
   Las texturas y el archivo estructural `.moc3` se cargan primero (`Live2DModel.from()`). Las animaciones (`motions`) pesadas no deben precargarse en memoria de inicio, sino cuando el usuario interactúe y solicite dicha acción, delegando esto al gestor interno de la librería.
3. **Servidor HTTP Local / CDN:**
   **Crucial:** No se pueden cargar estos assets utilizando el protocolo `file://` debido a políticas estrictas de CORS del navegador. Los assets deben servirse mediante un servidor HTTP local durante el desarrollo (ej. `python3 -m http.server`) y mediante un CDN (Content Delivery Network) o un bucket S3 en producción.

---

## 3. Sistema de Animación e Interacción

Para que el modelo se sienta "vivo", abordaremos dos pilares: Tracking e Interacciones.

### Seguimiento del Cursor (Eye / Head Tracking)
El motor de físicas del Cubism SDK cuenta con parámetros predefinidos para los ángulos (`ParamAngleX`, `ParamAngleY`, `ParamEyeBallX`, etc.).
* **Implementación:** Al detectar el evento `pointermove` (movimiento del ratón o toque en pantalla) sobre el Canvas de Pixi, pasaremos las coordenadas (normalizadas) a la función nativa `model.focus(x, y)`. El modelo ajustará suavizadamente la cabeza y mirada hacia esa posición usando interpolación matemática interna.

### Ejecución de Animaciones (Motions)
Los archivos `.motion3.json` dictan el comportamiento.
* **Implementación:** `pixi-live2d-display` gestiona "Hit Areas" (Áreas de colisión) definidas en el editor Live2D. Capturando el evento `hit`, evaluamos si el usuario hizo clic en `Head` o `Body` para lanzar animaciones de saludo, enojo o toques genéricos llamando al método `model.motion('nombre_grupo_motion')`.

---

## 4. Código Base (Proof of Concept)

En la carpeta actual he depositado dos archivos funcionales que ilustran esta arquitectura de manera minimalista:
1. `index.html`: Carga el canvas y las dependencias (PixiJS, live2dcubismcore, y pixi-live2d-display) optimizadas para SDK 4.0+.
2. `app.js`: Implementa la inicialización de `PIXI.Application`, carga el modelo `.model3.json` de manera asíncrona, gestiona el re-escalado automático, implementa el head-tracking continuo con el puntero del mouse (`pointermove`) y ejecuta animaciones al cliquear.

*(Puedes levantar un servidor HTTP en este directorio para previsualizar el resultado en tu navegador).*