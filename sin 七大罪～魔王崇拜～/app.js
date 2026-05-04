// Configurar la aplicación de PixiJS
const app = new PIXI.Application({
    view: document.createElement('canvas'),
    resizeTo: window,
    autoStart: true,
    backgroundColor: 0x333333,
    resolution: window.devicePixelRatio || 1,
});

document.body.appendChild(app.view);

// Exponer PIXI al contexto global para pixi-live2d-display
window.PIXI = PIXI;

async function loadModel() {
    try {
        // Codificar la ruta en caso de caracteres especiales
        const modelUrl = encodeURI('./xch001_01/xch001_01.model3.json');

        // Cargar el modelo
        const model = await PIXI.live2d.Live2DModel.from(modelUrl);

        app.stage.addChild(model);

        // Función para escalar y centrar el modelo
        const resizeModel = () => {
            const scaleX = app.renderer.width / model.internalModel.width;
            const scaleY = app.renderer.height / model.internalModel.height;

            // Usar el menor scale para mantener el aspect ratio sin cortar el modelo
            const scale = Math.min(scaleX, scaleY) * 0.9;

            model.scale.set(scale);
            model.x = (app.renderer.width - model.internalModel.width * scale) / 2;
            model.y = (app.renderer.height - model.internalModel.height * scale) / 2;
        };

        // Escalar inicialmente
        resizeModel();

        // Escalar al cambiar el tamaño de la ventana
        window.addEventListener('resize', resizeModel);

        let motionIndex = 0;
        // Interacción: Reproducir una animación al hacer clic
        model.on('pointerdown', () => {
            model.motion('', motionIndex);
            motionIndex = (motionIndex + 1) % 3;
        });

        // Hacer el modelo interactivo
        model.interactive = true;

    } catch (error) {
        console.error("Error al cargar el modelo Live2D:", error);
    }
}

// Iniciar la carga
loadModel();
