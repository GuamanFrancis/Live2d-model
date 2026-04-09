// Importamos Live2DModel del namespace global creado por pixi-live2d-display
const { Live2DModel } = PIXI.live2d;

// Creamos la aplicación PixiJS
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
});

document.body.appendChild(app.view);

async function init() {
    try {
        // Asegurarse de codificar la URL correctamente por si hay caracteres especiales
        // El modelo a cargar será xch001_01
        const modelPath = encodeURI('./xch001_01/xch001_01.model3.json');

        // Cargamos el modelo
        console.log("Cargando modelo:", modelPath);
        const model = await Live2DModel.from(modelPath);

        // Agregamos el modelo a la escena
        app.stage.addChild(model);

        // Escalamos y posicionamos el modelo
        // Utilizamos el tamaño interno para evitar distorsiones
        const scaleX = innerWidth / model.internalModel.width;
        const scaleY = innerHeight / model.internalModel.height;

        // Mantener la relación de aspecto y ajustarlo al 80% de la altura de la pantalla
        model.scale.set(Math.min(scaleX, scaleY) * 0.8);

        // Centrar en la pantalla
        model.x = (innerWidth - model.width) / 2;
        model.y = (innerHeight - model.height) / 2;

        console.log("Modelo cargado exitosamente.");

        // --- SISTEMA DE INTERACCIÓN ---

        // 1. Seguimiento del ratón (Eye/Head Tracking)
        app.stage.interactive = true;
        app.stage.on('pointermove', (e) => {
            // Pasamos las coordenadas globales directamente al método focus()
            model.focus(e.data.global.x, e.data.global.y);
        });

        // 2. Sistema de animaciones y clics
        model.interactive = true;
        model.buttonMode = true;

        model.on('pointertap', () => {
            console.log("Tap detectado en el modelo.");
            // Intentar reproducir una animación aleatoria al hacer clic
            // En SDK 4.0, 'tap_body' suele ser un grupo por defecto, o podemos intentar reproducir cualquiera
            // Primero, imprimimos los grupos de animación disponibles:
            console.log("Grupos de animaciones disponibles:", Object.keys(model.internalModel.motionManager.motionGroups));

            // Forzamos que intente reproducir una animación de reacción (Touch) si existe
            // Observando la estructura de archivos suele haber "touch1", etc. en las carpetas
            const motionManager = model.internalModel.motionManager;
            const groups = Object.keys(motionManager.motionGroups);

            if (groups.length > 0) {
                // Selecciona un grupo que no sea Idle si es posible
                const interactionGroups = groups.filter(g => g.toLowerCase() !== 'idle');
                const targetGroup = interactionGroups.length > 0 ? interactionGroups[0] : groups[0];

                model.motion(targetGroup);
                console.log(`Reproduciendo animación del grupo: ${targetGroup}`);
            }
        });

        // Manejo de redimensionamiento de ventana
        window.addEventListener('resize', () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            const newScaleX = window.innerWidth / model.internalModel.width;
            const newScaleY = window.innerHeight / model.internalModel.height;
            model.scale.set(Math.min(newScaleX, newScaleY) * 0.8);
            model.x = (window.innerWidth - model.width) / 2;
            model.y = (window.innerHeight - model.height) / 2;
        });

    } catch (error) {
        console.error("Error al cargar el modelo Live2D:", error);
    }
}

// Iniciar aplicación
init();