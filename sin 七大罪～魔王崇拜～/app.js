document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('canvas');

    // Initialize Pixi Application
    const app = new PIXI.Application({
        view: canvas,
        autoStart: true,
        resizeTo: window,
        backgroundColor: 0x2b2b2b,
        antialias: true
    });

    // Model path
    const modelPath = 'xch001_01/xch001_01.model3.json';

    try {
        // Load the Live2D model
        const model = await PIXI.live2d.Live2DModel.from(modelPath);

        // Add model to the stage
        app.stage.addChild(model);

        // Center the model and setup responsiveness
        const resizeModel = () => {
            // Anchor to center
            model.anchor.set(0.5, 0.5);

            // Position at center of screen
            model.x = app.screen.width / 2;
            model.y = app.screen.height / 2 + 150; // offset a bit lower

            // Calculate scale based on unscaled dimensions to fit screen height
            const scale = Math.min(
                (app.screen.height * 0.8) / model.internalModel.height,
                (app.screen.width * 0.8) / model.internalModel.width
            );

            model.scale.set(scale);
        };

        resizeModel();
        window.addEventListener('resize', resizeModel);

        // Enable Interactions
        model.interactive = true;
        model.buttonMode = true;

        // The cursor tracking (eye/head movement) is handled automatically out of the box
        // by pixi-live2d-display when pointer events happen on the app view.

        // Setup click interactions to play motions
        model.on('pointerdown', () => {
            // Retrieve available motions from the internal model
            // In this specific model3.json, motions are under the "" (empty string) group
            const motionGroup = "";
            const motionManager = model.internalModel.motionManager;

            if (motionManager && motionManager.motionGroups && motionManager.motionGroups[motionGroup]) {
                const motions = motionManager.motionGroups[motionGroup];
                if (motions && motions.length > 0) {
                    // Pick a random motion index
                    const randomIndex = Math.floor(Math.random() * motions.length);
                    console.log(`Playing motion index: ${randomIndex}`);
                    model.motion(motionGroup, randomIndex);
                }
            } else {
                 console.log("No motions found in default group.");
            }
        });

        console.log("Live2D Model Loaded Successfully!");

    } catch (error) {
        console.error("Error loading the Live2D model:", error);

        const errorText = new PIXI.Text('Error cargando el modelo. Revisa la consola.', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xff0000,
            align: 'center'
        });
        errorText.anchor.set(0.5);
        errorText.x = app.screen.width / 2;
        errorText.y = app.screen.height / 2;
        app.stage.addChild(errorText);
    }
});