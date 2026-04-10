# Propuesta Técnica: Implementación de Modelos Live2D (SDK 4.0+)

Hola, con gusto asumo el rol de Arquitecto de Software Senior para este proyecto. Entendiendo que el objetivo es lograr alta fidelidad, rendimiento excelente y un código mantenible que sea capaz de dar vida a los modelos Live2D (SDK 4.0+) en la web, he analizado las diferentes alternativas y estructurado la siguiente propuesta.

## 1. Análisis de Stack Tecnológico

Existen varias formas de renderizar modelos Live2D en la web. Evaluemos las principales:

1.  **SDK Oficial de Cubism (Web):**
    *   *Pros:* Soporte oficial, implementa todas las características al día.
    *   *Contras:* Es de bajo nivel (WebGL/TypeScript puro), la curva de aprendizaje es empinada, no proporciona de caja un motor de renderizado 2D completo (como manejo del DOM, jerarquía de escena, filtros, etc.).
2.  **Three.js + Live2D:**
    *   *Pros:* Excelente si el proyecto mezclará 3D con 2D.
    *   *Contras:* Sobrecarga innecesaria si la aplicación será puramente 2D. Integrar el renderizador de Live2D sobre el pipeline 3D de Three.js suele requerir mucho trabajo personalizado.
3.  **PixiJS + pixi-live2d-display (Elección Recomendada):**
    *   *Pros:* PixiJS es el estándar de la industria para renderizado 2D en web gracias a su tremendo rendimiento con WebGL. La librería `pixi-live2d-display` es una capa de abstracción madura, bien mantenida y de alto nivel que envuelve el Cubism Core 4.0+. Permite cargar modelos enteros con una sola línea de código, soporta físicas, interacciones nativas (eye tracking) y funciona como un `DisplayObject` nativo de PixiJS.
    *   *Contras:* Añade una dependencia externa, pero el balance entre mantenibilidad y velocidad de desarrollo lo justifica plenamente.

**Conclusión:** Se utilizará **PixiJS (v6.x) + pixi-live2d-display (Cubism 4 bundle)**. Nos otorga la mejor relación entre facilidad de mantenimiento, escalabilidad en la UI y rendimiento visual de alto nivel.

---

## 2. Arquitectura de Carga y Gestión de Assets

Para mantener la escalabilidad al manejar múltiples modelos (moc3, texturas, motions, físicas), es crucial estructurar la carga de forma asíncrona y pre-calculada.

### Estructura Lógica de Directorios:
```text
/assets/
  /models/
    /personaje_a/
      personaje_a.model3.json      # Manifest principal (Punto de entrada)
      personaje_a.moc3             # Malla y vértices
      personaje_a.physics3.json    # Configuración de físicas
      /textures/
        texture_00.png             # Atlas de texturas
      /motions/
        idle.motion3.json
        touch_head.motion3.json
```

### Patrón de Carga (Asset Management):
1.  **Carga guiada por Manifest (`.model3.json`):** Toda carga debe originarse del archivo `.model3.json`. Este archivo funciona como el manifest que dicta exactamente qué dependencias (texturas, físicas y motions) necesita el modelo.
2.  **Codificación de URI:** Como muchos recursos (como en este caso "sin 七大罪～魔王崇拜～") tienen espacios o caracteres asiáticos, es imperativo utilizar `encodeURI()` al momento de pasar rutas relativas al cargador.
3.  **Precarga Asíncrona:** Utilizar `async/await` para esperar a que `Live2DModel.from()` termine de procesar. Esto permite inyectar pantallas de carga genéricas o esqueletos (Skeletons) en la UI de React/Vue/Vanilla mientras se hace fetch de los MBs de datos.

---

## 3. Sistema de Animación e Interacción

Un modelo estático no se siente "vivo". Para lograr el efecto de alta fidelidad, la interacción es clave.

### Eye/Head Tracking (Seguimiento del Cursor):
`pixi-live2d-display` expone el método `focus(x, y)`.
*   **Implementación:** Se adjunta un event listener de PixiJS (`pointermove`) en el `app.stage` completo.
*   **Comportamiento:** Se pasa el evento de coordenadas (`clientX`, `clientY`) al modelo. El motor de Cubism internamente interpola estas posiciones suavemente, haciendo que el modelo mire hacia el ratón sin saltos bruscos.

### Ejecución de Animaciones (Motions):
*   **Idle Motions:** El modelo debe reproducir automáticamente las animaciones de estado inactivo (respiración, parpadeo sutil). En `pixi-live2d-display`, las animaciones catalogadas bajo el grupo `idle` u ocultas en el root del JSON se pueden disparar o suelen auto-reproducirse (según configuración).
*   **Interacciones (Hitboxes / Taps):** Se adjunta un event listener (`pointertap`) en la instancia del modelo en PixiJS. Cuando ocurre el evento, se selecciona un grupo de animación (por ejemplo `touch`, `attack`) leyendo de `model.internalModel.motionManager.definitions` y se despacha usando `model.motion('nombre_grupo')`.

---

## 4. Código Base (Proof of Concept)

Se ha creado un archivo `index.html` funcional en la raíz del proyecto. Este PoC incluye:
- Carga de dependencias mediante CDN.
- Inicialización de Canvas con PixiJS y escalado dinámico (responsive) adaptado al modelo interno.
- Carga del modelo `xch001_01.model3.json`.
- Tracking visual (el modelo mira al cursor).
- Gatillo de animación al hacer clic/tap en el personaje.

El archivo PoC funciona como una plantilla de fácil extracción e integración en componentes modernos (como React o Vue).

> **Nota para la visualización:** Para ver el PoC en acción, debes servir la carpeta mediante un servidor HTTP local (ej. `python3 -m http.server`) para sortear restricciones de CORS de los navegadores al cargar ficheros locales.