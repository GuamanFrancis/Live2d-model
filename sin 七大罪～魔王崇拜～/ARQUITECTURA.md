# Arquitectura y Diseño para Visualización de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack

Para implementar una solución de renderizado Live2D altamente profesional, orientada a entornos web, hemos analizado las siguientes opciones principales:

*   **SDK Oficial de Cubism (WebGL puro):** Otorga el máximo control, pero requiere una alta inversión de tiempo en la gestión manual de WebGL (buffers, shaders, matrices) y el manejo de ciclos de vida. Dificulta la escalabilidad y es menos mantenible para equipos que requieren iteraciones ágiles.
*   **Three.js:** Excelente para el desarrollo 3D general, pero su integración con Live2D (principalmente una tecnología 2D avanzada) muchas veces añade complejidad innecesaria (over-engineering) y requiere puentes complejos para mapear los recursos de Live2D al pipeline de renderizado de Three.js.
*   **PixiJS + pixi-live2d-display:**
    *   *Justificación de elección:* PixiJS es el framework 2D líder con soporte robusto para WebGL, ofreciendo un altísimo rendimiento. La integración con `pixi-live2d-display` es el estándar actual de facto para entornos web, ofreciendo un equilibrio perfecto entre **alta fidelidad visual**, **rendimiento nativo de GPU** y **fácil mantenimiento**.
    *   *Soporte de versiones:* Se usa el `cubismcore` oficial de Live2D combinado con los bindings para Cubism 4 de `pixi-live2d-display`, garantizando compatibilidad con modelos `.moc3` actuales.

## 2. Arquitectura de Carga (Asset Management)

Para una gestión escalable, los assets deben cargarse de forma asíncrona, desacoplando la definición de los recursos de la lógica de la aplicación:

*   **Punto Único de Entrada (.model3.json):** Este fichero actúa como un manifiesto. En lugar de cargar manualmente archivos individuales, nuestra aplicación se limitará a proveer la URI de este archivo.
*   **Gestor de Carga Asíncrona (Loader):** `pixi-live2d-display` dispone de un manejador integrado de carga en lotes, optimizado para recuperar el `.moc3`, las texturas en múltiples canales y los ficheros de física y movimientos basándose en las referencias del `model3.json`.
*   **Manejo de Errores y Estados:** Implementar "loading states" o "splash screens" en la interfaz de usuario mientras la promesa principal de inicialización (`Live2DModel.from`) se resuelve, lo que previene problemas de renderización con mallas vacías.
*   **Codificación de Rutas:** Dado que las estructuras de carpetas en juegos asiáticos pueden contener espacios y caracteres especiales, se debe asegurar que las URIs pasen siempre por una codificación adecuada (como `encodeURI`).

## 3. Sistema de Animación e Interacción

El éxito visual de Live2D depende de su capacidad de respuesta dinámica:

*   **Seguimiento de Cursor (Eye/Head Tracking):**
    *   La biblioteca maneja esto *out-of-the-box* usando eventos del canvas. Las propiedades del foco (donde el usuario apunta o hace touch) se inyectan en los parámetros de Cubism (e.g., `ParamAngleX`, `ParamEyeBallX`).
    *   *Nota Arquitectónica:* Evite inyectar coordenadas de píxeles manualmente en el controlador de enfoque a menos que sea estrictamente necesario. Las actualizaciones automáticas acopladas al ciclo global (Ticker) de Pixi son más performantes.
*   **Gestión de "Motions" (Animaciones):**
    *   Las animaciones pre-configuradas en el SDK suelen venir agrupadas en el `.model3.json` (por ejemplo, el grupo `""`, o `TapBody`).
    *   Para desencadenar las respuestas, se conectará el evento de interacción del modelo (ej. evento `pointertap` del framework Pixi) a la llamada de reproducción de animaciones usando un índice aleatorio o secuencial: `model.motion('GroupName', index)`.
    *   El modelo debe manejar transiciones suaves y cross-fades para evitar "saltos" en los vértices durante la reproducción.

## 4. Estructura de la Prueba de Concepto (PoC)

Se acompañará un archivo `index.html` sirviendo como demostración minimalista de estas directrices. El PoC demostrará:
- Carga de dependencias mediante CDN (`live2dcubismcore`, `pixi.js@6`, `cubism4.min.js`).
- Inicialización del ciclo de vida de la aplicación con Pixi Application.
- Manejo reactivo de la geometría (Redimensionado basado en valores intrínsecos `internalModel`).
- Desencadenado de una animación interactiva on-click.
