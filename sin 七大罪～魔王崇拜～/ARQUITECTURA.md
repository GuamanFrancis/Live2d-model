# Documento de Consultoría Técnica: Implementación de Live2D (SDK 4.0+)

## 1. Análisis de Stack

Para este proyecto, el objetivo principal es lograr alta fidelidad visual junto con un buen rendimiento general para modelos extraídos (compatibles con Cubism 4.0+).

**Alternativas evaluadas:**
- **WebGL Puro / SDK Oficial de Cubism Framework:** Proporciona un rendimiento óptimo, pero es tedioso de mantener debido a la complejidad de bajo nivel y la carencia de un ecosistema de renderizado avanzado y abstracciones.
- **Three.js:** Excelente para 3D, pero los wrappers de Live2D para Three.js no están tan pulidos o directamente soportados por la comunidad moderna para la versión 4, lo que provoca mayor carga de mantenimiento en la integración.
- **PixiJS + pixi-live2d-display:** PixiJS es el estándar de facto actual de la industria para renderizado 2D acelerado por WebGL en la web. Al emparejarlo con `pixi-live2d-display`, se abstrae toda la lógica compleja de Live2D Framework mientras se aprovecha la potencia de PixiJS (WebP, transformaciones de escenario, etc.).

**Decisión Técnica:**
Se recomienda el uso de **PixiJS (v6.x) con `pixi-live2d-display` (Cubism 4)**.

**Justificación:**
1. **Fidelidad y Rendimiento:** Utiliza la potencia del WebGL de PixiJS, lo que garantiza 60 FPS con múltiples modelos en pantalla.
2. **Abstracción:** `pixi-live2d-display` maneja nativamente la lectura de los `.model3.json`, `.moc3`, y las físicas, inyectándolos sin fisuras como un objeto de pantalla regular de Pixi (`PIXI.Container`).
3. **Mantenibilidad:** El ciclo de vida de PixiJS permite la fácil administración de Assets, posicionamiento (`anchor.set`), escalado y limpieza de memoria en el front-end con menos líneas de código.
4. **Interacción:** El seguimiento de cursor (eye/head tracking) y las respiraciones (idle) vienen integrados de serie, ahorrando semanas de trabajo de implementación.

---

## 2. Arquitectura de Carga y Gestión de Assets

Dado que el proyecto utilizará archivos `.model3.json` de varias entidades, el sistema debe ser modular.

### Estructura Propuesta

Recomendamos mantener los datos organizados por carpetas para cada modelo, tal como se presentan en los datos actuales extraídos:

```text
/assets
  /[ID_Modelo] (Ej: xch001_01)
     /motions        -> Archivos .motion3.json (Animaciones)
     /textures       -> Atlas de texturas PNG
     [ID_Modelo].moc3 -> Core de modelo compilado
     [ID_Modelo].model3.json -> Archivo manifiesto
```

### Proceso de Carga y Gestión (Patrón Asíncrono)

1. **Pre-carga:** Utilizar `PIXI.live2d.Live2DModel.from(url)` de manera asíncrona (`await`). Esto leerá el archivo `.model3.json` y de forma automática resolverá todas las referencias relativas (moc3, texturas y físicas).
2. **Resolución de URLs:** Es importante envolver las rutas con `encodeURI(path)` para asegurar que caracteres especiales (espacios o glifos asiáticos en los nombres de carpeta/archivo) no quiebren las peticiones a la red en navegadores modernos.
3. **Gestión en memoria:** Los modelos Live2D consumen grandes cantidades de memoria VRAM por texturas. Al desechar un personaje en la UI, es obligatorio llamar al método de PixiJS `.destroy(true)` (o la API equivalente de `pixi-live2d-display`) sobre el modelo para que WebGL libere explícitamente los buffers de texturas, previniendo fugas de memoria (memory leaks).

---

## 3. Sistema de Animación e Interacción

### Eye & Head Tracking (Seguimiento del cursor)
Con `pixi-live2d-display`, el tracking viene habilitado por defecto y está integrado dentro del loop del `ticker` de PixiJS. El modelo seguirá al puntero o evento de movimiento de toque en el canvas sin lógica de cálculo manual (evitamos pasar coordenadas de píxeles en crudo a los controladores).

### Ejecución de Animaciones (Motions)
El archivo `.model3.json` expone los grupos de animaciones bajo el nodo `Motions` (a menudo bajo el grupo vacío `""` o grupos como `"tap_body"`, `"idle"`).
Para ejecutar estas animaciones, se debe aprovechar el sistema de eventos del escenario.

**Implementación (Basado en la PoC):**
1. **Habilitar eventos:** Activar `model.interactive = true` y `model.buttonMode = true`.
2. **Lanzar eventos:** Configurar el listener `.on('pointertap', handler)` sobre el modelo.
3. **Trigger de Motion:** En el callback, disparar la animación mediante `model.motion('NombreDelGrupo', index)`. Si el modelo utiliza el grupo por defecto `""`, puede enviarse una cadena vacía, y el sistema gestionará transiciones, suavizado y mezcla de parámetros automáticamente para recuperar la pose 'Idle' al finalizar.

Esto provee la máxima fluidez sin tener que escribir interpoladores (tweens) personalizados para los parámetros de Live2D.