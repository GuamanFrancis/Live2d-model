/**
 * Live2D PoC Architecture
 * Implementación minimalista y robusta utilizando PixiJS y pixi-live2d-display
 */

class Live2DApp {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.app = null;
        this.model = null;

        // Configuration
        this.modelPath = "sin 七大罪～魔王崇拜～/ych001_01/ych001_01.model3.json";

        this.init();
    }

    async init() {
        // 1. Inicializar PixiJS Application
        this.app = new PIXI.Application({
            view: document.createElement('canvas'),
            resizeTo: window,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
            backgroundColor: 0x333333,
            antialias: true
        });

        this.container.appendChild(this.app.view);

        // 2. Configurar Live2D Model
        await this.loadModel();

        // 3. Registrar eventos de ventana
        window.addEventListener('resize', this.onResize.bind(this));
    }

    async loadModel() {
        try {
            // Utilizamos encodeURI para manejar correctamente caracteres asiáticos y espacios en la ruta local
            const modelUrl = encodeURI(this.modelPath);

            // Cargar el modelo
            this.model = await PIXI.live2d.Live2DModel.from(modelUrl);

            // Configurar interactividad
            this.model.interactive = true;
            this.model.buttonMode = true;

            // Centrar anclaje
            this.model.anchor.set(0.5, 0.5);

            // Ajustar posición y escala inicial
            this.onResize();

            // Interacción: Ejecutar una animación al hacer click
            this.model.on('pointerdown', () => {
                console.log("Model clicked, playing motion...");
                // Iniciar un motion aleatorio (usa grupo vacío por defecto si no hay grupos nombrados)
                this.model.motion('', 0);
            });

            // Añadir al stage de PixiJS
            this.app.stage.addChild(this.model);

            console.log("Model loaded successfully!");
        } catch (error) {
            console.error("Error loading Live2D model:", error);
        }
    }

    onResize() {
        if (!this.model) return;

        // Centrar modelo en la pantalla
        this.model.x = this.app.renderer.width / 2;
        this.model.y = this.app.renderer.height / 2;

        // Escalar modelo para que encaje en la pantalla utilizando dimensiones no escaladas
        const scaleX = this.app.renderer.width / this.model.internalModel.width;
        const scaleY = this.app.renderer.height / this.model.internalModel.height;

        // Usar la escala más pequeña para mantener el aspecto y asegurar que encaje en la vista
        const scale = Math.min(scaleX, scaleY) * 0.8; // 80% del tamaño disponible para dar margen

        this.model.scale.set(scale, scale);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    new Live2DApp('canvas-container');
});
