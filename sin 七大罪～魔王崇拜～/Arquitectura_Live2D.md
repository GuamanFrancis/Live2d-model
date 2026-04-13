# Documento de Arquitectura y Consultoría Técnica para Live2D

## 1. Análisis de Stack

### Evaluación de Opciones Actuales:

*   **SDK Oficial de Cubism (C++/TypeScript):** Robusto y es la fuente de verdad. Sin embargo, trabajar directamente con él a bajo nivel requiere gestionar shaders, buffers y matrices manualmente, lo cual ralentiza significativamente el desarrollo y el mantenimiento.
*   **WebGL Puro:** Proporciona máximo control, pero requiere reescribir desde cero los motores de renderizado y las físicas propias de Live2D, con un enorme costo de mantenimiento.
*   **Three.js:** Excelente para 3D, pero su enfoque en la tercera dimensión y grafos de escena complejos puede ser *overkill* para Live2D (que al fin y al cabo son mallas 2D superpuestas con transformaciones).
*   **PixiJS:** Es la opción líder indiscutible para renderizado 2D acelerado por WebGL. Su API es madura, la gestión del *Scene Graph* es extremadamente rápida y su adopción en la industria es masiva.
*   **Frameworks Integrados (`pixi-live2d-display`):** Combina lo mejor de PixiJS con la abstracción del SDK de Cubism.

### Selección de Stack Propuesta:

**La solución elegida es PixiJS (v6.x) en combinación con el plugin `pixi-live2d-display` (con empaquetado Cubism 4 Core).**

**Justificación:**
Como Arquitecto, la prioridad es mantener un balance entre rendimiento, tiempo de *Time-to-Market* (TTM) y mantenibilidad. Usar `pixi-live2d-display` abstrae toda la complejidad de inicializar el entorno WebGL, procesar los buffers de los modelos y conectar las físicas o las expresiones matemáticas subyacentes de Live2D. Además, al usar PixiJS v6.x (e.g., 6.5.10), garantizamos un entorno altamente estable (especialmente para entornos headless u optimizados), evitando los continuos _breaking changes_ de la incipiente v7+. Esta pila garantiza renderizado a 60FPS constantes en navegadores modernos y facilita la integración futura con interfaces de usuario en React, Vue, o VanillaJS.

---

## 2. Arquitectura de Carga y Gestión de Assets

Los modelos Live2D modernos (SDK 4.0+) se definen con un archivo principal de estructura `.model3.json`. Una arquitectura escalable debe cargar los recursos de manera perezosa (Lazy Loading) y gestionar eficientemente la VRAM.

### Diseño de la Estructura Lógica:

1.  **Directorio de Assets Consistente:** Cada modelo debe residir en su propia carpeta (ej. `[ModelName]/`), garantizando que la estructura esperada por el `.model3.json` (`textures/`, `motions/`, `expressions/`, etc.) se resuelva de forma relativa sin fallos de ruteo.
2.  **Asset Manager Centralizado (Singleton / Service):** Un servicio encargado del _caching_ de modelos. Antes de instanciar un modelo con `PIXI.live2d.Live2DModel.from(url)`, debe verificar si los assets ya están en caché para evitar la sobrecarga de la red y re-procesamiento de texturas.
3.  **Manejo de URLs Seguras:** Ya que los nombres de carpetas de personajes pueden contener caracteres no latinos (Ej. "sin 七大罪～魔王崇拜～"), el sistema de carga debe hacer uso estricto de `encodeURI()` para la resolución de rutas sobre HTTP.
4.  **Carga Asíncrona (Async/Await):** Todo el proceso, desde la carga del moc3 (estructura del modelo) hasta el parseo de animaciones y texturas, es no bloqueante. Esto previene que el hilo principal (Main Thread) del navegador se congele, mejorando el First Input Delay (FID).
5.  **Clean Up:** Debe existir un método `dispose()` explícito para cada modelo cuando la vista cambia. Esto asegurará la limpieza de texturas cargadas en la GPU y liberará la memoria de las físicas de WebAssembly.

---

## 3. Sistema de Animación e Interacción

Un modelo estático no ofrece valor diferencial; debe "vivir" en el canvas.

### Eye / Head Tracking (Seguimiento de Cursor):

El modelo debe seguir el cursor (o la vista en caso de móviles) de manera fluida y con *easing* natural para no parecer robótico.
*   **Implementación Técnica:** Se utiliza el método nativo `model.focus(x, y)`. Para ello, la aplicación escucha eventos de puntero (`pointermove`) en todo el *stage* o *hitArea* de la pantalla. El *focus* se encarga automáticamente de animar las variables de parámetros (`ParamAngleX`, `ParamAngleY`, `ParamEyeLOpen`, etc.) con una interpolación predefinida.

### Reproducción de "Motions" (Animaciones y Gestos):

El `.model3.json` define listas de animaciones (comúnmente archivos `.motion3.json`) agrupadas bajo una clave (por ejemplo: `""` por defecto, `"tap_body"`, `"idle"`, etc.).
*   **Idle Motions:** El sistema configurará automáticamente un bucle de animaciones que se reproducen de la lista "Idle" cuando no hay interacción.
*   **Trigger Animations:** Al hacer clic (`pointertap` en eventos de PixiJS), se intercepta el evento y se invoca `model.motion('GroupName')`. El motor interrumpe suavemente el "Idle", reproduce la animación deseada (ej. un saludo o reacción a toque) y regresa automáticamente a la animación "Idle" al finalizar.
*   **Hit Areas Perzonalizadas:** Para una mayor inmersión, en fases posteriores se pueden leer los polígonos del moc3 para definir *hitboxes* precisas (cabeza, cuerpo, extremidades) que desaten animaciones específicas.

---

## 4. Conclusión

Este diseño proporciona una abstracción limpia del núcleo matemático de Live2D, centrándose en el desarrollo de la Experiencia de Usuario (UX) utilizando PixiJS y cubism4. Esta estrategia minimiza las fugas de memoria, optimiza la recolección de basura del motor V8 del navegador, y mantiene el código base de la interfaz sumamente conciso y profesional. En la misma carpeta se proporciona una Prueba de Concepto (PoC) en `poc.html` demostrando este stack en vivo.