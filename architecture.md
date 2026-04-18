# Análisis y Propuesta Arquitectónica para Implementación de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack

### Opciones evaluadas:
1. **SDK oficial de Cubism (Web):** Es robusto y oficial, pero de bajo nivel. Requiere escribir mucha lógica "boilerplate" (rutinas repetitivas) para inicializar WebGL, manejar el ciclo de renderizado, interacciones de ratón y el loop de animaciones. No es ideal para iteración rápida ni escalabilidad a menos que se invierta considerable tiempo creando un "wrapper" propio.
2. **WebGL Puro:** Demasiado verboso para este propósito. Implica construir el pipeline de renderizado completo desde cero, lo que va en contra del principio de "facilidad de mantenimiento".
3. **Three.js:** Excelente para 3D, pero en el contexto del ecosistema 2D de Live2D suele estar sobredimensionado y requiere adaptadores no oficiales complejos para integrar modelos Live2D, con soporte dispar para SDK 4.0.
4. **PixiJS + pixi-live2d-display:** PixiJS es el estándar de la industria en la web para el renderizado acelerado por hardware 2D (WebGL). Combinado con la librería comunitaria madura `pixi-live2d-display` (que abstrae directamente el SDK oficial subyacente), ofrece un excelente equilibrio.

### Elección recomendada: PixiJS + `pixi-live2d-display`
**Justificación:**
* **Mantenibilidad:** PixiJS maneja la complejidad de WebGL (contextos, texturas, shaders). `pixi-live2d-display` encapsula la carga asíncrona y la vinculación de eventos de los modelos. Esto permite enfocarse en la experiencia de usuario y no en la fontanería de los gráficos.
* **Soporte SDK 4.0+:** `pixi-live2d-display` soporta las versiones 2, 3 y 4+ de Cubism cargando los módulos núcleo correspondientes (`live2dcubismcore.min.js` y `cubism4.min.js`).
* **Rendimiento:** Está probado en producción y aprovecha el batching y la gestión de memoria eficiente de Pixi.

*(Nota sobre versiones)*: En entornos de testeo / headless automatizados, **PixiJS v6** suele ser más estable para prevenir conflictos de contexto de WebGL frente a la reescritura masiva de renderizado en PixiJS v7, por lo que usaremos la rama 6.x en nuestra Prueba de Concepto.

## 2. Arquitectura de Carga (Escalabilidad)

Para soportar múltiples modelos (o el mismo modelo con variaciones), el gestor de assets debe ser **asíncrono y centralizado**:

1. **Gestor de Instancias (Pool):** No debemos tener modelos "sueltos". Un módulo principal debe mantener un diccionario o mapa de instancias Live2D activas referenciadas por ID.
2. **Carga en Diferido (Lazy Loading):** Los ficheros (`.model3.json`, `.moc3`, `.png`, `.motion3.json`) pesan varios MB. Usaremos las funcionalidades de `Live2DModel.from()` que analizan el árbol del JSON y descargan los assets de forma óptima a través de promesas.
3. **Rutas Seguras:** Las rutas de red hacia los archivos deben sanitizarse. Los nombres con caracteres especiales (como los de la carpeta *"sin 七大罪～魔王崇拜～"*) se deben pre-codificar (`encodeURI()`) antes de enviarlos a la API fetch subyacente, impidiendo errores 404 al cargar texturas o las físicas por red.

## 3. Sistema de Animación e Interacción

La integración del usuario final necesita estar ligada al ciclo de renderizado.

* **Seguimiento (Eye/Head Tracking):**
  A diferencia del SDK de Cubism directo donde manejas parámetros a mano (ej. `ParamAngleX`), `pixi-live2d-display` posee un `focusController`.
  Ataremos los eventos de movimiento de ratón o toque del canvas al gestor interno:
  `model.internalModel.focusController.focus(x, y)`
  donde `x` e `y` van de -1 a 1, relativos al centro del modelo.

* **Gestor de Eventos y Animaciones ("Motions"):**
  Los clicks del usuario en áreas genéricas ejecutarán una animación (Motion).
  Si el modelo tiene múltiples grupos de animación (ej. "Idle", "TapBody"), se invoca a través de:
  `model.motion('TapBody', indice)` o `model.motion('', indice)` si no hay grupos nombrados.
  Si una animación de "Tap" está corriendo, las animaciones de inactividad ("Idle") se detienen temporalmente de forma automática.

## Prueba de Concepto (PoC)

Se ha creado un `index.html` que inicializa:
- El entorno PixiJS.
- Las librerías core de Cubism (Live2DCubismCore).
- El plugin `pixi-live2d-display`.
- Carga el modelo "xch001_01" de forma asíncrona, ajusta su tamaño al viewport (sin distorsión), e implementa el seguimiento del cursor y un disparador de "motiones" mediante click en la pantalla.
