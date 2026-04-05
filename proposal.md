# Propuesta Arquitectónica: Visualización e Interacción de Modelos Live2D (SDK 4.0+)

Estimado cliente,

Como Arquitecto de Software Senior, he analizado detenidamente los requerimientos de su proyecto para implementar un sistema de visualización interactiva de modelos Live2D. Nuestro objetivo es lograr una fidelidad visual excepcional y un rendimiento robusto, manteniendo al mismo tiempo un código escalable y fácil de mantener. A continuación, le presento la solución técnica propuesta.

## 1. Análisis de Stack Tecnológico

Para la visualización web de modelos Live2D, tenemos varias opciones:

*   **SDK Oficial de Cubism (WebGL puro):** Ofrece el control más granular y el máximo rendimiento posible, pero requiere un desarrollo sumamente extenso y complejo (gestión de buffers, shaders, ciclo de renderizado a bajo nivel). Es muy difícil de mantener y extender.
*   **Three.js:** Es el estándar de la industria para 3D en la web. Existen integraciones para Live2D, pero a menudo son frágiles, carecen de mantenimiento o añaden una sobrecarga innecesaria al renderizar en un entorno 3D completo lo que esencialmente es un asset 2D avanzado.
*   **PixiJS + pixi-live2d-display:** PixiJS es un motor de renderizado 2D ultra-rápido basado en WebGL. La librería `pixi-live2d-display` proporciona un puente directo, altamente optimizado e idiomático entre el SDK oficial de Cubism (Core) y PixiJS.

**Decisión Arquitectónica:** Selecciono **PixiJS + `pixi-live2d-display`**.
*   **Justificación:** Esta combinación nos proporciona la aceleración por hardware de WebGL a través de la API intuitiva y bien documentada de PixiJS, abstrayendo la complejidad matemática de OpenGL. `pixi-live2d-display` encapsula magistralmente la carga, el manejo de texturas y el ciclo de actualización del SDK de Cubism, resultando en un código limpio, conciso y mantenible. Para asegurar compatibilidad con modelos modernos (SDK 4.0+), cargaremos los bundles `live2dcubismcore.min.js` y `cubism4.min.js`.

## 2. Arquitectura de Carga de Assets

El ciclo de vida de carga debe ser asíncrono y resiliente, especialmente al tratar con múltiples dependencias (texturas, moc3, physics, motions).

1.  **Ingesta de Configuración:** El punto de entrada será el archivo `.model3.json`. Este archivo actúa como un manifiesto, detallando la ubicación de la geometría (.moc3), las texturas (.png), la configuración física (.physics3.json) y los grupos de animaciones (.motion3.json).
2.  **Resolución de URIs (Sanitización):** Un punto crítico a nivel arquitectónico. Los paths definidos en los archivos `.model3.json` (especialmente aquellos extraídos de juegos asiáticos) frecuentemente contienen espacios o caracteres no-ASCII. Implementaremos una capa de sanitización utilizando `encodeURI()` para asegurar resoluciones de red correctas sin errores `404 Not Found`.
3.  **Carga Paralela Asíncrona:** La librería `pixi-live2d-display` maneja internamente la carga mediante `PIXI.Loader`. Inicia la carga del `.moc3`, y en paralelo lanza peticiones para todas las texturas y configuraciones.
4.  **Instanciación del Modelo:** Una vez resueltas las dependencias críticas (geometría y texturas), se instanciará el objeto `Live2DModel` en el Scene Graph de PixiJS. Se calculará el tamaño usando las propiedades internas base (`model.internalModel.width`/`height`) para un escalado sin distorsión.

## 3. Sistema de Animación e Interacción

El objetivo es lograr un comportamiento orgánico y reactivo ("cobrar vida").

*   **Eye/Head Tracking (Seguimiento del Cursor):** Interceptaremos los eventos de movimiento del puntero (`pointermove`) en el Canvas de PixiJS. Las coordenadas de la pantalla se mapearán al espacio de coordenadas locales del modelo, alimentando el controlador de `focus` del `Live2DModel`. El núcleo de Cubism interpolará suavemente estos valores sobre los parámetros del modelo (ej. `ParamAngleX`, `ParamEyeBallX`), generando una rotación fluida de la cabeza y los ojos hacia el cursor.
*   **Ejecución de "Motions" (Animaciones):** Mapearemos las interacciones (ej. eventos de `pointerdown` / click) a las listas de animaciones (groups) definidas en el `.model3.json` (usualmente grupos como "tap_body" o genéricos como "idle"). Invocaremos los motions usando la API de la librería, asegurando transiciones suaves entre el estado neutral y las animaciones de respuesta.

## 4. Implementación del Proof of Concept (PoC)

He desarrollado un PoC minimalista y funcional en el archivo `index.html` del directorio raíz, que ilustra esta arquitectura en la práctica usando el modelo solicitado (`xch001_01`).

*   **Estructura:** Carga las dependencias mediante CDNs (PixiJS, Core de Cubism y el display plugin).
*   **Lógica (`app.js` embebido):** Demuestra la instanciación asíncrona, el manejo de URI encoding para los assets, el seguimiento dinámico del puntero y la respuesta interactiva (animaciones aleatorias) al hacer clic en el modelo. El redimensionamiento se maneja calculando un factor de escala relativo a las dimensiones inalteradas del modelo interno para prevenir distorsiones.

Quedo a su entera disposición para debatir esta propuesta técnica y afinar los detalles para las siguientes fases de desarrollo.

Atentamente,
El Arquitecto de Software Senior
