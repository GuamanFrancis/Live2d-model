# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+)

**Autor:** Arquitecto de Software Senior
**Fecha:** Octubre 2023
**Proyecto:** Visualización e Interacción de Modelos Live2D en Web

---

## 1. Resumen Ejecutivo

El objetivo de este documento es proporcionar una propuesta arquitectónica robusta y escalable para la implementación de un sistema de renderizado e interacción con modelos Live2D (formato `.model3.json`, Cubism SDK 4.0+) en un entorno web. Se busca lograr un equilibrio óptimo entre alta fidelidad visual, rendimiento fluido y facilidad de mantenimiento del código.

## 2. Análisis del Stack Tecnológico

Para la renderización de modelos Live2D en la web, existen varias alternativas. A continuación, presento un análisis de las principales opciones:

### Alternativas Evaluadas

1.  **SDK Oficial de Cubism (Web):**
    *   **Pros:** Es la fuente de la verdad, soporta todas las características de la última versión del SDK.
    *   **Contras:** Es de muy bajo nivel. Requiere escribir mucho código boilerplate (WebGL crudo) para la gestión del canvas, texturas y eventos, lo que dificulta el mantenimiento y la escalabilidad de la aplicación.
2.  **Three.js + Live2D:**
    *   **Pros:** Three.js es el estándar de facto para 3D en la web, excelente para integrar Live2D en entornos tridimensionales complejos.
    *   **Contras:** Overhead innecesario si el objetivo principal es renderizar 2D. La integración no siempre es directa y requiere adaptadores complejos.
3.  **PixiJS + pixi-live2d-display (Elección Recomendada):**
    *   **Pros:** PixiJS es un motor de renderizado 2D extremadamente rápido (WebGL con fallback a Canvas). La librería `pixi-live2d-display` ofrece una abstracción de alto nivel sobre el SDK de Cubism, simplificando drásticamente la carga de modelos, gestión de texturas y ejecución de animaciones.
    *   **Contras:** Dependencia de una librería de terceros (`pixi-live2d-display`), aunque está activamente mantenida y es el estándar de la industria para este caso de uso.

### Justificación de la Elección: PixiJS + `pixi-live2d-display`

He seleccionado este stack por las siguientes razones:
*   **Mantenibilidad:** Reduce el código necesario de cientos de líneas (con el SDK crudo) a unas pocas decenas, utilizando una API declarativa y orientada a objetos.
*   **Rendimiento:** PixiJS gestiona el árbol de renderizado (scene graph) y el batching de WebGL de manera muy eficiente.
*   **Compatibilidad:** Usando el bundle `cubism4.min.js`, garantizamos soporte total para los modelos SDK 4.0+ sin conflictos con versiones anteriores (Cubism 2).

## 3. Arquitectura de Carga de Assets

Una arquitectura escalable requiere separar la lógica de negocio del almacenamiento de recursos.

### Estructura de Directorios Recomendada

```text
/assets
  /models
    /CharacterName
      CharacterName.model3.json   # Archivo de configuración principal
      CharacterName.moc3          # Binario del modelo
      /textures                   # Texturas del modelo
      /motions                    # Animaciones (.motion3.json)
      /expressions                # Expresiones faciales (.exp3.json)
```

### Proceso Lógico de Carga (Asset Management)

1.  **Manifestación (JSON):** El sistema solo necesita conocer la ruta al archivo `.model3.json`.
2.  **Parsing Automático:** La librería `pixi-live2d-display` lee este JSON y resuelve automáticamente las rutas relativas a los `.moc3`, `.png`, y `.motion3.json`.
3.  **Carga Asíncrona (Lazy Loading):** Los assets se cargan de forma asíncrona. Se recomienda implementar un estado de "Cargando" (Loader/Spinner) en la UI mientras se descargan y decodifican los archivos en memoria.
4.  **Caché:** Aprovechar la caché del navegador para los assets estáticos y considerar el uso de Service Workers para implementaciones PWA (Progressive Web Apps).

## 4. Sistema de Animación e Interacción

Para que el modelo "cobre vida", necesitamos implementar dos sistemas principales:

### 4.1. Seguimiento del Cursor (Eye/Head Tracking)

El SDK de Cubism permite alterar parámetros del modelo (como `ParamAngleX`, `ParamEyeLOpen`, etc.).
Con `pixi-live2d-display`, este sistema viene integrado pero debe configurarse para responder al entorno DOM:
*   **Lógica:** Interceptar el evento `pointermove` en la ventana global o en el contenedor de PixiJS.
*   **Mapeo:** Traducir las coordenadas del ratón (X, Y) relativas al centro del modelo en valores normalizados (-1 a 1) que la función `model.focus(x, y)` utilizará para girar la cabeza y los ojos hacia el cursor de forma suave.

### 4.2. Ejecución de "Motions" (Animaciones)

Las interacciones táctiles (clics) deben desencadenar animaciones específicas.
*   **Hit Testing:** Utilizar el sistema de interacción de PixiJS para detectar clics (tap/pointerdown) sobre el canvas. Idealmente, se pueden definir "Hit Areas" (áreas de impacto) en el modelo original para reaccionar diferente si se toca la cabeza o el cuerpo.
*   **Reproducción:** Al detectar un clic, llamar a `model.motion('GroupName')` o iterar sobre las animaciones disponibles e invocar una de forma aleatoria para mayor dinamismo.

## 5. Consideraciones Clave (Best Practices)

1.  **Redimensionamiento Responsivo (Resizing):** Al redimensionar el canvas, el modelo no debe distorsionarse. Es crucial utilizar las dimensiones originales sin escalar (`model.internalModel.width` y `model.internalModel.height`) para calcular el factor de escala correcto, preservando el *aspect ratio*.
2.  **Servidor Local:** Por políticas de seguridad de los navegadores (CORS), los modelos cargados desde el sistema de archivos local (`file://`) generarán errores de *Fetch API*. Es mandatorio usar un servidor HTTP local para el desarrollo.

---

A continuación, se desarrollará una Prueba de Concepto (PoC) implementando estos conceptos en los archivos `index.html` y `app.js`.