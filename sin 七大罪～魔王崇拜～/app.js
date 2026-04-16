// Proof of Concept - Live2D Rendering Architecture
// Autor: Senior Software Architect

const initLive2D = async () => {
    // 1. Setup the Pixi Application
    const app = new PIXI.Application({
        resizeTo: window,
        autoStart: true,
        backgroundColor: 0x333333,
    });

    // Add canvas to the DOM explicitly
    document.body.appendChild(app.view);

    // 2. Load the Live2D Model
    // We encode the URI to handle special characters (like Japanese characters in folder names)
    const modelPath = encodeURI('./xch001_01/xch001_01.model3.json');

    try {
        const model = await PIXI.live2d.Live2DModel.from(modelPath);

        // 3. Scaling and Positioning (Responsive)
        const updateModelScale = () => {
            // Using internal model dimensions to prevent distortion
            const internalWidth = model.internalModel.width;
            const internalHeight = model.internalModel.height;

            // Calculate scale to fit inside window while maintaining aspect ratio
            const scaleX = window.innerWidth / internalWidth;
            const scaleY = window.innerHeight / internalHeight;

            // Apply a slight reduction (0.9) to leave a margin
            const scale = Math.min(scaleX, scaleY) * 0.9;

            model.scale.set(scale, scale);

            // Center the model
            model.x = (window.innerWidth - internalWidth * scale) / 2;
            model.y = (window.innerHeight - internalHeight * scale) / 2;
        };

        // Initial setup and listener for window resizing
        updateModelScale();
        window.addEventListener('resize', updateModelScale);

        // Add the model to the Pixi stage
        app.stage.addChild(model);

        // 4. Interaction Systems

        // A. Eye/Head Tracking
        app.view.addEventListener('pointermove', (event) => {
            // Convert pointer coordinates to model's local coordinate space
            // focus works in range [-1, 1]
            // We map the window coordinates to this range
            const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            const mouseY = (event.clientY / window.innerHeight) * 2 - 1;

            // Multiply by a factor (e.g., 2) to increase the sensitivity of the movement
            model.internalModel.focusController.focus(mouseX * 2, mouseY * 2);
        });

        // B. Motions Trigger
        // Trigger a random animation on pointerdown (click/touch)
        app.view.addEventListener('pointerdown', () => {
             // The xch001_01 model has 3 motions under the empty group ("")
             // Indices: 0, 1, 2
             const randomMotionIndex = Math.floor(Math.random() * 3);

             console.log(`Triggering motion index: ${randomMotionIndex}`);
             model.motion('', randomMotionIndex);
        });

        console.log("Live2D Model initialized successfully");

    } catch (error) {
        console.error("Error loading Live2D model:", error);
    }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initLive2D();
});
