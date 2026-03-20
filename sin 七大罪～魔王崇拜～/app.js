// Ensure the pixi-live2d-display namespace is properly mapped
const { Live2DModel } = PIXI.live2d;

// Main Application
const app = new PIXI.Application({
    view: document.getElementById('canvas'),
    autoStart: true,
    resizeTo: window,
    backgroundColor: 0x333333
});

// Append to DOM
document.body.appendChild(app.view);

async function main() {
    try {
        // Carga del modelo (Cubism 4.0+)
        // xch001_01 es uno de los modelos de la carpeta
        const model = await Live2DModel.from('xch001_01/xch001_01.model3.json');

        app.stage.addChild(model);

        // Posicionamiento y Escala
        model.x = app.renderer.width / 2;
        model.y = app.renderer.height / 2;
        model.anchor.set(0.5, 0.5);

        // Calcular escala para encajar en pantalla
        const scale = Math.min(
            app.renderer.width / model.width,
            app.renderer.height / model.height
        ) * 0.8;
        model.scale.set(scale);

        // Seguimiento del cursor (Eye/Head Tracking)
        app.view.addEventListener('pointermove', (e) => {
            model.focus(e.clientX, e.clientY);
        });

        // Interacción: Ejecutar una animación al hacer clic
        // pixi-live2d-display expone eventos de interacción
        model.on('hit', (hitAreas) => {
            if (hitAreas.includes('Head') || hitAreas.includes('Body')) {
                // Tocar la cabeza o el cuerpo ejecutará la animación 'touch'
                model.motion('touch');
            }
        });

        // Alternativamente, si tocamos en cualquier lado, ejecutamos animación genérica si existe
        app.view.addEventListener('pointerdown', () => {
             // Iniciar animación del primer grupo de motions, indice 0
             // Generalmente las motions están en el grupo '' (default) o 'tap_body', etc.
             // Aquí le pasamos el nombre del grupo de motion que vimos en el JSON, en este caso ""
             model.motion('', 0);
        });

        console.log("Modelo Live2D cargado correctamente.");

    } catch (error) {
        console.error("Error al cargar el modelo:", error);
    }
}

// Iniciar
main();
