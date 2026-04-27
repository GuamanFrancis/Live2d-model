# Propuesta Arquitectónica: Implementación de Modelos Live2D (SDK 4.0+)

Como Arquitecto de Software, he evaluado los requerimientos técnicos para la visualización e interacción de modelos Live2D en un entorno digital, priorizando la alta fidelidad, el rendimiento y la mantenibilidad del código base. A continuación, presento la solución técnica recomendada.

## 1. Análisis de Stack Tecnológico

Para la renderización de modelos Live2D (archivos `.model3.json`), tenemos múltiples alternativas en el ecosistema web. He evaluado las opciones más prominentes:

*   **SDK Oficial de Cubism (WebGL puro):** Ofrece el mayor control y rendimiento base, pero la curva de aprendizaje es pronunciada y el mantenimiento a largo plazo se vuelve complejo al tener que gestionar manualmente el pipeline de renderizado y el ciclo de vida de WebGL.
*   **Three.js:** Excelente para entornos 3D, pero al tratarse de modelos 2D planares con mallas de deformación, la sobrecarga de un motor 3D completo es innecesaria y puede complicar la integración de eventos de UI.
*   **PixiJS (Recomendado):** Es el estándar de la industria para renderizado 2D acelerado por hardware (WebGL). Su API es limpia, madura y altamente optimizada.

**Decisión Técnica:**
La solución óptima es utilizar **PixiJS (versión 6.x)** en conjunto con la librería especializada **`pixi-live2d-display`**.
*   *Justificación:* `pixi-live2d-display` abstrae la complejidad del Cubism SDK, proporcionando una interfaz de alto nivel directamente sobre el grafo de escena de PixiJS. Seleccionar PixiJS 6.x (específicamente 6.5.10) asegura una compatibilidad robusta con los entornos de ejecución, mitigando errores de soporte WebGL que pueden presentarse en versiones muy antiguas o en entornos headless (útil para testing automatizado). Además, para soportar modelos SDK 4.0+, se requiere la inyección de `live2dcubismcore.min.js` y `cubism4.min.js`, lo cual esta librería maneja de manera muy elegante.

## 2. Arquitectura de Carga y Gestión de Assets

Para garantizar que el sistema sea escalable y soporte la carga dinámica de múltiples modelos o el cambio de "skins", propongo la siguiente arquitectura lógica:

*   **Gestor de Recursos (Asset Manager):**
    Una capa de abstracción que maneja las URIs de los modelos. Dado que los archivos suelen tener nombres complejos o caracteres especiales (e.g., caracteres asiáticos en las rutas), el gestor debe encargarse de aplicar `encodeURI()` antes de realizar cualquier solicitud de red (`fetch`).
*   **Carga Diferida (Lazy Loading):**
    Los modelos completos (con sus `.moc3`, texturas de alta resolución y físicas) pueden ser pesados. `pixi-live2d-display` soporta promesas y carga asíncrona por defecto. Instanciamos el `Live2DModel.from(url)` y lo añadimos al escenario de PixiJS únicamente cuando la promesa se resuelve.
*   **Cálculo de Escala Responsiva:**
    Para mantener el *aspect ratio* sin distorsiones durante el redimensionado de la ventana (resize events), el gestor debe recalcular la escala basándose en las dimensiones originales sin escalar (`model.internalModel.width` y `model.internalModel.height`), ajustándolas al canvas actual, en lugar de mutar ciegamente `model.width` o `model.height`.

## 3. Sistema de Animación e Interacción

El éxito de una integración Live2D radica en la fluidez de las interacciones ("cobrar vida").

*   **Seguimiento de Cursor (Eye/Head Tracking):**
    Históricamente, requeriría cálculos trigonométricos complejos para pasar coordenadas al `focusController`. Sin embargo, nuestra arquitectura con `pixi-live2d-display` maneja el seguimiento del puntero (ratón o táctil) de manera automática (out of the box). El modelo responderá al cursor de forma nativa siempre que esté suscrito a los eventos interactivos del canvas de PixiJS.
*   **Ejecución de Movimientos (Motions):**
    Los movimientos pre-programados (como *idle*, *touch1*, etc.) se leen del `.model3.json`. Para dispararlos, expondremos un método en la capa de UI que interactúe directamente con el controlador interno usando `model.motion('GroupName', index)`. Si el modelo carece de grupos de animación nombrados explícitamente, se utilizará un string vacío `''` como nombre del grupo, lo que permite iterar por el array de movimientos disponibles de manera universal.

## Resumen

Esta arquitectura garantiza un balance perfecto entre **alta fidelidad visual** (gracias al renderizado acelerado de PixiJS), **rendimiento** (carga asíncrona optimizada) y **facilidad de mantenimiento** (al desacoplar el core del SDK y depender de un wrapper de alto nivel de probada fiabilidad). El código base resultante será modular, limpio y directamente aplicable a entornos de producción.