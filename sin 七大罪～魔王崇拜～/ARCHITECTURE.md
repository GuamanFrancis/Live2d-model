# Arquitectura Técnica para Implementación de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack

Para renderizar modelos Live2D en un entorno web de manera robusta, con alta fidelidad visual y excelente rendimiento, evaluamos las siguientes opciones:

1. **SDK Oficial de Cubism (WebGL puro):**
   - *Pros:* Es la base oficial, soporta todas las características nativas y ofrece el máximo control a bajo nivel.
   - *Contras:* La curva de aprendizaje es empinada, requiere gestionar manualmente buffers, texturas y el ciclo de renderizado de WebGL. La mantenibilidad a largo plazo se vuelve compleja en equipos que no son especialistas en gráficos.

2. **Three.js + Live2D:**
   - *Pros:* Excelente para entornos 3D.
   - *Contras:* Si el objetivo principal es renderizar 2D, Three.js añade una sobrecarga (overhead) innecesaria. La integración de Live2D con Three.js suele requerir puentes personalizados que no son estándar.

3. **PixiJS (v6.x) + pixi-live2d-display:**
   - *Pros:* PixiJS es el motor de renderizado 2D basado en WebGL más rápido y maduro del ecosistema JavaScript. La librería `pixi-live2d-display` es una envoltura (wrapper) de muy alta calidad que actúa de puente entre PixiJS y los SDKs de Live2D (soportando modelos desde SDK 2 hasta SDK 4+).
   - *Contras:* Añade dependencia a librerías de terceros, pero `pixi-live2d-display` es el estándar de facto actual de la comunidad.

**Elección Recomendada:** **PixiJS (v6.x) + pixi-live2d-display**
*Justificación:* Como Arquitecto de Software, busco el mejor equilibrio entre rendimiento y facilidad de mantenimiento. PixiJS proporciona un grafo de escena (scene graph) potente y abstrae la complejidad de WebGL, mientras que `pixi-live2d-display` gestiona transparentemente las versiones del modelo, la carga asíncrona de assets (.moc3, texturas, configuraciones .json) y el renderizado interno de Cubism. Esto nos permite centrarnos en la lógica de negocio y la interactividad, garantizando la compatibilidad con el SDK 4.0+.

---

## 2. Arquitectura de Carga (Asset Management)

Para que la aplicación sea escalable al manejar múltiples modelos (cada uno con su `.moc3`, físicas, texturas y `.motion3.json`), se recomienda una arquitectura de carga asíncrona por capas:

1. **Capa de Definición (El modelo `.model3.json`):**
   - El archivo principal `.model3.json` sirve como manifiesto. La librería leerá este archivo y automáticamente encolará la carga de las texturas, el binario `.moc3`, las expresiones y físicas.

2. **Capa de Red/Almacenamiento:**
   - Los recursos deben poder cargarse desde rutas relativas o a través de una CDN (Content Delivery Network).
   - Es crítico codificar las URLs (ej. `encodeURI(url)`) ya que las rutas de los modelos pueden contener caracteres especiales o espacios (ej. caracteres asiáticos).

3. **Capa de Instanciación Diferida (Lazy Loading):**
   - Usaremos la clase `Live2DModel.from()` que devuelve una Promesa. Esto nos permite mostrar indicadores de carga en la UI mientras los assets se descargan, parsean y preparan para la GPU, ofreciendo robustez a la aplicación.

4. **Escalado y Posicionamiento Seguro:**
   - Al cargar el modelo, utilizaremos las dimensiones internas originales (`model.internalModel.width` y `model.internalModel.height`) para calcular los factores de escala proporcionales a la pantalla y evitar distorsiones al redimensionar la ventana o el contenedor de PixiJS.

---

## 3. Sistema de Animación e Interacción

Para hacer que los modelos "cobren vida", el stack seleccionado nos ofrece soluciones inmediatas, integradas y de alto rendimiento:

1. **Seguimiento del Cursor (Eye/Head Tracking):**
   - `pixi-live2d-display` gestiona automáticamente la atención del modelo (focus) para rastrear el puntero del ratón o interacciones táctiles por defecto (out of the box). No es necesario calcular y pasar coordenadas manualmente a `model.internalModel.focusController.focus()`.
   - Simplemente habilitaremos las interacciones nativas y el wrapper se encarga de que los modelos respondan a la posición relativa del puntero.

2. **Sistema de "Motions" (Animaciones):**
   - La reproducción fluida de animaciones pregrabadas (.motion3.json) se controlará a través de la API `model.motion('GroupName', index)` o pasándole una cadena vacía para activar animaciones aleatorias de los grupos disponibles.
   - Esto se puede atar al gestor de eventos de Pixi (ej. el evento `pointertap`), permitiendo que el usuario toque al personaje (hit-testing si hay áreas definidas o tap general) y dispare comportamientos fluidos y reactivos de manera natural y mantenible en código.
