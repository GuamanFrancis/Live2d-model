/**
 * Archivo PoC: Inicialización e Interacción con Live2D Model
 * Usa PixiJS 6.5.x y pixi-live2d-display
 */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Configuración de la aplicación PixiJS
    const container = document.getElementById("canvas-container");
    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x333333,
        resizeTo: window
    });
    container.appendChild(app.view);

    // 2. Definición del modelo a cargar (con encodeURI para manejar caracteres especiales o espacios si los hay)
    // El modelo xch001_01 está disponible en el directorio
    const modelUrl = encodeURI("xch001_01/xch001_01.model3.json");

    try {
        // 3. Cargar el modelo de Live2D usando la clase de pixi-live2d-display
        const model = await PIXI.live2d.Live2DModel.from(modelUrl);
        app.stage.addChild(model);

        // 4. Configurar el tamaño y la posición
        // Se usa anchor.set(0.5) para centrar el modelo fácilmente
        model.anchor.set(0.5, 0.5);

        // Calcular la escala para que el modelo encaje en la pantalla
        const scaleX = window.innerWidth / model.internalModel.width;
        const scaleY = window.innerHeight / model.internalModel.height;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% de la pantalla

        model.scale.set(scale);

        // Centrar en la pantalla
        model.x = window.innerWidth / 2;
        model.y = window.innerHeight / 2;

        // Actualizar posición en caso de redimensionamiento de ventana
        window.addEventListener('resize', () => {
            const newScaleX = window.innerWidth / model.internalModel.width;
            const newScaleY = window.innerHeight / model.internalModel.height;
            const newScale = Math.min(newScaleX, newScaleY) * 0.9;
            model.scale.set(newScale);
            model.x = window.innerWidth / 2;
            model.y = window.innerHeight / 2;
        });

        // 5. Configurar interacciones
        // Habilitar interactividad
        model.interactive = true;
        model.buttonMode = true;

        // Reproducir animación (motion) al hacer clic
        // pixi-live2d-display maneja el seguimiento del ratón de forma nativa.
        model.on('pointerdown', (e) => {
            // Se invoca la animación. Si no hay nombre de grupo, se usa '' y se elige un índice al azar o específico
            // El json indica que las animaciones están en el grupo "" (vacío).
            model.motion('', 0);
        });

        console.log("Live2D Modelo cargado correctamente.");

    } catch (error) {
        console.error("Error al cargar el modelo Live2D:", error);
    }
});
