class Live2DApp {
    constructor() {
        this.app = null;
        this.model = null;
        this.initPixi();
        this.setupResizeHandler();
    }

    initPixi() {
        // Inicializamos la aplicación de PixiJS
        this.app = new PIXI.Application({
            view: document.createElement('canvas'),
            resizeTo: window,
            autoStart: true,
            backgroundAlpha: 0 // Fondo transparente
        });
        document.body.appendChild(this.app.view);
    }

    async loadModel(modelUrl) {
        try {
            console.log("Cargando modelo desde:", modelUrl);

            // Carga diferida del modelo Live2D
            // pixi-live2d-display abstrae la lógica de carga de moc3, texturas y motion3.json
            this.model = await PIXI.live2d.Live2DModel.from(modelUrl);

            // Agregar el modelo al escenario
            this.app.stage.addChild(this.model);

            // El modelo de pixi-live2d-display permite establecer el anclaje al centro
            this.model.anchor.set(0.5, 0.5);

            // Hacer el modelo interactivo
            this.model.interactive = true;
            this.model.buttonMode = true;

            // Escuchar el evento de click (o tap) para desencadenar animaciones
            this.model.on('pointerdown', () => {
                this.playRandomMotion();
            });

            // Ajustar el tamaño y posición inicialmente
            this.resizeModel();

            console.log("Modelo cargado exitosamente.");

        } catch (error) {
            console.error("Error al cargar el modelo Live2D:", error);
        }
    }

    playRandomMotion() {
        if (!this.model) return;

        // Ejecuta una animación del grupo "" (default) de forma aleatoria si existe
        // pixi-live2d-display gestiona el focus y las prioridades de animación automáticamente
        console.log("Desencadenando animación de toque...");
        this.model.motion('');
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            if (this.model) {
                this.resizeModel();
            }
        });
    }

    resizeModel() {
        if (!this.model) return;

        // Centrar el modelo en la pantalla
        this.model.x = window.innerWidth / 2;
        this.model.y = window.innerHeight / 2;

        // Calcular el escalado basado en el tamaño original interno del modelo para evitar distorsiones
        const modelWidth = this.model.internalModel.width;
        const modelHeight = this.model.internalModel.height;

        // Queremos que el modelo ocupe alrededor del 80% de la altura de la ventana
        const scale = (window.innerHeight * 0.8) / modelHeight;

        this.model.scale.set(scale, scale);
    }
}
