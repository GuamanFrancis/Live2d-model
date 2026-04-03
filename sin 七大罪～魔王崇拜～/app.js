const { Live2DModel } = PIXI.live2d;

// Main asynchronous function to initialize the application
async function initApp() {
    const canvas = document.getElementById('canvas');

    // Initialize PixiJS Application
    const app = new PIXI.Application({
        view: canvas,
        autoDensity: true,
        resizeTo: window,
        backgroundColor: 0x333333,
        resolution: window.devicePixelRatio || 1
    });

    // Model path - using one of the models in the directory
    const modelPath = 'xch001_01/xch001_01.model3.json';

    try {
        console.log("Loading model from:", modelPath);

        // Load the Live2D model
        const model = await Live2DModel.from(modelPath);

        // Add the model to the stage
        app.stage.addChild(model);

        // Resize logic to keep the model centered and scaled appropriately
        const resizeModel = () => {
            // Using model.internalModel.width/height to prevent distortion during resize
            const baseWidth = model.internalModel.width;
            const baseHeight = model.internalModel.height;

            // Calculate scale to fit the screen height primarily
            const scaleX = window.innerWidth / baseWidth;
            const scaleY = window.innerHeight / baseHeight;
            const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of screen size to leave some margin

            model.scale.set(scale, scale);

            // Center the model
            model.x = (window.innerWidth - baseWidth * scale) / 2;
            model.y = (window.innerHeight - baseHeight * scale) / 2;
        };

        // Call resize initially and on window resize
        resizeModel();
        window.addEventListener('resize', resizeModel);

        // Interaction: Make the model draggable (optional but good for PoC)
        model.on('pointerdown', (e) => {
            model.dragging = true;
            model.dragOrigin = { x: e.data.global.x - model.x, y: e.data.global.y - model.y };
        });

        app.stage.on('pointerup', () => { model.dragging = false; });
        app.stage.on('pointerupoutside', () => { model.dragging = false; });

        // Ensure interactions are enabled
        model.interactive = true;
        model.buttonMode = true;

        // Interaction: Eye/Head Tracking
        // The pixi-live2d-display library automatically handles cursor tracking if configured,
        // but we need to ensure the stage is interactive to capture global mouse events.
        app.stage.interactive = true;
        app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000); // large hit area

        // Explicitly passing pointer events to the model's focus controller for eye/head tracking
        app.stage.on('pointermove', (e) => {
            // Drag logic
            if (model.dragging) {
                model.x = e.data.global.x - model.dragOrigin.x;
                model.y = e.data.global.y - model.dragOrigin.y;
            }
            // Eye tracking logic
            model.focus(e.data.global.x, e.data.global.y);
        });

        // Tap interactions (triggering default tap motions if they exist)
        model.on('pointertap', () => {
            // Randomly trigger a motion from the idle or tap group if available
            // Usually, pixi-live2d-display triggers motions on tap automatically based on hit areas,
            // but we can manually force a random motion here for demonstration.
            try {
                model.motion('Tap', 0, 3); // Attempt to play a Tap motion
            } catch (e) {
                console.log("No Tap motion found or error playing motion", e);
            }
        });

        console.log("Model initialized successfully.");

    } catch (error) {
        console.error("Error loading Live2D model:", error);
    }
}

// Start the application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp);
