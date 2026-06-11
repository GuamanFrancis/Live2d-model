# Consultoría Técnica: Implementación de Modelos Live2D (SDK 4.0+)

**A:** Equipo de Desarrollo / Stakeholders
**De:** Arquitecto de Software Senior
**Asunto:** Propuesta de Arquitectura y Stack Tecnológico para Entorno Live2D

---

## 1. Análisis de Stack Tecnológico

Para lograr que los modelos Live2D (archivos `.model3.json`, SDK 4.0+) "cobren vida" con alta fidelidad visual y rendimiento optimizado, evaluamos las siguientes alternativas:

1.  **WebGL Puro:** Proporciona el máximo control, pero el coste de desarrollo es prohibitivo. Requeriría implementar manualmente los shaders, la gestión de texturas y el pipeline completo de renderizado de mallas deformables de Live2D.
2.  **Cubism Web Framework Oficial (TypeScript):** Robusto y es la referencia oficial. Sin embargo, su integración directa requiere gestionar manualmente el contexto WebGL, el bucle de renderizado y la propagación de eventos, lo que lo hace poco amigable en ecosistemas modernos y escalables.
3.  **Three.js:** Líder indiscutible para 3D en web. Integrar Live2D en Three.js es posible, pero al ser Live2D una tecnología puramente 2D, Three.js añade un *overhead* computacional innecesario y su abstracción de cámara no es la más natural para sprites 2D.
4.  **PixiJS + `pixi-live2d-display`:** **(Selección Recomendada)**
    *   **Justificación:** PixiJS es el motor de renderizado 2D (WebGL) más rápido y maduro del mercado. La librería `pixi-live2d-display` actúa como un puente perfecto que integra el SDK oficial de Cubism (Live2D Core) dentro del árbol de visualización de PixiJS.
    *   **Ventajas:** El modelo Live2D se convierte en un `DisplayObject` estándar de PixiJS. Esto permite manipularlo (escalado, posición, rotación, filtros) con la misma facilidad que una imagen estática. Además, encapsula la complejidad de inicialización de WebGL, carga de assets, cálculos de físicas y la máquina de estados de animaciones. Garantiza mantenibilidad a largo plazo sin sacrificar rendimiento.

---

## 2. Arquitectura de Carga de Assets

Una arquitectura escalable para gestionar los ficheros Live2D (`.model3.json`, `.moc3`, `.png`, `.motion3.json`) debe basarse en un modelo de carga asíncrona gestionado por eventos:

*   **Punto de Entrada Único:** El archivo `.model3.json` es el manifiesto. La arquitectura debe usar una función factoría asíncrona (`Live2DModel.from()`) que lo tome como punto de partida.
*   **Gestión de Dependencias Interna:** El cargador analizará el JSON de manera paralela para obtener las texturas (`Textures`), la estructura de la malla (`Moc`), las dinámicas de ropa/cabello (`Physics`) y las animaciones (`Motions`).
*   **Codificación de URI (Seguridad y Resiliencia):** Dado que los assets pueden residir en directorios con espacios o caracteres no latinos (ej. `sin 七大罪～魔王崇拜～`), es imperativo el uso sistemático de `encodeURI()` para la resolución de rutas relativas absolutas antes del Fetch.
*   **Caché y Reutilización:** Los buffers y texturas descargadas deben ser cacheadas a nivel de WebGL para evitar recargas si el usuario cambia de modelo y vuelve al anterior.

---

## 3. Sistema de Animación e Interacción

Para un entorno digital fluido e inmersivo, se plantea el siguiente esquema de interacción:

*   **Eye/Head Tracking (Seguimiento de Cursor):**
    En lugar de calcular colisiones y vectores matemáticos manualmente, aprovecharemos el `focusController` interno que expone la abstracción de `pixi-live2d-display`. Este sistema interpola automáticamente los parámetros del modelo (como `ParamAngleX`, `ParamAngleY`, `ParamEyeBallX`, etc.) en función de las coordenadas del cursor, logrando un movimiento natural y con "easing" fuera de la caja.
*   **Ejecución de "Motions" (Gestión por Eventos):**
    *   **Delegación de Eventos:** Habilitaremos la capa interactiva de PixiJS en el modelo (`model.interactive = true; model.buttonMode = true;`).
    *   **Disparador:** Al evento `pointerdown` (compatible tanto con mouse como con interfaces táctiles), invocaremos el método `model.motion()`.
    *   **Estructura de Grupos:** Leeremos los grupos de animación definidos en el JSON (por ejemplo, el grupo vacío `""` o grupos estándar como `"Idle"`, `"TapBody"`). Se seleccionará una animación de forma aleatoria del grupo correspondiente o una secuencial, inyectándola en el *Motion Manager* interno para interpolar sin interrupciones abruptas desde la pose actual.

---

## 4. Código Base (Proof of Concept)

A continuación, implementaremos un *Proof of Concept* (PoC) minimalista en un archivo `index.html` situado en la raíz, que pondrá en práctica esta arquitectura utilizando PixiJS 6.x y el Core oficial de Cubism 4. El código demostrará la inicialización del lienzo WebGL, la carga segura del asset especificado y la vinculación de interactividad.
