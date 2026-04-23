const { Application } = PIXI;
const { Live2DModel } = PIXI.live2d;

// Main asynchronous setup function
async function main() {
    // Initialize PixiJS Application
    const app = new Application({
        view: document.getElementById('canvas'), // Optional if we just append
        resizeTo: window,
        autoStart: true,
        backgroundColor: 0x333333
    });

    // Append the canvas to the document body
    document.body.appendChild(app.view);

    // URL to the model file. Since it contains Asian characters and spaces, we encode it.
    const modelUrl = encodeURI('sin 七大罪～魔王崇拜～/xch001_01/xch001_01.model3.json');

    try {
        // Load the Live2D model
        const model = await Live2DModel.from(modelUrl);

        // Add the model to the PixiJS stage
        app.stage.addChild(model);

        // Responsive resizing logic
        const resizeModel = () => {
            // Calculate scale based on unscaled dimensions to avoid distortion
            const scaleX = innerWidth / model.internalModel.width;
            const scaleY = innerHeight / model.internalModel.height;

            // Fit the model into the window
            model.scale.set(Math.min(scaleX, scaleY));

            // Center the model
            model.x = innerWidth / 2 - (model.internalModel.width * model.scale.x) / 2;
            model.y = innerHeight / 2 - (model.internalModel.height * model.scale.y) / 2;
        };

        // Call resize initially and on window resize
        resizeModel();
        window.addEventListener('resize', resizeModel);

        // Interaction setup for cursor tracking and animation triggering

        // Ensure hit testing is enabled for the model
        model.interactive = true;

        // Note: pixi-live2d-display handles cursor tracking (eye/head movement)
        // automatically out-of-the-box via its internal InteractionManager when
        // the model is added to the stage, so we don't need manual pointermove listeners.

        // Trigger random motion on click
        app.view.addEventListener('pointerdown', () => {
             // Let's pick a random motion from the default group (empty string '')
             // Based on our analysis, the model has motions at index 0, 1, 2.
             const randomMotionIndex = Math.floor(Math.random() * 3);
             model.motion('', randomMotionIndex);
        });

    } catch (error) {
        console.error("Failed to load or setup the Live2D model:", error);
    }
}

// Run the setup
main();
