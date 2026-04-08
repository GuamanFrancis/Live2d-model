// Inicializar la aplicación de PixiJS
const app = new PIXI.Application({
    view: document.createElement('canvas'),
    autoStart: true,
    resizeTo: window,
    transparent: true,
    backgroundColor: 0x333333
});

document.getElementById('canvas-container').appendChild(app.view);

// Exponer PIXI a global para que pixi-live2d-display lo detecte
window.PIXI = PIXI;

// Instanciar el modelo Live2D
const Live2DModel = PIXI.live2d.Live2DModel;

async function initLive2D() {
    try {
        // La ruta al modelo debe estar codificada para soportar caracteres especiales
        const modelUrl = encodeURI("xch001_01/xch001_01.model3.json");

        // Cargar el modelo
        const model = await Live2DModel.from(modelUrl);

        // Añadir el modelo al escenario
        app.stage.addChild(model);

        // Función para escalar y posicionar el modelo
        const resizeModel = () => {
            // Usar dimensiones internas del modelo para evitar distorsiones
            const modelWidth = model.internalModel.width;
            const modelHeight = model.internalModel.height;

            // Calcular el factor de escala para que quepa en la pantalla
            const scaleX = window.innerWidth / modelWidth;
            const scaleY = window.innerHeight / modelHeight;

            // Tomamos el menor para mantener la proporción
            let scale = Math.min(scaleX, scaleY) * 0.9; // 90% del tamaño máximo

            // Por defecto escalamos un poco para que se vea bien centrado
            model.scale.set(scale, scale);

            // Centrar el modelo en la pantalla
            model.x = (window.innerWidth - modelWidth * scale) / 2;
            model.y = (window.innerHeight - modelHeight * scale) / 2;
        };

        // Escalar inicialmente
        resizeModel();

        // Re-escalar si cambia el tamaño de la ventana
        window.addEventListener('resize', resizeModel);

        // Interacción: Tracking ocular / de cabeza (Head Tracking)
        app.stage.interactive = true;

        // Configurar hit areas si existen para interactuar
        model.interactive = true;

        app.stage.on('pointermove', (event) => {
            // El modelo seguirá el cursor
            model.focus(event.data.global.x, event.data.global.y);
        });

        // Interacción: Ejecutar "motions" o animaciones al hacer clic
        model.on('pointerdown', (hitAreas) => {
            console.log('Clicked hitAreas:', hitAreas);
            // Intentar reproducir una animación. El JSON tiene un grupo vacío "", vamos a lanzar aleatorio
            const motionGroup = "";

            // Verificar si hay motions en este grupo
            if (model.internalModel.motionManager.motionGroups[motionGroup]) {
                const motionCount = model.internalModel.motionManager.motionGroups[motionGroup].length;
                if (motionCount > 0) {
                    // Seleccionar un índice aleatorio
                    const randomIndex = Math.floor(Math.random() * motionCount);
                    console.log(`Playing motion at index: ${randomIndex}`);
                    model.motion(motionGroup, randomIndex, 2); // 2 = Prioridad (Force)
                }
            } else {
                 console.log("No motions found in root group.");

                 // Try to force play any motion if groups aren't properly named
                 try {
                     model.motion("", 0);
                 } catch(e) {
                     console.log("Could not force play motion", e);
                 }
            }
        });

        console.log("Live2D Modelo cargado exitosamente.");

    } catch (error) {
        console.error("Error cargando el modelo Live2D:", error);
    }
}

// Iniciar
initLive2D();