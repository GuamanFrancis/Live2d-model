/**
 * PoC: Renderización e Interacción Live2D (Cubism 4.0+)
 * @author Arquitecto de Software Senior
 * @description Prueba de Concepto utilizando PixiJS y pixi-live2d-display.
 *              Incluye carga asíncrona, escalado responsivo y tracking del cursor.
 */

// Extraer las clases necesarias de la librería
const { Application } = PIXI;
const { Live2DModel } = PIXI.live2d;

// Configuración principal de la aplicación PixiJS
const app = new Application({
    view: document.createElement('canvas'),
    autoDensity: true,
    resizeTo: window,
    backgroundColor: 0x2c3e50,
    resolution: window.devicePixelRatio || 1,
});

// Inyectar el canvas en el contenedor HTML
document.getElementById('canvas-container').appendChild(app.view);

/**
 * Función principal asíncrona para inicializar y gestionar el modelo.
 */
async function initLive2D() {
    try {
        // Ruta al manifiesto del modelo.
        // La librería resolverá automáticamente los paths relativos a moc3, texturas y motions.
        const modelUrl = 'xch001_01/xch001_01.model3.json';

        // 1. Cargar el modelo de forma asíncrona
        const model = await Live2DModel.from(modelUrl);

        // Ocultar el indicador de carga en la UI
        document.getElementById('loading').classList.add('hidden');

        // 2. Añadir el modelo a la escena
        app.stage.addChild(model);

        // 3. Sistema de Interacción: Seguimiento del Cursor (Tracking)
        // El tracking de cursor requiere que el modelo o la aplicación sean interactivos.
        // Habilitamos la interactividad en la etapa principal de PixiJS.
        app.stage.interactive = true;

        // Escuchar el evento de movimiento del puntero
        app.stage.on('pointermove', (event) => {
            // El método focus(x, y) de pixi-live2d-display traduce automáticamente
            // las coordenadas globales de la pantalla a valores normalizados
            // que el SDK de Cubism requiere para girar los parámetros de los ojos/cabeza.
            model.focus(event.data.global.x, event.data.global.y);
        });

        // 4. Sistema de Animación: Ejecución de Motions al hacer clic
        model.on('pointertap', () => {
            // Se puede desencadenar una animación específica por nombre de grupo.
            // Si el nombre del grupo no está definido (""), podemos intentar llamar
            // un índice, o la librería reproducirá una por defecto/aleatoria si configuramos hit areas.

            // Para fines de esta PoC, pedimos que reproduzca un motion aleatorio
            model.motion('');
        });

        // 5. Gestión del Redimensionamiento Responsivo
        function resizeModel() {
            // IMPORTANTE: Según las directrices de la arquitectura, para evitar distorsión
            // debemos calcular el factor de escala basándonos en las dimensiones *no escaladas*
            // del internalModel, y no en model.width/height que ya han sido mutadas.
            const internalWidth = model.internalModel.width;
            const internalHeight = model.internalModel.height;

            if (internalWidth === 0 || internalHeight === 0) return;

            // Determinar la escala necesaria para que el modelo se ajuste
            // verticalmente al 80% de la altura de la pantalla (como ejemplo estético).
            const targetHeight = app.screen.height * 0.8;
            const scale = targetHeight / internalHeight;

            // Aplicar escala uniforme
            model.scale.set(scale, scale);

            // Centrar el modelo horizontalmente y anclarlo a la parte inferior (suponiendo que
            // el anclaje predeterminado de Live2D suele estar en el centro/arriba, ajustamos manualmente)
            // Calculamos las nuevas dimensiones escaladas
            const scaledWidth = internalWidth * scale;
            const scaledHeight = internalHeight * scale;

            model.x = (app.screen.width - scaledWidth) / 2;

            // Posicionar verticalmente: Centrar un poco más abajo del medio
            model.y = app.screen.height - scaledHeight;
        }

        // Ejecutar el redimensionamiento inicial
        resizeModel();

        // Escuchar cambios de tamaño en la ventana
        window.addEventListener('resize', resizeModel);

    } catch (error) {
        console.error('Error al inicializar el modelo Live2D:', error);
        document.getElementById('loading').textContent = 'Error al cargar el modelo.';
    }
}

// Iniciar el proceso
initLive2D();