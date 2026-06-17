// Expose PIXI globally for pixi-live2d-display to function correctly
window.PIXI = PIXI;

class Live2DManager {
    constructor() {
        this.app = null;
        this.model = null;
        this.containerId = 'canvas-container';
        // Ensure to encode URI for special characters (like Chinese characters) in paths
        this.modelUrl = encodeURI("xch001_01/xch001_01.model3.json");
    }

    async init() {
        console.log("Inicializando aplicación PixiJS...");
        // Initialize the PixiJS Application
        this.app = new PIXI.Application({
            view: document.createElement('canvas'),
            resizeTo: window,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
            backgroundColor: 0x2b2b2b
        });

        document.getElementById(this.containerId).appendChild(this.app.view);

        await this.loadModel();

        // Handle window resizing to keep the model centered and scaled
        window.addEventListener('resize', () => this.onResize());
    }

    async loadModel() {
        console.log(`Cargando modelo Live2D desde: ${this.modelUrl}`);
        try {
            // Load the model using pixi-live2d-display
            this.model = await PIXI.live2d.Live2DModel.from(this.modelUrl);
            console.log("Modelo cargado exitosamente.");

            // Add the model to the PixiJS stage
            this.app.stage.addChild(this.model);

            // Anchor point set to center for easier positioning
            this.model.anchor.set(0.5, 0.5);

            // Enable interactivity for pointer events (motions, etc.)
            this.model.interactive = true;
            this.model.buttonMode = true;

            // Setup interactions
            this.setupInteractions();

            // Initial positioning
            this.onResize();

        } catch (error) {
            console.error("Error al cargar el modelo Live2D:", error);
        }
    }

    setupInteractions() {
        if (!this.model) return;

        // pixi-live2d-display handles cursor tracking automatically.
        // We only need to listen for pointerdown to trigger motions.
        this.model.on('pointerdown', () => {
            console.log("Clic detectado en el modelo, activando motion aleatorio...");
            // Execute a motion from the default group (empty string '')
            // Often, touch motions are in a specific group, but if none exist or it's empty, we use ''
            const hitAreaCount = this.model.internalModel.motionManager.motionGroups[''] ? this.model.internalModel.motionManager.motionGroups[''].length : 0;

            if (hitAreaCount > 0) {
                 // Trigger a random motion from the unnamed group
                 const randomIndex = Math.floor(Math.random() * hitAreaCount);
                 this.model.motion('', randomIndex);
            } else {
                 console.log("No se encontraron motions en el grupo por defecto ('').");
                 // fallback if there's a specific 'Tap' or 'Idle' group
                 // In xch001_01.model3.json, motions are in group ''
            }
        });
    }

    onResize() {
        if (!this.model) return;

        // Center the model
        this.model.x = this.app.renderer.width / 2;
        this.model.y = this.app.renderer.height / 2;

        // Calculate scale to fit the screen while maintaining aspect ratio
        // Use internalModel dimensions to prevent distortion
        const modelWidth = this.model.internalModel.width;
        const modelHeight = this.model.internalModel.height;

        const scaleX = (this.app.renderer.width * 0.8) / modelWidth;
        const scaleY = (this.app.renderer.height * 0.8) / modelHeight;

        // Use the smaller scale to fit entirely within the screen, or adjust as needed
        const scale = Math.min(scaleX, scaleY);

        this.model.scale.set(scale, scale);
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const live2dManager = new Live2DManager();
    live2dManager.init();
});
