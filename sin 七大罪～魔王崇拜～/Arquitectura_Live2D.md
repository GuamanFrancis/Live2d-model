# Análisis y Propuesta de Arquitectura para Live2D (SDK 4.0+)

Hola. Como Arquitecto de Software Senior, he analizado tus requerimientos para crear un entorno digital interactivo y de alta fidelidad basado en modelos Live2D (SDK 4.0+). A continuación, presento mi evaluación del stack tecnológico, una arquitectura lógica para la carga de *assets* y una estrategia para la animación e interacción.

## 1. Análisis de Stack Tecnológico

Existen varias opciones para renderizar modelos Live2D en un entorno web:

1.  **SDK Oficial de Cubism (Web):** Es la implementación base proporcionada por Live2D.
    *   *Pros:* Control total, garantía de compatibilidad con las últimas características del formato.
    *   *Contras:* Nivel muy bajo. Requiere escribir manualmente la lógica de renderizado WebGL, gestión de shaders, loop de renderizado, y la gestión del canvas. Alta complejidad de mantenimiento.
2.  **WebGL Puro:**
    *   *Pros:* Máximo rendimiento teórico.
    *   *Contras:* Reinvención completa de la rueda. Curva de aprendizaje extremadamente empinada, largo tiempo de desarrollo y difícil mantenimiento.
3.  **Three.js:**
    *   *Pros:* Excelente para entornos 3D complejos.
    *   *Contras:* Live2D es fundamentalmente una tecnología 2D (con proyección 3D simulada). Integrarlo en un grafo de escena 3D puro suele ser excesivo ("overkill") y puede introducir overhead de rendimiento y complejidad innecesaria.
4.  **PixiJS + pixi-live2d-display:**
    *   *Pros:* PixiJS es el estándar *de facto* para renderizado 2D acelerado por hardware en la web. Es extremadamente rápido y robusto. La librería `pixi-live2d-display` expone los modelos Live2D como objetos de visualización (DisplayObjects) nativos de PixiJS.
    *   *Contras:* Dependencia de librerías de terceros (aunque muy estables y con gran comunidad).

**Selección:** **PixiJS + pixi-live2d-display**
*Justificación:* Es el stack más equilibrado. Ofrece la potencia y el rendimiento de WebGL a través de la API madura y amigable de PixiJS. `pixi-live2d-display` abstrae la complejidad del SDK de Cubism, permitiendo tratar el modelo Live2D casi como un `Sprite` estándar, lo que facilita enormemente el posicionamiento, escalado, la interacción de usuario (eventos del ratón/touch) y la integración en una UI más amplia. Esto maximiza la **facilidad de mantenimiento** sin comprometer la **capacidad visual**.

*Nota sobre versiones:* Para proyectos modernos con modelos Cubism 4.0+, se requiere PixiJS v6 y las dependencias base de Cubism (`live2dcubismcore.min.js`).

## 2. Arquitectura de Carga y Gestión de Assets

Para garantizar que el sistema sea escalable y mantenible (especialmente si manejas múltiples personajes), propongo una arquitectura basada en un **Gestor de Modelos (Model Manager)** centralizado.

### Estructura Lógica

1.  **Servidor de Assets (CDN o Local):** Los archivos pesados y estructurales de Live2D deben servirse de forma eficiente. La estructura típica es por personaje/variante:
    ```
    /assets/live2d/xch001_01/
    ├── xch001_01.model3.json  <-- Manifiesto (punto de entrada)
    ├── xch001_01.moc3         <-- Malla geométrica y parámetros
    ├── textures/              <-- Texturas (.png)
    │   ├── texture_00.png
    │   └── ...
    └── motions/               <-- Animaciones (.motion3.json)
        ├── idle.motion3.json
        └── touch1.motion3.json
    ```

2.  **Asset Loader (Cargador):** En lugar de cargar los recursos individualmente, se debe proporcionar únicamente la ruta al archivo `.model3.json`. La librería `pixi-live2d-display` se encarga de parsear este manifiesto y orquestar las peticiones de red asíncronas para el `.moc3`, las texturas y las físicas necesarias.

3.  **Encapsulamiento del Modelo:** Cada entidad visual será una clase (ej. `Live2DCharacter`) que extienda o contenga un contenedor de PixiJS (`PIXI.Container`), manejando internamente la instancia de `Live2DModel`. Esto aísla la lógica específica del modelo (posicionamiento base, anclaje) del flujo general de la aplicación.

## 3. Sistema de Animación e Interacción

### Seguimiento del Cursor (Eye/Head Tracking)
Con la elección de `pixi-live2d-display`, el seguimiento de cursor es **automático** y nativo. La librería calcula las coordenadas del puntero relativas al canvas y ajusta los parámetros de enfoque (FocusController) del modelo interno.
*   *Ventaja Arquitectónica:* No es necesario inyectar listeners globales del DOM y mapear coordenadas al espacio WebGL de forma manual; todo esto se gestiona internamente en el ciclo de actualización del modelo.

### Ejecución de "Motions" (Animaciones Programadas)
El archivo `.model3.json` define grupos de animaciones.
*   **Idle:** Las animaciones en el grupo `Idle` (si existe) se ejecutarán automáticamente en bucle. Si no se especifican grupos, se puede forzar reproducciones con un string vacío `""`.
*   **Interacciones (Hit Areas):** Para activar animaciones mediante toques:
    1.  Habilitar interactividad en el modelo (`model.interactive = true`).
    2.  Escuchar eventos como `pointertap`.
    3.  Llamar al método `model.motion("GroupName", index)` o `model.motion("", index)` si los *motions* no están agrupados.
    4.  Opcional pero recomendado: Implementar lógica anti-spam (bloquear nuevas animaciones hasta que finalice la actual).

## 4. Código Base (Proof of Concept - PoC)

He incluido en la carpeta raíz un archivo `index.html` que implementa esta arquitectura de forma minimalista. Utiliza el modelo `xch001_01` incluido en tu repositorio para demostrar:
1.  Inicialización de la aplicación PixiJS.
2.  Carga asíncrona del modelo vía `.model3.json`.
3.  Posicionamiento y escalado (usando el centro del modelo).
4.  Interacción mediante clic para disparar diferentes animaciones (motions) disponibles en el manifiesto.

Para probarlo localmente, es necesario ejecutar un servidor HTTP (ej. `python -m http.server`) para evitar restricciones de CORS del navegador al cargar los ficheros locales.

Quedo a tu disposición para iterar sobre esta arquitectura y profundizar en módulos específicos como la gestión avanzada de estados o precarga de recursos.