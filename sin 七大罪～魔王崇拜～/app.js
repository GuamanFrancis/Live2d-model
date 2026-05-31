// Exponer PIXI globalmente para el plugin de Live2D
const { Application } = PIXI;
const { Live2DModel } = PIXI.live2d;

// Configuración principal
const CONFIG = {
    // Escapar/codificar la ruta para manejar los caracteres especiales y espacios
    modelPath: encodeURI('./xch001_01/xch001_01.model3.json'),
    backgroundColor: 0x2b2b2b,
    containerId: 'canvas-container'
};

async function initLive2DApp() {
    try {
        // 1. Inicializar la aplicación PixiJS
        const container = document.getElementById(CONFIG.containerId);
        const app = new Application({
            view: document.createElement('canvas'),
            resizeTo: container,
            backgroundColor: CONFIG.backgroundColor,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true
        });

        container.appendChild(app.view);

        // 2. Cargar el modelo Live2D
        console.log(`Cargando modelo desde: ${CONFIG.modelPath}`);
        const model = await Live2DModel.from(CONFIG.modelPath);

        // 3. Añadir el modelo al escenario
        app.stage.addChild(model);

        // 4. Configurar lógica de escalado y posicionamiento
        function resizeModel() {
            // Utilizamos internalModel.width/height como recomiendan las mejores prácticas
            // para evitar distorsiones al redimensionar.
            const modelBaseWidth = model.internalModel.width;
            const modelBaseHeight = model.internalModel.height;

            // Calculamos la escala para que encaje en la pantalla (dejando un margen)
            const scaleX = (app.renderer.width * 0.8) / modelBaseWidth;
            const scaleY = (app.renderer.height * 0.9) / modelBaseHeight;

            // Usar la escala mínima para mantener la relación de aspecto
            const scale = Math.min(scaleX, scaleY);

            model.scale.set(scale);

            // Centrar el modelo en la pantalla
            model.x = app.renderer.width / 2;
            model.y = (app.renderer.height / 2) + (modelBaseHeight * scale * 0.2); // Ligeramente desplazado hacia abajo

            // Ajustar el ancla del modelo (si lo soporta)
            if (model.anchor) {
                model.anchor.set(0.5, 0.5);
            } else {
                // Alternativa manual si el modelo no tiene propiedad de anclaje (común en pixi-live2d-display)
                model.x -= (modelBaseWidth * scale) / 2;
                model.y -= (modelBaseHeight * scale) / 2;
            }
        }

        // Llamar a la redimensión inicial y añadir listener
        resizeModel();
        window.addEventListener('resize', resizeModel);

        // 5. Configurar interacciones
        // El plugin pixi-live2d-display maneja automáticamente el eye tracking (seguimiento del cursor)

        // Interacción para reproducir animaciones ("motions") al hacer clic
        model.on('pointerdown', () => {
            console.log('Interacción detectada: reproduciendo motion');

            // Verificamos si el modelo tiene motions configuradas
            // El grupo por defecto (o sin nombre) a menudo contiene idle/touch
            // Buscamos cuántas motions hay en el grupo sin nombre ("")
            const motionGroup = "";

            // Reproducimos una animación aleatoria si hay múltiples
            // NOTA: model.motion("", index)
            // Según la documentación: model.motion(grupo, indice)

            // Una implementación robusta comprobaría las definiciones:
            const motions = model.internalModel.motionManager.motionGroups[motionGroup];
            if (motions && motions.length > 0) {
                const randomIndex = Math.floor(Math.random() * motions.length);
                model.motion(motionGroup, randomIndex);
            } else {
                // Intento fallback si están en otro grupo (ej. 'tap_body')
                model.motion('tap_body');
            }
        });

        // Asegurar que el modelo es interactivo para recibir eventos
        model.interactive = true;
        model.buttonMode = true;

        console.log('Inicialización completada con éxito.');

    } catch (error) {
        console.error('Error al inicializar la aplicación Live2D:', error);
    }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initLive2DApp);
