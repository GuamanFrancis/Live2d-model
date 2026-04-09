# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack Tecnológico

Para la visualización e interacción de modelos Live2D en un entorno web, es imperativo seleccionar una base tecnológica que equilibre el rendimiento (framerate alto, bajo consumo de recursos) con la facilidad de mantenimiento y el tiempo de desarrollo. A continuación, se evalúan las principales opciones:

*   **WebGL puro:** Ofrece el máximo control y rendimiento al interactuar directamente con la API gráfica del navegador. Sin embargo, carece de abstracciones de alto nivel, lo que resulta en un código base extenso, complejo y muy difícil de mantener. El tiempo de desarrollo sería prohibitivo.
*   **SDK oficial de Cubism (para Web):** Proporciona las herramientas base de Live2D, pero su implementación web (Cubism Web Framework) sigue requiriendo un manejo considerable de WebGL a bajo nivel. Aunque es la fuente original, su integración con otros elementos interactivos de la UI puede ser engorrosa.
*   **Three.js:** Es el estándar de facto para 3D en la web. Aunque es posible integrar Live2D dentro de escenas de Three.js, Live2D es fundamentalmente una tecnología 2D (texturas mapeadas en mallas planas). Utilizar un motor 3D completo añade un *overhead* innecesario que impacta el rendimiento y el tamaño final de la aplicación.
*   **PixiJS + pixi-live2d-display:** PixiJS es un motor de renderizado 2D ultra rápido basado en WebGL. Al combinarlo con la librería `pixi-live2d-display`, obtenemos un entorno ideal. Esta librería actúa como un puente robusto, abstrayendo la complejidad del SDK de Cubism y permitiendo tratar los modelos Live2D como objetos de visualización (DisplayObjects) nativos de PixiJS.

**Elección Recomendada: PixiJS + pixi-live2d-display.**
*Justificación:* Es la solución más robusta y balanceada. Permite un renderizado 2D de altísima fidelidad aprovechando WebGL, mientras que `pixi-live2d-display` maneja de manera impecable la carga de assets y las físicas del SDK 4.0+. El código resultante es limpio, modular y altamente mantenible.

---

## 2. Arquitectura de Carga de Assets

Una arquitectura escalable para la gestión de assets (ficheros `.moc3`, texturas, físicas y animaciones) requiere organizar los datos y delegar responsabilidades. Dado que Live2D utiliza un archivo manifiesto (`.model3.json`), la arquitectura debe aprovecharlo.

### Estructura Lógica de Directorios
Se recomienda organizar los assets por modelo/personaje y variante (skin):
```text
/assets
  /models
    /personaje_A_default
      personaje_A.model3.json  <-- Archivo manifiesto (Punto de entrada)
      personaje_A.moc3         <-- Modelo compilado
      /textures                <-- Texturas mapeadas
        texture_00.png
      /motions                 <-- Animaciones (.motion3.json)
        idle.motion3.json
        touch.motion3.json
      personaje_A.physics3.json <-- Físicas
```

### Proceso de Carga Escalable
1.  **Indexación:** Utilizar el `.model3.json` como punto de entrada único. Este archivo contiene las rutas relativas a todos los componentes del modelo (moc3, texturas, físicas, motions).
2.  **Carga Asíncrona (Lazy Loading):** Implementar un gestor de carga (Asset Manager) que descargue primero el `.model3.json`. A partir de él, descargar en paralelo las texturas pesadas y el `.moc3`.
3.  **Caché:** Aprovechar la caché del navegador y, para aplicaciones complejas, usar `Cache API` (Service Workers) para almacenar en caché los archivos `.moc3` y `.png` y evitar peticiones de red redundantes.

---

## 3. Sistema de Animación e Interacción

Para que el modelo "cobre vida", necesitamos integrar reacciones al entorno del usuario, específicamente el seguimiento del cursor y la reproducción fluida de animaciones (motions).

### Seguimiento del Cursor (Eye/Head Tracking)
En lugar de manipular manualmente los parámetros de los huesos de Live2D, utilizaremos las capacidades integradas del framework.
*   **Implementación:** Capturar los eventos globales de puntero del navegador (`pointermove`) o los eventos de interacción del canvas de PixiJS.
*   **Lógica:** Calcular la posición del cursor relativa al centro del modelo y normalizar estas coordenadas a un rango de [-1, 1]. Luego, pasar estos valores al controlador de enfoque (focus controller) del modelo, el cual interpola suavemente el movimiento de los ojos y la cabeza usando físicas interpoladas (evitando movimientos robóticos).

### Ejecución de Animaciones (Motions)
Las animaciones deben estar clasificadas por su propósito (e.g., *Idle* por defecto, *Tap/Touch* para interacciones).
*   **Grupos de Animación:** Definir grupos en el archivo `.model3.json` (ej. "Idle", "TapBody").
*   **Gestor de Estados:** El modelo debe reproducir automáticamente animaciones aleatorias del grupo "Idle" cuando no hay interacción.
*   **Interacciones (Hit Testing):** Configurar zonas de impacto (Hit Areas). Al detectar un evento `pointerdown` en una zona específica, se interrumpe suavemente el "Idle" y se reproduce una animación de reacción usando el gestor interno de animaciones del modelo (`model.motion("TapBody")`), el cual maneja el *blending* y la transición cruzada entre la animación actual y la nueva sin saltos bruscos.