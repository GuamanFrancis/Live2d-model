# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+) en Entornos Web

## 1. Análisis de Stack Tecnológico

Para renderizar modelos Live2D (Cubism 4.0+) en la web, existen varias alternativas. A continuación, se presenta una evaluación y la elección arquitectónica más robusta:

### Opciones Evaluadas:
1. **SDK Oficial de Cubism (TypeScript/WebGL puro)**:
   - *Pros*: Máximo control, soporte oficial garantizado por Live2D Inc.
   - *Contras*: Curva de aprendizaje muy pronunciada, requiere escribir una gran cantidad de código *boilerplate* para inicializar WebGL, gestionar texturas, shaders y matrices de transformación. Difícil de mantener en proyectos grandes sin construir un *wrapper* propio.
2. **Three.js + Cubism SDK**:
   - *Pros*: Excelente si el proyecto mezcla modelos 3D reales con modelos Live2D.
   - *Contras*: Three.js está diseñado para 3D. Usarlo exclusivamente para renderizado 2D añade un *overhead* innecesario y la integración con Live2D requiere configuraciones complejas de proyección ortográfica.
3. **PixiJS + `pixi-live2d-display`**:
   - *Pros*: PixiJS es el estándar de la industria para renderizado 2D hiper-rápido en WebGL. La librería `pixi-live2d-display` proporciona un *wrapper* de alto nivel sobre el SDK oficial de Cubism (soporta versiones 2, 3 y 4). Abstrae la carga de ficheros y el ciclo de vida del renderizado de una forma muy limpia, integrándose perfectamente en el grafo de escena de PixiJS.
   - *Contras*: Depende de una librería de terceros sobre el SDK oficial.

### Elección Arquitectónica: **PixiJS + pixi-live2d-display**
*Justificación*: Actuando como Arquitecto de Software, mi prioridad es el equilibrio entre **rendimiento (alta fidelidad)** y **mantenibilidad**. PixiJS ofrece el mejor motor de renderizado 2D y `pixi-live2d-display` encapsula toda la complejidad del SDK de Cubism. Nos permite cargar modelos con una o dos líneas de código, ofrece métodos directos para interactuar con físicas, hit areas y animaciones, y delega el manejo del canvas y contextos WebGL a PixiJS, reduciendo el riesgo de *memory leaks* y facilitando la escalabilidad del proyecto.

---

## 2. Arquitectura de Carga y Gestión de Assets

Los modelos Live2D modernos están compuestos por múltiples ficheros interconectados mediante un archivo índice `.model3.json`. Una arquitectura escalable debe manejar estos recursos de forma asíncrona y estructurada.

### Estructura Lógica Propuesta:
- **Gestor de Recursos (Asset Manager)**: Utilizaremos el sistema de carga integrado de `pixi-live2d-display` que extiende el `Loader` de PixiJS. Esto nos permite hacer *lazy loading* de los recursos.
- **Flujo de Carga Escalable**:
  1. **Lectura del Manifiesto**: El loader solicita el `.model3.json`.
  2. **Resolución de Rutas Relativas**: De forma automática, se parsea el JSON y se encolan peticiones para el núcleo del modelo (`.moc3`), el atlas de texturas (archivos `.png`), las dinámicas de físicas (`.physics3.json`), y el diccionario de poses/expresiones.
  3. **Carga bajo Demanda (Lazy Motions)**: Para optimizar el ancho de banda, los ficheros de animación (`.motion3.json` y audios asociados) no se cargan todos al inicio, sino que se pre-cargan los esenciales (como el `Idle`) y los demás se instancian *just-in-time* cuando se invocan.

Esto garantiza que el Tiempo Hasta la Primera Interacción (TTFI) sea el mínimo posible.

---

## 3. Sistema de Animación e Interacción

Para hacer que el modelo "cobre vida", necesitamos implementar dos sistemas clave:

### A. Seguimiento del Cursor (Eye / Head Tracking)
Aprovecharemos la funcionalidad de control de vista que abstrae el SDK.
- **Implementación**: Capturaremos el evento `pointermove` del objeto global (window o el viewport de PixiJS). Convertiremos las coordenadas de la pantalla a las coordenadas normalizadas del modelo (rango de -1 a 1).
- **Ejecución**: Usando el método `model.focus(x, y)` de `pixi-live2d-display`, el modelo ajustará sus parámetros de Cubism (`ParamAngleX`, `ParamAngleY`, `ParamEyeBallX`, etc.) interpolando el movimiento de forma suave y automática.

### B. Ejecución de "Motions" (Animaciones y Lipsync)
- **Gestor de Animaciones**: El framework asigna un `MotionManager` al modelo.
- **Interacción (Click/Tap)**: Capturamos el evento de clic en el canvas. Podemos calcular la intersección para detectar si se tocó un "Hit Area" específica del modelo (por ejemplo, la cabeza o el cuerpo) o simplemente reaccionar a clics globales.
- **Trigger**: Ejecutaremos la animación deseada llamando a `model.motion('grupo_de_animacion')`. El sistema transicionará automáticamente desde el estado actual (ej: *Idle*) hacia la nueva animación utilizando las curvas de fundido (fade-in/fade-out) definidas en el modelo original.

---

## 4. Código Base (Proof of Concept - PoC)

El archivo `index.html` situado en la carpeta `Live2D_PoC` de este repositorio implementa esta arquitectura de manera minimalista y funcional, sirviendo como base sólida para su integración en frameworks más grandes (React, Vue, etc.) o como motor standalone.
