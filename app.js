// Init PIXI App
const app = new PIXI.Application({
    view: document.createElement('canvas'),
    resizeTo: window,
    autoStart: true,
    backgroundColor: 0x333333,
});
document.body.appendChild(app.view);

// Configure Live2D Model
const modelUrl = encodeURI('sin 七大罪～魔王崇拜～/xch001_01/xch001_01.model3.json');

async function init() {
    try {
        console.log("Loading model from:", modelUrl);
        // Load the model
        const model = await PIXI.live2d.Live2DModel.from(modelUrl);

        // Add to stage
        app.stage.addChild(model);

        // Scale and position
        const scaleX = innerWidth / model.internalModel.width;
        const scaleY = innerHeight / model.internalModel.height;
        model.scale.set(Math.min(scaleX, scaleY) * 0.8);

        model.x = innerWidth / 2;
        model.y = innerHeight / 2;
        model.anchor.set(0.5, 0.5);

        // Eye tracking / Mouse follow is enabled by default in pixi-live2d-display

        // Handle clicks for motion playback
        model.on('pointertap', () => {
            console.log('Model tapped! Playing random motion.');
            // Play a random motion from any group, or a specific group if we knew it
            // By passing an empty string, it plays a random motion from the default group or similar
            model.motion('');
        });

        console.log("Model loaded successfully!");
    } catch (e) {
        console.error("Failed to load model:", e);
    }
}

init();
