# Consultoría Técnica para Implementación de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack Técnico

Para renderizar modelos Live2D (archivos `.model3.json`, SDK 3.0/4.0+) en un entorno web moderno, existen varias opciones. A continuación se presenta el análisis y la selección de la arquitectura idónea.

### Opciones Evaluadas
1. **Cubism Web Framework (SDK Oficial de Live2D):**
   - *Pros:* Oficial, soporte inmediato para nuevas características, implementado en TypeScript puro con WebGL.
   - *Contras:* Código muy verboso y de bajo nivel (WebGL nativo). Requiere implementar el pipeline de renderizado, bucle de animación, la carga de recursos, y la gestión de texturas desde cero o usar el framework de muestra engorroso. Curva de aprendizaje empinada y mantenimiento pesado.
2. **WebGL Puro:**
   - *Pros:* Máximo control y rendimiento teórico.
   - *Contras:* Inviable por tiempos de desarrollo. Habría que reescribir la capa matemática de interpolación, IK y físicas que ya provee Live2D Core.
3. **Three.js + Live2D:**
   - *Pros:* Estándar de la industria para 3D en la web.
   - *Contras:* Live2D es estrictamente 2D. Meter el pipeline de Live2D dentro de un entorno 3D como Three.js agrega un overhead de rendimiento innecesario, complicando las proyecciones ortográficas y el control del *Z-index*.
4. **PixiJS + `pixi-live2d-display`:**
   - *Pros:* PixiJS es el framework 2D de WebGL por excelencia, optimizado para alto rendimiento (batching de texturas, shaders personalizados). `pixi-live2d-display` es una librería de primer nivel que envuelve el Cubism Core y lo integra como un objeto de despliegue (`DisplayObject`) nativo de PixiJS. Maneja asíncronamente cargas, memorias, bindings, físicas, lip-sync, y permite interactuar con los modelos usando el sistema de eventos de Pixi.
   - *Contras:* Dependencia de un wrapper de terceros, pero `pixi-live2d-display` es el estándar comunitario "de facto", maduro y activamente mantenido.

**Solución Seleccionada:**
**PixiJS + `pixi-live2d-display`**.
Esta combinación ofrece el mejor balance entre alto rendimiento (renderizado 2D puro sobre WebGL), código limpio/mantenible (gestión de capas, eventos y carga delegados a PixiJS), e integración directa con Cubism SDK 4.0+.

*Nota Crítica:* Dado que los modelos son SDK 4.0+ (`.model3.json`), se debe importar exclusivamente `live2dcubismcore.min.js` y el paquete `cubism4.min.js` (en lugar del `index.min.js` habitual de la librería) para evitar cargar el core legacy (Cubism 2.1) que chocaría con los modelos modernos.

---

## 2. Arquitectura de Carga y Gestión de Assets

Para lograr escalabilidad cuando se manejan cientos de modelos (como se aprecia en el repositorio) con texturas pesadas y ficheros `.moc3`, se propone la siguiente arquitectura lógica:

1. **Estructura Estándar Unificada:**
   Cada modelo debe aislarse en un directorio estandarizado (Ej. `/xch001_01/`), que contenga de forma indexada su `.model3.json`. Todos los ficheros asociados (`.moc3`, texturas en `/textures/`, físicas en `.physics3.json` y animaciones en `/motions/`) son enlazados a través de rutas relativas dentro de este JSON.
2. **Carga Asíncrona (Lazy Loading) y Cache:**
   Al ser PixiJS + `pixi-live2d-display`, no cargamos los buffers binarios a mano. Se invoca `Live2DModel.from('ruta/al.model3.json')`. La librería realiza peticiones `fetch()` de los recursos.
   - **Caché en Memoria:** Mantener un diccionario de modelos activos. Si el usuario cambia a un modelo ya cargado, recuperar la instancia en lugar de re-fetchear los .moc3.
   - **Gestión de Memoria en WebGL:** Cuando un modelo sale de pantalla de forma prolongada, debe ser destruido (`model.destroy(true)`) para liberar los búferes de la VRAM y limpiar las texturas cacheadas.
3. **Manejo del CORS:**
   Al tratarse de archivos `.json` y binarios cargados por XHR/Fetch, los assets no pueden cargarse bajo el protocolo `file://`. Requieren invariablemente servirse desde un HTTP Server para proveer las cabeceras CORS adecuadas.

---

## 3. Sistema de Animación e Interacción

Con `pixi-live2d-display`, el sistema se vuelve altamente declarativo:

- **Seguimiento del Cursor (Eye/Head Tracking):**
  Aprovechando el sistema de interacción de PixiJS (`app.stage.eventMode = 'dynamic'`), se captura la posición del ratón/táctil en el lienzo.
  Esa coordenada global se transforma a la coordenada local del modelo y se invoca el método `model.focus(x, y)`. Internamente el Cubism Core de Live2D aplicará IK (Inverse Kinematics) a los parámetros de rotación del cuello y la vista (`ParamAngleX`, `ParamAngleY`, `ParamEyeBallX`, etc.).

- **Ejecución de Motions (Animaciones):**
  El fichero `.model3.json` agrupa animaciones por grupos (ej. "Idle", "TapBody", "Touch").
  Escuchando los eventos de click en el hit-box principal del modelo (`model.on('pointerdown')`), se llama al controlador interno:
  `model.internalModel.motionManager.startMotion('grupo', index, prioridad)`.
  El framework se encargará de hacer cross-fade entre la animación "Idle" base y la animación gatillada sin parpadeos.

---

## 4. Código Base (Proof of Concept)

En la carpeta del proyecto, se ha desarrollado un PoC minimalista e integrable en `index.html`.

Características del PoC:
- Carga de dependencias directas por CDN usando versiones enrutadas específicas para Cubism 4 (evitando errores de versiones pasadas).
- Lienzo responsive y transparente de PixiJS.
- Inicialización y escalado dinámico del modelo `xch001_01` (para centrarlo en pantalla).
- Implementación de `model.focus()` en el evento `pointermove` del escenario, de modo que el modelo sigue el mouse con su cabeza y vista.
- Implementación de disparo de animaciones aleatorias de su grupo de interacciones ("motions/"" array por defecto) en el evento `pointertap`.
- Manejo de carga asíncrona sin bloquear el UI thread.

*(Ver fichero `index.html` para la implementación)*
