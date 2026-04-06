// PoC Live2D SDK 4.0+ using PixiJS and pixi-live2d-display

// Configura PIXI para usar Live2D
const { Application } = PIXI;
const { Live2DModel } = PIXI.live2d;

// La ruta del modelo codificada correctamente (maneja espacios y caracteres asiáticos)
const modelPath = encodeURI('sin 七大罪～魔王崇拜～/xch001_01/xch001_01.model3.json');

async function init() {
    // 1. Inicializa la aplicación Pixi
    const app = new Application({
        view: document.createElement('canvas'),
        resizeTo: window,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        transparent: true,
        backgroundAlpha: 0 // Fondo transparente
    });

    document.getElementById('canvas-container').appendChild(app.view);

    try {
        // 2. Carga el modelo Live2D
        const model = await Live2DModel.from(modelPath);

        // 3. Añade el modelo a la escena
        app.stage.addChild(model);

        // 4. Lógica de redimensionamiento (usando unscaled dimensions para evitar distorsiones)
        function resizeModel() {
            const scaleX = window.innerWidth / model.internalModel.width;
            const scaleY = window.innerHeight / model.internalModel.height;

            // Mantiene el aspecto, escala al tamaño que quepa en la ventana (cover)
            model.scale.set(Math.min(scaleX, scaleY) * 0.8);

            // Centra el modelo
            model.x = window.innerWidth / 2;
            model.y = window.innerHeight / 2 + (model.internalModel.height * model.scale.y * 0.2); // Un poco más abajo
            model.anchor.set(0.5, 0.5);
        }

        resizeModel();
        window.addEventListener('resize', resizeModel);

        // 5. Interacción: Mouse/Head Tracking
        app.view.addEventListener('pointermove', (event) => {
            const rect = app.view.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Transforma coordenadas relativas a la pantalla [-1, 1]
            const focusX = (x / window.innerWidth) * 2 - 1;
            const focusY = (y / window.innerHeight) * 2 - 1;

            model.focus(focusX, focusY);
        });

        // 6. Interacción: Clics / Motions
        app.view.addEventListener('pointerdown', (event) => {
            // Reproducir movimiento aleatorio o táctil
            model.motion('touch1'); // Reproduce la motion de touch

            // Resetea el tracking brevemente si es necesario
            model.focus(0,0);
        });

        console.log("Live2D Modelo cargado correctamente.");

    } catch (error) {
        console.error("Error al cargar el modelo Live2D:", error);
    }
}

// Inicia la aplicación
init();