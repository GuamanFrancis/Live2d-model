# Consultoría Técnica para Implementación de Modelos Live2D (SDK 4.0+)

## 1. Análisis de Stack
Para renderizar modelos Live2D (archivos `.model3.json`) en un entorno web con alta fidelidad y rendimiento, recomiendo encarecidamente la combinación de **PixiJS (v6.x)** junto con la librería integradora **pixi-live2d-display**.

**Justificación:**
- **PixiJS**: Es un motor de renderizado 2D extremadamente rápido, maduro y basado en WebGL. Proporciona una gestión de recursos y un grafo de escena (scene graph) eficientes, ofreciendo un rendimiento muy superior para 2D respecto a escribir código en WebGL puro. Es también más ligero y especializado que Three.js (cuyo foco principal es 3D).
- **pixi-live2d-display**: Es el puente estándar más robusto entre PixiJS y Live2D. Abstrae la enorme complejidad en bruto del SDK oficial de Cubism (Live2DCubismCore). Su mayor ventaja es que permite tratar los modelos Live2D como objetos de visualización estándar de PixiJS (`PIXI.DisplayObject`), lo que facilita inmensamente su posicionamiento, escalado y la vinculación de eventos de interfaz de usuario. Además, soporta nativamente modelos construidos con el SDK de Cubism 4.0+.

## 2. Arquitectura de Carga
Una estructura escalable y eficiente para la gestión de assets (ficheros `.moc3`, texturas, físicas, etc.) debe centrarse en el empaquetado asíncrono y la modularidad:

- **Manifiestos Declarativos**: Los archivos `.model3.json` deben tratarse como la única fuente de verdad (manifiestos). Ellos indexan y vinculan las mallas `.moc3`, texturas y archivos de animación (`.motion3.json`).
- **Carga Asíncrona (Lazy Loading)**: Utilizaremos el método estático `Live2DModel.from()` provisto por `pixi-live2d-display`. Éste se encarga internamente de gestionar la descarga asíncrona y parseo eficiente de toda la red de archivos referenciados en el `.model3.json`, cargándolos en la memoria de la GPU (VRAM) sólo cuando es necesario.
- **Encapsulamiento y Gestión de Rutas**: Los assets de cada modelo deben mantenerse aislados en sus respectivas carpetas (ej. `/xch001_01/`). Es crucial asegurar la correcta codificación de las rutas de red usando `encodeURI()` para prevenir errores `404`, especialmente cuando trabajamos con directorios que incluyen espacios o caracteres asiáticos.

## 3. Sistema de Animación e Interacción
El sistema debe sentirse orgánico, performante y responsivo:

- **Eye/Head Tracking (Seguimiento del Puntero)**:
  - Una ventaja clave de `pixi-live2d-display` es que el controlador de enfoque (`focusController`) viene activado y calibrado "out-of-the-box". No se requiere pasar manualmente las coordenadas crudas de píxeles al modelo. Al añadir el modelo al *stage* de PixiJS, los ojos y la cabeza seguirán los movimientos del puntero en el lienzo automáticamente.
- **Ejecución de "Motions" (Animaciones programadas)**:
  - Para reaccionar a interacciones, el objeto gráfico debe marcarse explícitamente como interactivo (`model.interactive = true; model.buttonMode = true;`).
  - Escucharemos eventos genéricos como `pointertap` para disparar animaciones específicas.
  - Para invocar animaciones de los archivos `.motion3.json`, se emplea la API `model.motion('NombreDelGrupo', index)`. *Nota técnica*: Si el manifiesto `.model3.json` tiene grupos anónimos (string vacío `""`), llamaremos a la función usando `model.motion('', index)`.

## 4. Código Base (PoC)
He adjuntado a la raíz del proyecto un archivo `index.html` funcional. Este archivo contiene la Prueba de Concepto (PoC) minimalista que:
1. Importa los core SDKs desde CDNs públicos oficiales y sin versiones inestables de la librería para evitar problemas de undefined.
2. Levanta una aplicación completa de PixiJS a pantalla completa.
3. Carga y posiciona correctamente el modelo de prueba `xch001_01`.
4. Habilita el tracking del mouse y ejecuta aleatoriamente animaciones del set disponible tras cada click.
