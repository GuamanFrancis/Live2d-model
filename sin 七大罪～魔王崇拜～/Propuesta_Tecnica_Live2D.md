# Consultoría Técnica para Implementación de Modelos Live2D (SDK 4.0+)

**Documento de Arquitectura y Propuesta Técnica**

## 1. Análisis de Stack

Para lograr renderizar modelos Live2D de la mejor calidad con un enfoque mantenible y de alto rendimiento en la web, propongo utilizar la siguiente combinación de tecnologías:

*   **Renderizador base: PixiJS (v6)**
    *   *Justificación:* PixiJS es el framework 2D líder en rendimiento web, optimizado para WebGL. La versión 6.x proporciona máxima estabilidad en todos los navegadores modernos sin sufrir problemas iniciales de WebGL vistos en librerías más experimentales o antiguas.

*   **Librería Live2D: pixi-live2d-display**
    *   *Justificación:* Es el mejor puente existente entre PixiJS y Live2D. Abstrae la extrema complejidad del SDK oficial (Cubism SDK Web), soportando modelos de versiones recientes (Cubism 4.0+) mientras expone los modelos de manera nativa como `DisplayObjects` de PixiJS.
    *   *Nota:* Se incluye el núcleo oficial `live2dcubismcore.min.js` junto con la variante de compilación `cubism4.min.js` del paquete (en lugar de dependencias inestables o versiones beta, garantizando la existencia de `Live2DModel`).

## 2. Arquitectura de Carga (Escalabilidad de Assets)

Dado que los archivos Live2D consisten en un archivo principal JSON (`.model3.json`) que enlaza de manera frágil las mallas `.moc3`, las texturas en subcarpetas y las mociones, propongo el siguiente patrón:

1.  **Directorio Centralizado por Personaje (Componentización):** Cada modelo mantiene su estructura interna intacta (ej: `xch001_01/`), alojando todo lo referido al personaje localmente. Esto previene conflictos de nombres.
2.  **Resolución de URLs y Rutas Relativas:** La aplicación inicializa los modelos pasándoles la ruta principal al `.model3.json`. Usar `encodeURI()` es obligatorio durante la inicialización para prevenir fallos al recuperar subrutas si existieran caracteres especiales o espacios.
3.  **Carga Diferida (Lazy Loading) o Paralela:** Para escalabilidad si hubieran múltiples personajes, los modelos pueden instanciarse dinámicamente llamando a un `ModelManager` encargado del cacheo. `pixi-live2d-display` hace una excelente gestión de promesas internamente (`Live2DModel.from()`).

## 3. Sistema de Animación e Interacción

*   **Seguimiento del Cursor (Eye/Head Tracking):**
    *   La ventaja del stack propuesto es que `pixi-live2d-display` incluye seguimiento de puntero listo para usarse. Por defecto, enfoca automáticamente hacia donde el ratón se mueva sobre el canvas. No es necesario pasar manualmente coordenadas de píxeles al internalModel.
*   **Gestión de Animaciones ("Motions"):**
    *   El desencadenamiento de animaciones no debe estar hardcodeado a interacciones de bajo nivel. En lugar de eso, la librería las agrupa bajo nombres (como `""`, `"TapBody"`, `"Idle"`). Al configurar la interactividad del modelo en Pixi (`model.interactive = true`), se puede capturar el evento `pointerdown` nativo y ejecutar `model.motion('', index)` de forma controlada.

## 4. Código Base (PoC)

El código fuente demostrativo "Proof of Concept" (PoC) para esta arquitectura consta de:
*   `index.html`: Carga las dependencias mediante CDN de forma segura.
*   `js/Live2DApp.js`: Abstracción orientada a objetos de la inicialización de WebGL, el modelo Live2D, su re-escalado automático y eventos de tap.
*   `css/styles.css`: CSS mínimo para asegurar el encuadre completo.
