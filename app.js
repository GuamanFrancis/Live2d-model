// Configurar la aplicación PixiJS
const app = new PIXI.Application({
    view: document.createElement('canvas'),
    resizeTo: window,
    autoDensity: true,
    backgroundColor: 0x333333,
    resolution: window.devicePixelRatio || 1,
});
document.body.appendChild(app.view);

// Exponer PIXI de forma global, requerido por pixi-live2d-display
window.PIXI = PIXI;

async function loadModel() {
    try {
        // Ruta al modelo. Se utiliza encodeURI para procesar correctamente caracteres asiáticos/espacios.
        const modelPath = encodeURI("sin 七大罪～魔王崇拜～/xch001_01/xch001_01.model3.json");

        // Cargar el modelo Live2D usando Live2DModel
        const { Live2DModel } = PIXI.live2d;

        console.log("Cargando modelo desde:", modelPath);
        const model = await Live2DModel.from(modelPath);

        // Añadir el modelo al stage de PixiJS
        app.stage.addChild(model);

        // Función para escalar y posicionar el modelo responsivamente
        function resizeModel() {
            // Utilizar dimensiones base del modelo interno para evitar distorsiones
            const modelWidth = model.internalModel.width;
            const modelHeight = model.internalModel.height;

            const scaleX = window.innerWidth / modelWidth;
            const scaleY = window.innerHeight / modelHeight;

            // Elegir la menor escala para mantener el aspect ratio sin que el modelo exceda la pantalla
            // Podemos también ajustar un padding
            let scale = Math.min(scaleX, scaleY) * 0.9;

            model.scale.set(scale);

            // Centrar el modelo en la pantalla
            model.x = window.innerWidth / 2;
            model.y = (window.innerHeight / 2) + (modelHeight * scale / 2) - 100; // Ajuste fino Y

            // Centrar el ancla (anchor) del modelo
            model.anchor.set(0.5, 0.5);
        }

        // Llamar inicialmente y al redimensionar la ventana
        resizeModel();
        window.addEventListener('resize', resizeModel);

        // Sistema de Interacción: Seguimiento de cursor
        // pixi-live2d-display maneja el seguimiento automáticamente.
        // Sólo hay que habilitarlo (por defecto suele estar on si FocusController está activo).

        // Sistema de Interacción: Reproducción de Animaciones al click
        model.on('pointerdown', (e) => {
            console.log("Modelo clicado!");
            // Ejecutar animación aleatoria dentro del grupo por defecto ('') si existe
            // Se le pasa el grupo (string vacío según la lectura del JSON de este modelo)
            // model.motion('', randomIndex);
            model.motion('');
        });

        console.log("Modelo cargado correctamente.");

    } catch (error) {
        console.error("Error al cargar el modelo:", error);
    }
}

// Iniciar carga
loadModel();