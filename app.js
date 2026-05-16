// Exponer PIXI de manera global para que pixi-live2d-display pueda usarlo
window.PIXI = PIXI;

// Archivo del modelo a cargar, usando encodeURI para manejar caracteres especiales y espacios
const modelUrl = encodeURI("sin 七大罪～魔王崇拜～/xch001_01/xch001_01.model3.json");

// Inicializar la aplicación PixiJS
const app = new PIXI.Application({
    view: document.createElement('canvas'),
    resizeTo: window,
    transparent: true,
    antialias: true
});

document.getElementById('canvas-container').appendChild(app.view);

async function loadModel() {
    try {
        // Cargar el modelo Live2D
        console.log("Iniciando la carga del modelo...");
        const model = await PIXI.live2d.Live2DModel.from(modelUrl);
        console.log("Modelo cargado exitosamente.");

        // Configurar la escala y posición del modelo de manera responsiva
        function resizeModel() {
            // Utilizar internalModel.width/height para no afectar la relación de aspecto si hubiese transformaciones previas
            const scaleX = window.innerWidth / model.internalModel.width;
            const scaleY = window.innerHeight / model.internalModel.height;

            // Elegir el scale mínimo para que el modelo se ajuste a la pantalla (como contain)
            model.scale.set(Math.min(scaleX, scaleY) * 0.9);

            model.x = window.innerWidth / 2;
            model.y = window.innerHeight / 2 + (model.internalModel.height * model.scale.y) / 4;
            // Ajustamos el punto de anclaje de forma visual
            model.anchor.set(0.5, 0.5);
        }

        resizeModel();
        window.addEventListener('resize', resizeModel);

        app.stage.addChild(model);

        // Habilitar interactividad
        model.interactive = true;

        // Eye / Head Tracking es manejado automáticamente por la librería
        // Se dispararán cuando el mouse se mueva sobre el canvas

        // Trigger de motions mediante clics (Toques)
        model.on('pointerdown', (hit) => {
            console.log("Click detectado en el modelo.");
            // Si el modelo tiene un grupo definido o animaciones, disparar uno aleatorio en el grupo ""
            // Según la estructura del model3.json, no hay un grupo nombrado, las animaciones están bajo ""
            model.motion('', Math.floor(Math.random() * 3)); // Tenemos touch1, idle, touch2
        });

        // Forzar una animación idle inicial
        model.motion('', 1);

    } catch (error) {
        console.error("Error al cargar el modelo Live2D:", error);
    }
}

// Iniciar proceso
loadModel();
