# Propuesta Técnica: Implementación de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack Tecnológico

Para lograr una visualización e interacción de modelos Live2D de alta fidelidad, con un equilibrio óptimo entre rendimiento (GPU-accelerated) y facilidad de mantenimiento, la solución más robusta en la actualidad es la combinación de **PixiJS** junto con la librería **pixi-live2d-display**.

### Justificación de la Elección:
* **PixiJS**: Es un motor de renderizado 2D extremadamente rápido y consolidado basado en WebGL, que proporciona un excelente rendimiento (incluso en dispositivos móviles), manejo eficiente de texturas y una amplia comunidad/ecosistema.
* **pixi-live2d-display**: Proporciona una capa de abstracción impecable sobre el SDK oficial de Cubism (Live2D). Su ventaja principal radica en que maneja la inicialización, la interpolación de animaciones y la recolección de eventos físicos sin obligarnos a lidiar con el código boiler-plate de bajo nivel que exige el SDK base o WebGL puro.
* **Compatibilidad SDK 4.0+**: Al cargar los binarios correctos (`live2dcubismcore.min.js` y `cubism4.min.js` en lugar del genérico `index.min.js`), esta configuración soporta de manera nativa la estructura `.model3.json` y la nueva física implementada desde la versión 3/4, previniendo errores de compatibilidad retroactiva o de *runtime* (propios de Cubism 2).

*Alternativas descartadas*:
- *WebGL puro / SDK oficial*: Implica un tiempo de desarrollo muy alto, un mantenimiento complejo y una reinvención de utilidades como el batching de texturas.
- *Three.js*: Aunque es excelente para 3D, añadir Live2D requiere integraciones de terceros que usualmente están menos mantenidas que `pixi-live2d-display`, y su overhead general no está justificado para rendering primariamente 2D.

---

## 2. Arquitectura de Carga (Asset Management)

La estructura y estrategia para gestionar assets deben soportar una carga dinámica, progresiva y sin bloqueos del *main thread*.

### Estructura Recomendada de Assets:
La estructura debe basarse en un despliegue aislado por modelo (aislando su `.moc3`, `.model3.json`, texturas y `.motion3.json`) para prevenir choques de referencias cruzadas y facilitar el CDN cacheo.

```
/models
 └── /ModelName
      ├── ModelName.model3.json  # Punto de entrada (Configuraciones)
      ├── ModelName.moc3         # Binario de geometría del modelo
      ├── /textures
      │    ├── texture_00.png    # High-res textures (comprimidas idealmente en WebP para web)
      │    └── ...
      ├── /motions
      │    ├── idle.motion3.json
      │    ├── touch.motion3.json
      │    └── ...
      └── ModelName.physics3.json # Físicas (opcional, pero vital para SDK 4+)
```

### Flujo de Carga (Lifecycle):
1. **Pre-carga (Fetch API)**: Cargar el `.model3.json` inicialmente.
2. **Streaming de Texturas**: PixiJS se encarga de subir las texturas a la VRAM mediante WebGL `texImage2D` de forma asíncrona.
3. **Manejo de Errores y Fallbacks**: `pixi-live2d-display` ofrece callbacks nativos para manejar fallas en la carga de archivos individuales.
4. **CORS y Entorno Local**: Por naturaleza del motor (Fetch de archivos `.json` locales y manipulación de Canvas), el despliegue local **requiere un servidor HTTP** (por ej., `python3 -m http.server`) para evadir políticas de Same-Origin de los navegadores.

---

## 3. Sistema de Animación e Interacción

El éxito de una integración de Live2D depende de la "sensación de vida" que proporciona el modelo.

### 3.1 Seguimiento del Cursor (Eye/Head Tracking)
Implementaremos el *Focus Targeting*.
- Escucharemos los eventos `pointermove` (para mouse/touch) sobre el Canvas de PixiJS.
- Transformaremos las coordenadas locales del viewport a coordenadas relativas del modelo (X e Y entre -1.0 y 1.0).
- La librería abstrae esta inyección mediante su gestor `focus(x, y)`, mapeando estos valores directamente a los parámetros `ParamAngleX`, `ParamAngleY` y `ParamEyeBallX/Y` definidos internamente en el `moc3`.

### 3.2 Sistema de Motions y Eventos de Toque
- **Hit Areas (Zonas de Toque)**: Utilizando las cajas de colisión predefinidas en el modelo (Head, Body, etc.). Interceptaremos eventos de tipo `pointerdown`.
- **Motion Manager**: Al detectar un clic en un área específica (ej. `Body`), dispararemos una animación invocando la API del gestor: `model.motion("TapBody")`.
- **Idle Motions**: Estableceremos una prioridad por defecto. Cuando no hay interacciones, el sistema debe caer automáticamente en bucle sobre el grupo de animaciones `Idle`.
