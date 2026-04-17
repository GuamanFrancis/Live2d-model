// Inicializar PixiJS Application
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x333333,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
});

document.body.appendChild(app.view);

// Exponer PIXI globalmente para pixi-live2d-display
window.PIXI = PIXI;

// Modelo a cargar
const modelUrl = 'xch001_01/xch001_01.model3.json';

async function loadModel() {
    try {
        console.log("Cargando modelo Live2D:", modelUrl);
        // Cargar el modelo usando pixi-live2d-display
        const model = await PIXI.live2d.Live2DModel.from(modelUrl);

        // Añadir el modelo al stage
        app.stage.addChild(model);

        // Configurar escala basada en un tamaño deseado
        // Usamos model.internalModel.width / height como dice la recomendación de memoria
        const baseWidth = model.internalModel.width;
        const baseHeight = model.internalModel.height;

        // Escalar para que ocupe una porción razonable de la pantalla
        const scale = Math.min(
            app.screen.width / baseWidth,
            app.screen.height / baseHeight
        ) * 0.9; // 90% del espacio disponible

        model.scale.set(scale);

        // Centrar el modelo en la pantalla
        model.x = app.screen.width / 2 - (baseWidth * scale) / 2;
        model.y = app.screen.height / 2 - (baseHeight * scale) / 2;

        console.log("Modelo cargado exitosamente.");

        // Interacción: Tracking de mirada
        app.view.addEventListener('pointermove', (e) => {
            if (model.internalModel && model.internalModel.focusController) {
                // Convertir coordenadas del ratón a coordenadas normalizadas (-1 a 1)
                const x = (e.clientX / app.screen.width) * 2 - 1;
                const y = (e.clientY / app.screen.height) * 2 - 1;

                model.internalModel.focusController.focus(x, -y);
            }
        });

        // Interacción: Click / Tap (Ejecutar animación "touch" si está disponible)
        app.view.addEventListener('pointerdown', () => {
            console.log("Trigger touch interaction.");
            // En el json vimos: "Motions": {"": [{"File": "motions/touch1.motion3.json"}, ...]}
            // Así que el grupo de animaciones está en la cadena vacía ""
            model.motion('', 0); // Ejecuta la primera animación (touch1)
        });

        // Ajustar el tamaño si se redimensiona la ventana
        window.addEventListener('resize', () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            const newScale = Math.min(
                app.screen.width / baseWidth,
                app.screen.height / baseHeight
            ) * 0.9;
            model.scale.set(newScale);
            model.x = app.screen.width / 2 - (baseWidth * newScale) / 2;
            model.y = app.screen.height / 2 - (baseHeight * newScale) / 2;
        });

    } catch (error) {
        console.error("Error al cargar el modelo:", error);
    }
}

// Iniciar la carga
loadModel();
