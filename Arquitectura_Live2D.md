# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+)

Hola. Es un placer colaborar en este proyecto. Tras analizar los requerimientos para lograr una visualización e interacción de alta fidelidad y rendimiento con modelos Live2D (archivos `.model3.json`), presento a continuación mi propuesta arquitectónica y técnica.

---

## 1. Análisis de Stack y Elección de Tecnología

Para aplicaciones web modernas que requieren interactividad y alto rendimiento gráfico, la renderización basada en WebGL es obligatoria.

**Stack Recomendado: PixiJS + `pixi-live2d-display` + Live2D Cubism Core (v4)**

**Justificación:**
1.  **Rendimiento WebGL Optimizado:** PixiJS es actualmente el motor de renderizado 2D más rápido y maduro para la web. Gestiona eficientemente el ciclo de vida de WebGL, el empaquetado de texturas (texture batching) y la recolección de basura, lo cual es crítico para aplicaciones interactivas fluidas a 60fps.
2.  **Mantenibilidad vs. Esfuerzo (Developer Experience):** Usar el SDK oficial de Cubism con WebGL puro o Three.js requiere escribir una cantidad significativa de código boilerplate complejo (shaders, buffers, matrices). El plugin `pixi-live2d-display` abstrae toda esta complejidad matematico-gráfica, exponiendo una API de alto nivel orientada a objetos que trata al modelo Live2D simplemente como un contenedor nativo de PixiJS (`PIXI.Container`).
3.  **Compatibilidad SDK 4.0+:** El plugin tiene soporte total de las físicas complejas y dinámicas de meshes que introdujo Cubism 4, requiriendo únicamente el motor oficial (`live2dcubismcore.min.js`).

---

## 2. Arquitectura de Carga de Assets

Una estructura lógica y escalable es fundamental cuando trabajamos con modelos complejos (`.moc3`), múltiples archivos de físicas, animaciones (`.motion3.json`) y texturas de alta resolución.

**Estructura Recomendada:**

```text
/assets
  /live2d
    /[Model_Name]           <-- Encapsulamiento por personaje/modelo
      [Model_Name].model3.json    <-- Master File (Entry Point)
      [Model_Name].moc3           <-- Binario principal
      /textures                   <-- Texturas PNG (mipmap-ready)
        texture_00.png
      /motions                    <-- Animaciones
        idle.motion3.json
        touch.motion3.json
      /physics                    <-- Reglas físicas
        physics.json
```

**Principios de Carga Escalable:**
1.  **Carga Asíncrona Controlada:** Utilizar el pipeline de red interno de `pixi-live2d-display` que paraleliza las descargas basándose en el "Master File" (`.model3.json`).
2.  **URL Encoding:** Es imperativo aplicar `encodeURI` en las peticiones de fetch si las rutas de los assets incluyen espacios o caracteres no latinos (ej. caracteres asiáticos), evitando así errores HTTP 404 en la red.
3.  **Gestión de Memoria:** Implementar la destrucción adecuada de los contenedores Pixi (`model.destroy({ children: true })`) cuando un modelo ya no está en uso para limpiar los buffers de WebGL.

---

## 3. Sistema de Animación e Interacción

**Tracking del Cursor (Head/Eye Tracking):**
Debemos mapear las coordenadas del ratón (en un espacio de cliente 2D) al espacio normalizado [-1, 1] que espera el motor de Live2D.
*   **Método:** Capturar el evento `pointermove` en el canvas de PixiJS, convertir la coordenada de píxeles a un ratio centrado, y alimentar el método interno `model.focus(x, y)`. Las físicas de inercia y fricción las maneja automáticamente el Core del SDK.

**Ejecución de Motions (Animaciones):**
Las animaciones se organizan habitualmente en grupos dentro del `.model3.json` (ej: "Idle", "TapBody").
*   **Método:** Escuchar eventos `pointerdown` en el contenedor global o realizar un *hit test* en los "hit areas" definidos del modelo. Al detectar la colisión, se invoca `model.motion('NombreGrupo')`. El sistema transicionará suavemente (blend) desde el estado actual a la nueva animación según las curvas predefinidas en Cubism.

**Redimensionamiento Responsivo (Resizing):**
Para evitar que los vértices del modelo se distorsionen durante cambios de tamaño de la ventana del navegador, el escalado debe basarse en las dimensiones lógicas no escaladas del modelo (`model.internalModel.width`), multiplicadas por el ratio de aspecto de la ventana contenedora.

---

## 4. Código Base (Proof of Concept)

He desarrollado un "Proof of Concept" (PoC) funcional alojado en este repositorio.

*   `index.html`: Carga las dependencias de PixiJS y Live2D Core.
*   `app.js`: Implementa el flujo arquitectónico propuesto. Inicializa un lienzo transparente de PixiJS, carga de forma asíncrona el modelo *xch001_01* procesando correctamente sus texturas y físicas.

El PoC incluye tracking continuo del cursor mediante el sistema `focus()` y un sistema reactivo a los clics del usuario (`pointerdown`) que dispara la reproducción del grupo de movimiento 'touch1'. Asimismo, implementa un "Resize Observer" que previene el estiramiento o pixelado visual al modificar el tamaño de la ventana.

Quedo a tu entera disposición para ahondar en cualquiera de estos componentes y proceder con su escalado.

Saludos,
Arquitecto de Software Senior