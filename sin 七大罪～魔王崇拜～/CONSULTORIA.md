# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+) en Entorno Web

**A:** Equipo de Desarrollo / Stakeholders
**De:** Arquitecto de Software Senior
**Asunto:** Análisis de Stack Técnico y Propuesta de Arquitectura para Live2D

---

## 1. Análisis de Stack Técnico

La renderización de modelos Live2D (especialmente aquellos basados en SDK 4.0+ mediante ficheros `.model3.json`) en un entorno web requiere una interacción directa con la GPU para mantener una alta fidelidad visual y 60 FPS consistentes.

Las opciones principales evaluadas son:

1. **WebGL Puro / Cubism Web Framework Oficial:** Ofrece el máximo control y menor overhead, pero la curva de aprendizaje y el coste de mantenimiento son extremadamente altos. La gestión manual de buffers, shaders y redibujado de texturas reduce drásticamente la agilidad del desarrollo.
2. **Three.js:** Es el estándar de facto para 3D en la web. Existen wrappers para Live2D, pero acoplar un motor 2D complejo dentro de un pipeline puramente 3D añade un overhead innecesario y complicaciones en el manejo del viewport y las cámaras ortográficas si el proyecto es puramente 2D.
3. **PixiJS + `pixi-live2d-display` (Stack Recomendado):** PixiJS es el motor de renderizado 2D más rápido y robusto basado en WebGL. Al combinarlo con la librería `pixi-live2d-display`, obtenemos una abstracción de alto nivel sumamente potente.

**Justificación de la Elección (PixiJS + pixi-live2d-display):**
* **Compatibilidad Inmediata:** Soporta de forma transparente los modelos Cubism 4.0 (`.model3.json`).
* **Rendimiento:** PixiJS optimiza por defecto las llamadas de dibujado (draw calls) y la gestión de texturas.
* **Mantenibilidad:** Reduce miles de líneas de código WebGL a unas pocas llamadas a una API declarativa y orientada a objetos (`Live2DModel`). El modelo hereda de `PIXI.Container`, permitiendo aplicar transformaciones, filtros y máscaras como cualquier otro elemento de UI.

**Nota Crítica de Entorno:**
Para garantizar la compatibilidad (incluso en entornos de pruebas *headless* con renderizadores por software como SwiftShader), se recomienda utilizar **PixiJS versión 6.x** e importar la versión no-beta y específica para Cubism 4 de `pixi-live2d-display` (`cubism4.min.js`), junto con el núcleo oficial de Cubism (`live2dcubismcore.min.js`).

---

## 2. Arquitectura de Carga de Assets

Una arquitectura escalable para la gestión de ficheros (`.moc3`, texturas, animaciones) debe evitar la saturación del hilo principal y de la red. Propongo el siguiente patrón:

1. **Estructura de Directorios Aislada:** Cada modelo debe contener sus propios directorios relativos en la jerarquía (ej. `xch001_01/motions`, `xch001_01/textures`), orquestados siempre por el `.model3.json` principal, el cual actúa como manifiesto.
2. **Carga Asíncrona (Lazy Loading):** Los modelos deben instanciarse únicamente cuando vayan a entrar en el viewport de la aplicación.
3. **Encoding de Rutas:** Es imperativo procesar las URLs con `encodeURI()` para asegurar la resolución de paths que contengan espacios o caracteres especiales (como caracteres asiáticos en títulos de juegos).
4. **Capa de Abstracción (Wrapper):**
   Se recomienda crear una clase `Live2DViewer` o un Singleton de Factory que encapsule la lógica de instanciación:
   * Inicializar el canvas de PixiJS y su Application.
   * Invocar `Live2DModel.from(url)` para delegar el parseo de texturas, ficheros `.moc3` y configuraciones físicas al framework, manteniendo el código limpio de promesas complejas y de la reconstrucción manual del grafo de assets.

---

## 3. Sistema de Animación e Interacción

El comportamiento y la respuesta visual son clave para la sensación de "vida".

**Seguimiento del Cursor (Eye/Head Tracking):**
* Una de las ventajas de `pixi-live2d-display` es que el tracking del cursor está **integrado y activado por defecto**. El controlador interno (`focusController`) recalcula e interpola automáticamente las normales para girar la cabeza y la vista hacia las coordenadas del cursor (o el evento *touch* en móviles). No es necesario realizar la conversión matemática manual de los pixeles de pantalla al espacio local del modelo.

**Ejecución de "Motions" (Animaciones Fluidas):**
* El sistema de eventos del modelo debe estar habilitado estableciendo `model.interactive = true;` y `model.buttonMode = true;`.
* Las animaciones se pueden despachar simplemente llamando a `model.motion('GroupName', index)`.
* Para un modelo básico sin grupos predefinidos complejos (grupo `""`), la activación puede encadenarse al evento `pointertap`.
* El uso de `model.anchor.set(0.5, 0.5)` permite centrar el pivote del modelo, facilitando su ubicación en el centro de la pantalla independientemente del tamaño base. Además, el escalado debe calcularse usando `model.internalModel.width / height` para asegurar las proporciones.

---

## 4. Código Base (Proof of Concept)

Se adjunta un archivo `index.html` en la raíz de esta carpeta que implementa esta arquitectura de forma minimalista, sirviendo como punto de partida para componentes más avanzados.

El PoC incluye:
1. Inyección de las dependencias clave (PIXI, Cubism Core y Live2D Display).
2. Configuración robusta del Renderer WebGL.
3. Carga limpia del modelo y vinculación de eventos de interacción.
4. Auto-ajuste de escala.
