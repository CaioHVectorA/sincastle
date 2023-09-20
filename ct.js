/*! Made with ct.js http://ctjs.rocks/ */

if (location.protocol === 'file:') {
    // eslint-disable-next-line no-alert
    alert('Your game won\'t work like this because\nWeb 👏 builds 👏 require 👏 a web 👏 server!\n\nConsider using a desktop build, or upload your web build to itch.io, GameJolt or your own website.\n\nIf you haven\'t created this game, please contact the developer about this issue.\n\n Also note that ct.js games do not work inside the itch app; you will need to open the game with your browser of choice.');
}

const deadPool = []; // a pool of `kill`-ed copies for delaying frequent garbage collection
const copyTypeSymbol = Symbol('I am a ct.js copy');
setInterval(function cleanDeadPool() {
    deadPool.length = 0;
}, 1000 * 60);

/**
 * The ct.js library
 * @namespace
 */
const ct = {
    /**
     * A target number of frames per second. It can be interpreted as a second in timers.
     * @type {number}
     */
    speed: [60][0] || 60,
    templates: {},
    snd: {},
    stack: [],
    fps: [60][0] || 60,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * Use ct.delta to balance your movement and other calculations on different framerates by
     * multiplying it with your reference value.
     *
     * Note that `this.move()` already uses it, so there is no need to premultiply
     * `this.speed` with it.
     *
     * **A minimal example:**
     * ```js
     * this.x += this.windSpeed * ct.delta;
     * ```
     *
     * @template {number}
     */
    delta: 1,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * This is a version for UI elements, as it is not affected by time scaling, and thus works well
     * both with slow-mo effects and game pause.
     *
     * @template {number}
     */
    deltaUi: 1,
    /**
     * The camera that outputs its view to the renderer.
     * @template {Camera}
     */
    camera: null,
    /**
     * ct.js version in form of a string `X.X.X`.
     * @template {string}
     */
    version: '2.0.2',
    meta: [{"name":"","author":"","site":"","version":"0.0.0"}][0],
    get width() {
        return ct.pixiApp.renderer.view.width;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New width in pixels
     * @template {number}
     */
    set width(value) {
        ct.camera.width = ct.roomWidth = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(value, ct.height);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    get height() {
        return ct.pixiApp.renderer.view.height;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New height in pixels
     * @template {number}
     */
    set height(value) {
        ct.camera.height = ct.roomHeight = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(ct.width, value);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    }
};

// eslint-disable-next-line no-console
console.log(
    `%c 😺 %c ct.js game editor %c v${ct.version} %c https://ctjs.rocks/ `,
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;',
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;'
);

ct.highDensity = [true][0];
const pixiAppSettings = {
    width: [1280][0],
    height: [720][0],
    antialias: ![false][0],
    powerPreference: 'high-performance',
    sharedTicker: false,
    sharedLoader: true
};
try {
    /**
     * The PIXI.Application that runs ct.js game
     * @template {PIXI.Application}
     */
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
} catch (e) {
    console.error(e);
    // eslint-disable-next-line no-console
    console.warn('[ct.js] Something bad has just happened. This is usually due to hardware problems. I\'ll try to fix them now, but if the game still doesn\'t run, try including a legacy renderer in the project\'s settings.');
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
}

PIXI.settings.ROUND_PIXELS = [false][0];
ct.pixiApp.ticker.maxFPS = [60][0] || 0;
if (!ct.pixiApp.renderer.options.antialias) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
}
/**
 * @template PIXI.Container
 */
ct.stage = ct.pixiApp.stage;
ct.pixiApp.renderer.autoDensity = ct.highDensity;
document.getElementById('ct').appendChild(ct.pixiApp.view);

/**
 * A library of different utility functions, mainly Math-related, but not limited to them.
 * @namespace
 */
ct.u = {
    /**
     * Get the environment the game runs on.
     * @returns {string} Either 'ct.ide', or 'nw', or 'electron', or 'browser'.
     */
    getEnvironment() {
        if (window.name === 'ct.js debugger') {
            return 'ct.ide';
        }
        try {
            if (nw.require) {
                return 'nw';
            }
        } catch (oO) {
            void 0;
        }
        try {
            require('electron');
            return 'electron';
        } catch (Oo) {
            void 0;
        }
        return 'browser';
    },
    /**
     * Get the current operating system the game runs on.
     * @returns {string} One of 'windows', 'darwin' (which is MacOS), 'linux', or 'unknown'.
     */
    getOS() {
        const ua = window.navigator.userAgent;
        if (ua.indexOf('Windows') !== -1) {
            return 'windows';
        }
        if (ua.indexOf('Linux') !== -1) {
            return 'linux';
        }
        if (ua.indexOf('Mac') !== -1) {
            return 'darwin';
        }
        return 'unknown';
    },
    /**
     * Returns the length of a vector projection onto an X axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldx(l, d) {
        return l * Math.cos(d * Math.PI / 180);
    },
    /**
     * Returns the length of a vector projection onto an Y axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldy(l, d) {
        return l * Math.sin(d * Math.PI / 180);
    },
    /**
     * Returns the direction of a vector that points from the first point to the second one.
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The angle of the resulting vector, in degrees
     */
    pdn(x1, y1, x2, y2) {
        return (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 360) % 360;
    },
    // Point-point DistanCe
    /**
     * Returns the distance between two points
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The distance between the two points
     */
    pdc(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    /**
     * Convers degrees to radians
     * @param {number} deg The degrees to convert
     * @returns {number} The resulting radian value
     */
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    /**
     * Convers radians to degrees
     * @param {number} rad The radian value to convert
     * @returns {number} The resulting degree
     */
    radToDeg(rad) {
        return rad / Math.PI * 180;
    },
    /**
     * Rotates a vector (x; y) by `deg` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} deg The degree to rotate by
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotate(x, y, deg) {
        return ct.u.rotateRad(x, y, ct.u.degToRad(deg));
    },
    /**
     * Rotates a vector (x; y) by `rad` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} rad The radian value to rotate around
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotateRad(x, y, rad) {
        const sin = Math.sin(rad),
              cos = Math.cos(rad);
        return new PIXI.Point(
            cos * x - sin * y,
            cos * y + sin * x
        );
    },
    /**
     * Gets the most narrow angle between two vectors of given directions
     * @param {number} dir1 The direction of the first vector
     * @param {number} dir2 The direction of the second vector
     * @returns {number} The resulting angle
     */
    deltaDir(dir1, dir2) {
        dir1 = ((dir1 % 360) + 360) % 360;
        dir2 = ((dir2 % 360) + 360) % 360;
        var t = dir1,
            h = dir2,
            ta = h - t;
        if (ta > 180) {
            ta -= 360;
        }
        if (ta < -180) {
            ta += 360;
        }
        return ta;
    },
    /**
     * Returns a number in between the given range (clamps it).
     * @param {number} min The minimum value of the given number
     * @param {number} val The value to fit in the range
     * @param {number} max The maximum value of the given number
     * @returns {number} The clamped value
     */
    clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
    },
    /**
     * Linearly interpolates between two values by the apha value.
     * Can also be describing as mixing between two values with a given proportion `alpha`.
     * @param {number} a The first value to interpolate from
     * @param {number} b The second value to interpolate to
     * @param {number} alpha The mixing value
     * @returns {number} The result of the interpolation
     */
    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    },
    /**
     * Returns the position of a given value in a given range. Opposite to linear interpolation.
     * @param  {number} a The first value to interpolate from
     * @param  {number} b The second value to interpolate top
     * @param  {number} val The interpolated values
     * @return {number} The position of the value in the specified range.
     * When a <= val <= b, the result will be inside the [0;1] range.
     */
    unlerp(a, b, val) {
        return (val - a) / (b - a);
    },
    /**
     * Re-maps the given value from one number range to another.
     * @param  {number} val The value to be mapped
     * @param  {number} inMin Lower bound of the value's current range
     * @param  {number} inMax Upper bound of the value's current range
     * @param  {number} outMin Lower bound of the value's target range
     * @param  {number} outMax Upper bound of the value's target range
     * @returns {number} The mapped value.
     */
    map(val, inMin, inMax, outMin, outMax) {
        return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        return ct.camera.uiToGameCoord(x, y);
    },
    /**
     * Translates a point from fame space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        return ct.camera.gameToUiCoord(x, y);
    },
    hexToPixi(hex) {
        return Number('0x' + hex.slice(1));
    },
    pixiToHex(pixi) {
        return '#' + (pixi).toString(16).padStart(6, 0);
    },
    /**
     * Tests whether a given point is inside the given rectangle
     * (it can be either a copy or an array).
     * @param {number} x The x coordinate of the point.
     * @param {number} y The y coordinate of the point.
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a rectangular shape)
     * or an array in a form of [x1, y1, x2, y2], where (x1;y1) and (x2;y2) specify
     * the two opposite corners of the rectangle.
     * @returns {boolean} `true` if the point is inside the rectangle, `false` otherwise.
     */
    prect(x, y, arg) {
        var xmin, xmax, ymin, ymax;
        if (arg.splice) {
            xmin = Math.min(arg[0], arg[2]);
            xmax = Math.max(arg[0], arg[2]);
            ymin = Math.min(arg[1], arg[3]);
            ymax = Math.max(arg[1], arg[3]);
        } else {
            xmin = arg.x - arg.shape.left * arg.scale.x;
            xmax = arg.x + arg.shape.right * arg.scale.x;
            ymin = arg.y - arg.shape.top * arg.scale.y;
            ymax = arg.y + arg.shape.bottom * arg.scale.y;
        }
        return x >= xmin && y >= ymin && x <= xmax && y <= ymax;
    },
    /**
     * Tests whether a given point is inside the given circle (it can be either a copy or an array)
     * @param {number} x The x coordinate of the point
     * @param {number} y The y coordinate of the point
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a circular shape)
     * or an array in a form of [x1, y1, r], where (x1;y1) define the center of the circle
     * and `r` defines the radius of it.
     * @returns {boolean} `true` if the point is inside the circle, `false` otherwise
     */
    pcircle(x, y, arg) {
        if (arg.splice) {
            return ct.u.pdc(x, y, arg[0], arg[1]) < arg[2];
        }
        return ct.u.pdc(0, 0, (arg.x - x) / arg.scale.x, (arg.y - y) / arg.scale.y) < arg.shape.r;
    },
    /**
     * Copies all the properties of the source object to the destination object.
     * This is **not** a deep copy. Useful for extending some settings with default values,
     * or for combining data.
     * @param {object} o1 The destination object
     * @param {object} o2 The source object
     * @param {any} [arr] An optional array of properties to copy. If not specified,
     * all the properties will be copied.
     * @returns {object} The modified destination object
     */
    ext(o1, o2, arr) {
        if (arr) {
            for (const i in arr) {
                if (o2[arr[i]]) {
                    o1[arr[i]] = o2[arr[i]];
                }
            }
        } else {
            for (const i in o2) {
                o1[i] = o2[i];
            }
        }
        return o1;
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer is run in gameplay time scale, meaning that it is affected by time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    wait(time) {
        return ct.timer.add(time);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer runs in UI time scale and is not sensitive to time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    waitUi(time) {
        return ct.timer.addUi(time);
    },
    /**
     * Creates a new function that returns a promise, based
     * on a function with a regular (err, result) => {...} callback.
     * @param {Function} f The function that needs to be promisified
     * @see https://javascript.info/promisify
     */
    promisify(f) {
        // eslint-disable-next-line func-names
        return function (...args) {
            return new Promise((resolve, reject) => {
                const callback = function callback(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };
                args.push(callback);
                f.call(this, ...args);
            });
        };
    },
    required(paramName, method) {
        let str = 'The parameter ';
        if (paramName) {
            str += `${paramName} `;
        }
        if (method) {
            str += `of ${method} `;
        }
        str += 'is required.';
        throw new Error(str);
    },
    numberedString(prefix, input) {
        return prefix + '_' + input.toString().padStart(2, '0');
    },
    getStringNumber(str) {
        return Number(str.split('_').pop());
    }
};
ct.u.ext(ct.u, {// make aliases
    getOs: ct.u.getOS,
    lengthDirX: ct.u.ldx,
    lengthDirY: ct.u.ldy,
    pointDirection: ct.u.pdn,
    pointDistance: ct.u.pdc,
    pointRectangle: ct.u.prect,
    pointCircle: ct.u.pcircle,
    extend: ct.u.ext
});

// eslint-disable-next-line max-lines-per-function
(() => {
    const killRecursive = copy => {
        copy.kill = true;
        if (copy.onDestroy) {
            ct.templates.onDestroy.apply(copy);
            copy.onDestroy.apply(copy);
        }
        for (const child of copy.children) {
            if (child[copyTypeSymbol]) {
                killRecursive(child);
            }
        }
        const stackIndex = ct.stack.indexOf(copy);
        if (stackIndex !== -1) {
            ct.stack.splice(stackIndex, 1);
        }
        if (copy.template) {
            const templatelistIndex = ct.templates.list[copy.template].indexOf(copy);
            if (templatelistIndex !== -1) {
                ct.templates.list[copy.template].splice(templatelistIndex, 1);
            }
        }
        deadPool.push(copy);
    };
    const manageCamera = () => {
        if (ct.camera) {
            ct.camera.update(ct.delta);
            ct.camera.manageStage();
        }
    };

    ct.loop = function loop(delta) {
        ct.delta = delta;
        ct.deltaUi = ct.pixiApp.ticker.elapsedMS / (1000 / (ct.pixiApp.ticker.maxFPS || 60));
        ct.inputs.updateActions();
        ct.timer.updateTimers();
        ct.place.debugTraceGraphics.clear();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeStep.apply(ct.stack[i]);
            ct.stack[i].onStep.apply(ct.stack[i]);
            ct.templates.afterStep.apply(ct.stack[i]);
        }
        // There may be a number of rooms stacked on top of each other.
        // Loop through them and filter out everything that is not a room.
        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeStep.apply(item);
            item.onStep.apply(item);
            ct.rooms.afterStep.apply(item);
        }
        // copies
        for (const copy of ct.stack) {
            // eslint-disable-next-line no-underscore-dangle
            if (copy.kill && !copy._destroyed) {
                killRecursive(copy); // This will also allow a parent to eject children
                                     // to a new container before they are destroyed as well
                copy.destroy({
                    children: true
                });
            }
        }

        for (const cont of ct.stage.children) {
            cont.children.sort((a, b) =>
                ((a.depth || 0) - (b.depth || 0)) || ((a.uid || 0) - (b.uid || 0)) || 0);
        }

        manageCamera();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeDraw.apply(ct.stack[i]);
            ct.stack[i].onDraw.apply(ct.stack[i]);
            ct.templates.afterDraw.apply(ct.stack[i]);
            ct.stack[i].xprev = ct.stack[i].x;
            ct.stack[i].yprev = ct.stack[i].y;
        }

        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeDraw.apply(item);
            item.onDraw.apply(item);
            ct.rooms.afterDraw.apply(item);
        }
        /*%afterframe%*/
        if (ct.rooms.switching) {
            ct.rooms.forceSwitch();
        }
    };
})();




/**
 * @property {number} value The current value of an action. It is always in the range from -1 to 1.
 * @property {string} name The name of the action.
 */
class CtAction {
    /**
     * This is a custom action defined in the Settings tab → Edit actions section.
     * Actions are used to abstract different input methods into one gameplay-related interface:
     * for example, joystick movement, WASD keys and arrows can be turned into two actions:
     * `MoveHorizontally` and `MoveVertically`.
     * @param {string} name The name of the new action.
     */
    constructor(name) {
        this.name = name;
        this.methodCodes = [];
        this.methodMultipliers = [];
        this.prevValue = 0;
        this.value = 0;
        return this;
    }
    /**
     * Checks whether the current action listens to a given input method.
     * This *does not* check whether this input method is supported by ct.
     *
     * @param {string} code The code to look up.
     * @returns {boolean} `true` if it exists, `false` otherwise.
     */
    methodExists(code) {
        return this.methodCodes.indexOf(code) !== -1;
    }
    /**
     * Adds a new input method to listen.
     *
     * @param {string} code The input method's code to listen to. Must be unique per action.
     * @param {number} [multiplier] An optional multiplier, e.g. to flip its value.
     * Often used with two buttons to combine them into a scalar input identical to joysticks.
     * @returns {void}
     */
    addMethod(code, multiplier) {
        if (this.methodCodes.indexOf(code) === -1) {
            this.methodCodes.push(code);
            this.methodMultipliers.push(multiplier !== void 0 ? multiplier : 1);
        } else {
            throw new Error(`[ct.inputs] An attempt to add an already added input "${code}" to an action "${name}".`);
        }
    }
    /**
     * Removes the provided input method for an action.
     *
     * @param {string} code The input method to remove.
     * @returns {void}
     */
    removeMethod(code) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodCodes.splice(ind, 1);
            this.methodMultipliers.splice(ind, 1);
        }
    }
    /**
     * Changes the multiplier for an input method with the provided code.
     * This method will produce a warning if one is trying to change an input method
     * that is not listened by this action.
     *
     * @param {string} code The input method's code to change
     * @param {number} multiplier The new value
     * @returns {void}
     */
    setMultiplier(code, multiplier) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodMultipliers[ind] = multiplier;
        } else {
            // eslint-disable-next-line no-console
            console.warning(`[ct.inputs] An attempt to change multiplier of a non-existent method "${code}" at event ${this.name}`);
            // eslint-disable-next-line no-console
            console.trace();
        }
    }
    /**
     * Recalculates the digital value of an action.
     *
     * @returns {number} A scalar value between -1 and 1.
     */
    update() {
        this.prevValue = this.value;
        this.value = 0;
        for (let i = 0, l = this.methodCodes.length; i < l; i++) {
            const rawValue = ct.inputs.registry[this.methodCodes[i]] || 0;
            this.value += rawValue * this.methodMultipliers[i];
        }
        this.value = Math.max(-1, Math.min(this.value, 1));
    }
    /**
     * Resets the state of this action, setting its value to `0`
     * and its pressed, down, released states to `false`.
     *
     * @returns {void}
     */
    reset() {
        this.prevValue = this.value = 0;
    }
    /**
     * Returns whether the action became active in the current frame,
     * either by a button just pressed or by using a scalar input.
     *
     * `true` for being pressed and `false` otherwise
     * @type {boolean}
     */
    get pressed() {
        return this.prevValue === 0 && this.value !== 0;
    }
    /**
     * Returns whether the action became inactive in the current frame,
     * either by releasing all buttons or by resting all scalar inputs.
     *
     * `true` for being released and `false` otherwise
     * @type {boolean}
     */
    get released() {
        return this.prevValue !== 0 && this.value === 0;
    }
    /**
     * Returns whether the action is active, e.g. by a pressed button
     * or a currently used scalar input.
     *
     * `true` for being active and `false` otherwise
     * @type {boolean}
     */
    get down() {
        return this.value !== 0;
    }
    /* In case you need to be hated for the rest of your life, uncomment this */
    /*
    valueOf() {
        return this.value;
    }
    */
}

/**
 * A list of custom Actions. They are defined in the Settings tab → Edit actions section.
 * @type {Object.<string,CtAction>}
 */
ct.actions = {};
/**
 * @namespace
 */
ct.inputs = {
    registry: {},
    /**
     * Adds a new action and puts it into `ct.actions`.
     *
     * @param {string} name The name of an action, as it will be used in `ct.actions`.
     * @param {Array<Object>} methods A list of input methods. This list can be changed later.
     * @returns {CtAction} The created action
     */
    addAction(name, methods) {
        if (name in ct.actions) {
            throw new Error(`[ct.inputs] An action "${name}" already exists, can't add a new one with the same name.`);
        }
        const action = new CtAction(name);
        for (const method of methods) {
            action.addMethod(method.code, method.multiplier);
        }
        ct.actions[name] = action;
        return action;
    },
    /**
     * Removes an action with a given name.
     * @param {string} name The name of an action
     * @returns {void}
     */
    removeAction(name) {
        delete ct.actions[name];
    },
    /**
     * Recalculates values for every action in a game.
     * @returns {void}
     */
    updateActions() {
        for (const i in ct.actions) {
            ct.actions[i].update();
        }
    }
};

ct.inputs.addAction('Pular', [{"code":"keyboard.Space"},{"code":"gamepad.Button1"}]);
ct.inputs.addAction('MoveX', [{"code":"keyboard.ArrowLeft","multiplier":-1},{"code":"keyboard.ArrowRight"},{"code":"gamepad.Left","multiplier":-1},{"code":"gamepad.Right","multiplier":1}]);
ct.inputs.addAction('Atirar', [{"code":"keyboard.KeyP"},{"code":"keyboard.KeyQ"},{"code":"gamepad.Button3"}]);
ct.inputs.addAction('Acel', [{"code":"keyboard.ShiftLeft"},{"code":"keyboard.ShiftRight"},{"code":"gamepad.L3"}]);
ct.inputs.addAction('Voo', [{"code":"keyboard.ControlLeft"}]);
ct.inputs.addAction('Cima', [{"code":"keyboard.ArrowUp"},{"code":"gamepad.Up"}]);
ct.inputs.addAction('Esq', [{"code":"keyboard.ArrowLeft"},{"code":"gamepad.Left"}]);
ct.inputs.addAction('Dir', [{"code":"keyboard.ArrowRight"},{"code":"gamepad.Right"}]);
ct.inputs.addAction('Baixo', [{"code":"keyboard.ArrowDown"},{"code":"gamepad.LStickY"}]);
ct.inputs.addAction('Trocar1', [{"code":"keyboard.Digit1"},{"code":"gamepad.L2"}]);
ct.inputs.addAction('Trocar2', [{"code":"keyboard.Digit2"},{"code":"gamepad.R2"}]);
ct.inputs.addAction('Skill', [{"code":"keyboard.KeyE"},{"code":"gamepad.Button4"}]);
ct.inputs.addAction('Melee', [{"code":"keyboard.KeyW"},{"code":"gamepad.Button2"}]);
ct.inputs.addAction('start', [{"code":"keyboard.Enter"},{"code":"gamepad.Start"}]);
ct.inputs.addAction('Trocar3', [{"code":"keyboard.Digit3"}]);
ct.inputs.addAction('Esc', [{"code":"keyboard.Escape"},{"code":"gamepad.Select"}]);
ct.inputs.addAction('Qualquer', [{"code":"keyboard.KeyA"},{"code":"keyboard.KeyB"},{"code":"keyboard.KeyC"},{"code":"keyboard.KeyD"},{"code":"keyboard.KeyE"},{"code":"keyboard.KeyG"},{"code":"keyboard.KeyF"},{"code":"keyboard.KeyH"},{"code":"keyboard.KeyI"},{"code":"keyboard.KeyJ"},{"code":"keyboard.KeyK"},{"code":"keyboard.KeyL"},{"code":"keyboard.KeyM"},{"code":"keyboard.KeyN"},{"code":"keyboard.KeyO"},{"code":"keyboard.KeyP"},{"code":"keyboard.KeyQ"},{"code":"keyboard.KeyR"},{"code":"keyboard.KeyS"},{"code":"keyboard.KeyT"},{"code":"keyboard.KeyU"},{"code":"keyboard.KeyV"},{"code":"keyboard.KeyW"},{"code":"keyboard.KeyX"},{"code":"keyboard.KeyY"},{"code":"keyboard.KeyZ"},{"code":"keyboard.Space"},{"code":"keyboard.ArrowLeft"},{"code":"keyboard.ArrowUp"},{"code":"keyboard.ArrowRight"},{"code":"keyboard.ArrowDown"},{"code":"keyboard.Backspace"},{"code":"keyboard.Delete"},{"code":"keyboard.End"},{"code":"keyboard.Enter"},{"code":"keyboard.Escape"},{"code":"keyboard.Home"},{"code":"keyboard.Insert"},{"code":"keyboard.PageUp"},{"code":"keyboard.PageDown"},{"code":"keyboard.ShiftLeft"},{"code":"keyboard.ControlLeft"},{"code":"keyboard.AltLeft"},{"code":"keyboard.ControlRight"},{"code":"keyboard.AltRight"},{"code":"keyboard.ShiftRight"},{"code":"keyboard.ContextMenu"},{"code":"keyboard.Backquote"},{"code":"keyboard.Minus"},{"code":"keyboard.Equal"},{"code":"keyboard.BracketLeft"},{"code":"keyboard.BracketRight"},{"code":"keyboard.Semicolon"},{"code":"keyboard.Quote"},{"code":"keyboard.Comma"},{"code":"keyboard.Period"},{"code":"keyboard.Slash"},{"code":"keyboard.Backslash"},{"code":"keyboard.Digit1"},{"code":"keyboard.Digit2"},{"code":"keyboard.Digit3"},{"code":"keyboard.Digit4"},{"code":"keyboard.Digit5"},{"code":"keyboard.Digit7"},{"code":"keyboard.Digit6"},{"code":"keyboard.Digit8"},{"code":"keyboard.Digit9"},{"code":"keyboard.Digit0"},{"code":"gamepad.Any"}]);
ct.inputs.addAction('Mouse1', [{"code":"pointer.Primary"}]);
ct.inputs.addAction('Mouse2', [{"code":"pointer.Secondary"}]);
ct.inputs.addAction('um', [{"code":"keyboard.Digit1"},{"code":"keyboard.Numpad1"}]);
ct.inputs.addAction('dois', [{"code":"keyboard.Digit2"},{"code":"keyboard.Numpad2"}]);
ct.inputs.addAction('Quatro', [{"code":"keyboard.Digit4"}]);


/**
 * @typedef IRoomMergeResult
 *
 * @property {Array<Copy>} copies
 * @property {Array<Tilemap>} tileLayers
 * @property {Array<Background>} backgrounds
 */

class Room extends PIXI.Container {
    static getNewId() {
        this.roomId++;
        return this.roomId;
    }

    constructor(template) {
        super();
        this.x = this.y = 0;
        this.uid = Room.getNewId();
        this.tileLayers = [];
        this.backgrounds = [];
        if (!ct.room) {
            ct.room = ct.rooms.current = this;
        }
        if (template) {
            if (template.extends) {
                ct.u.ext(this, template.extends);
            }
            this.onCreate = template.onCreate;
            this.onStep = template.onStep;
            this.onDraw = template.onDraw;
            this.onLeave = template.onLeave;
            this.template = template;
            this.name = template.name;
            if (this === ct.room) {
                ct.pixiApp.renderer.backgroundColor = ct.u.hexToPixi(this.template.backgroundColor);
            }
            if (this === ct.room) {
    ct.place.tileGrid = {};
}
ct.fittoscreen();

            for (let i = 0, li = template.bgs.length; i < li; i++) {
                // Need to put extensions here, so we don't use ct.backgrounds.add
                const bg = new ct.templates.Background(
                    template.bgs[i].texture,
                    null,
                    template.bgs[i].depth,
                    template.bgs[i].extends
                );
                this.addChild(bg);
            }
            for (let i = 0, li = template.tiles.length; i < li; i++) {
                const tl = new Tilemap(template.tiles[i]);
                tl.cache();
                this.tileLayers.push(tl);
                this.addChild(tl);
            }
            for (let i = 0, li = template.objects.length; i < li; i++) {
                const exts = template.objects[i].exts || {};
                ct.templates.copyIntoRoom(
                    template.objects[i].template,
                    template.objects[i].x,
                    template.objects[i].y,
                    this,
                    {
                        tx: template.objects[i].tx,
                        ty: template.objects[i].ty,
                        tr: template.objects[i].tr,
                        ...exts
                    }
                );
            }
        }
        return this;
    }
    get x() {
        return -this.position.x;
    }
    set x(value) {
        this.position.x = -value;
        return value;
    }
    get y() {
        return -this.position.y;
    }
    set y(value) {
        this.position.y = -value;
        return value;
    }
}
Room.roomId = 0;

(function roomsAddon() {
    /* global deadPool */
    var nextRoom;
    /**
     * @namespace
     */
    ct.rooms = {
        templates: {},
        /**
         * An object that contains arrays of currently present rooms.
         * These include the current room (`ct.room`), as well as any rooms
         * appended or prepended through `ct.rooms.append` and `ct.rooms.prepend`.
         * @type {Object.<string,Array<Room>>}
         */
        list: {},
        /**
         * Creates and adds a background to the current room, at the given depth.
         * @param {string} texture The name of the texture to use
         * @param {number} depth The depth of the new background
         * @returns {Background} The created background
         */
        addBg(texture, depth) {
            const bg = new ct.templates.Background(texture, null, depth);
            ct.room.addChild(bg);
            return bg;
        },
        /**
         * Adds a new empty tile layer to the room, at the given depth
         * @param {number} layer The depth of the layer
         * @returns {Tileset} The created tile layer
         * @deprecated Use ct.tilemaps.create instead.
         */
        addTileLayer(layer) {
            return ct.tilemaps.create(layer);
        },
        /**
         * Clears the current stage, removing all rooms with copies, tile layers, backgrounds,
         * and other potential entities.
         * @returns {void}
         */
        clear() {
            ct.stage.children = [];
            ct.stack = [];
            for (const i in ct.templates.list) {
                ct.templates.list[i] = [];
            }
            for (const i in ct.backgrounds.list) {
                ct.backgrounds.list[i] = [];
            }
            ct.rooms.list = {};
            for (const name in ct.rooms.templates) {
                ct.rooms.list[name] = [];
            }
        },
        /**
         * This method safely removes a previously appended/prepended room from the stage.
         * It will trigger "On Leave" for a room and "On Destroy" event
         * for all the copies of the removed room.
         * The room will also have `this.kill` set to `true` in its event, if it comes in handy.
         * This method cannot remove `ct.room`, the main room.
         * @param {Room} room The `room` argument must be a reference
         * to the previously created room.
         * @returns {void}
         */
        remove(room) {
            if (!(room instanceof Room)) {
                if (typeof room === 'string') {
                    throw new Error('[ct.rooms] To remove a room, you should provide a reference to it (to an object), not its name. Provided value:', room);
                }
                throw new Error('[ct.rooms] An attempt to remove a room that is not actually a room! Provided value:', room);
            }
            const ind = ct.rooms.list[room.name];
            if (ind !== -1) {
                ct.rooms.list[room.name].splice(ind, 1);
            } else {
                // eslint-disable-next-line no-console
                console.warn('[ct.rooms] Removing a room that was not found in ct.rooms.list. This is strange…');
            }
            room.kill = true;
            ct.stage.removeChild(room);
            for (const copy of room.children) {
                copy.kill = true;
            }
            room.onLeave();
            ct.rooms.onLeave.apply(room);
        },
        /*
         * Switches to the given room. Note that this transition happens at the end
         * of the frame, so the name of a new room may be overridden.
         */
        'switch'(roomName) {
            if (ct.rooms.templates[roomName]) {
                nextRoom = roomName;
                ct.rooms.switching = true;
            } else {
                console.error('[ct.rooms] The room "' + roomName + '" does not exist!');
            }
        },
        switching: false,
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` after all the other rooms.
         * @param {string} roomName The name of the room to be appended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        append(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] append failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChild(room);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` before all the other rooms.
         * @param {string} roomName The name of the room to be prepended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        prepend(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] prepend failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChildAt(room, 0);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Merges a given room into the current one. Skips room's OnCreate event.
         *
         * @param {string} roomName The name of the room that needs to be merged
         * @returns {IRoomMergeResult} Arrays of created copies, backgrounds, tile layers,
         * added to the current room (`ct.room`). Note: it does not get updated,
         * so beware of memory leaks if you keep a reference to this array for a long time!
         */
        merge(roomName) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] merge failed: the room ${roomName} does not exist!`);
                return false;
            }
            const generated = {
                copies: [],
                tileLayers: [],
                backgrounds: []
            };
            const template = ct.rooms.templates[roomName];
            const target = ct.room;
            for (const t of template.bgs) {
                const bg = new ct.templates.Background(t.texture, null, t.depth, t.extends);
                target.backgrounds.push(bg);
                target.addChild(bg);
                generated.backgrounds.push(bg);
            }
            for (const t of template.tiles) {
                const tl = new Tilemap(t);
                target.tileLayers.push(tl);
                target.addChild(tl);
                generated.tileLayers.push(tl);
                tl.cache();
            }
            for (const t of template.objects) {
                const c = ct.templates.copyIntoRoom(t.template, t.x, t.y, target, {
                    tx: t.tx || 1,
                    ty: t.ty || 1,
                    tr: t.tr || 0
                });
                generated.copies.push(c);
            }
            return generated;
        },
        forceSwitch(roomName) {
            if (nextRoom) {
                roomName = nextRoom;
            }
            if (ct.room) {
                ct.room.onLeave();
                ct.rooms.onLeave.apply(ct.room);
                ct.room = void 0;
            }
            ct.rooms.clear();
            deadPool.length = 0;
            var template = ct.rooms.templates[roomName];
            ct.roomWidth = template.width;
            ct.roomHeight = template.height;
            ct.camera = new Camera(
                ct.roomWidth / 2,
                ct.roomHeight / 2,
                ct.roomWidth,
                ct.roomHeight
            );
            if (template.cameraConstraints) {
                ct.camera.minX = template.cameraConstraints.x1;
                ct.camera.maxX = template.cameraConstraints.x2;
                ct.camera.minY = template.cameraConstraints.y1;
                ct.camera.maxY = template.cameraConstraints.y2;
            }
            ct.pixiApp.renderer.resize(template.width, template.height);
            ct.rooms.current = ct.room = new Room(template);
            ct.stage.addChild(ct.room);
            ct.room.onCreate();
            ct.rooms.onCreate.apply(ct.room);
            ct.rooms.list[roomName].push(ct.room);
            
            ct.camera.manageStage();
            ct.rooms.switching = false;
            nextRoom = void 0;
        },
        onCreate() {
            if (this === ct.room) {
    const debugTraceGraphics = new PIXI.Graphics();
    debugTraceGraphics.depth = 10000000; // Why not. Overlap everything.
    ct.room.addChild(debugTraceGraphics);
    ct.place.debugTraceGraphics = debugTraceGraphics;
}
for (const layer of this.tileLayers) {
    if (this.children.indexOf(layer) === -1) {
        continue;
    }
    ct.place.enableTilemapCollisions(layer);
}

        },
        onLeave() {
            if (this === ct.room) {
    ct.place.grid = {};
}
/* global ct */

if (!this.kill) {
    for (var tween of ct.tween.tweens) {
        tween.reject({
            info: 'Room switch',
            code: 1,
            from: 'ct.tween'
        });
    }
    ct.tween.tweens = [];
}

        },
        /**
         * The name of the starting room, as it was set in ct.IDE.
         * @type {string}
         */
        starting: 'MainMenu'
    };
})();
/**
 * The current room
 * @type {Room}
 */
ct.room = null;

ct.rooms.beforeStep = function beforeStep() {
    ct.pointer.updateGestures();
ct.touch.updateGestures();
var i = 0;
while (i < ct.tween.tweens.length) {
    var tween = ct.tween.tweens[i];
    if (tween.obj.kill) {
        tween.reject({
            code: 2,
            info: 'Copy is killed'
        });
        ct.tween.tweens.splice(i, 1);
        continue;
    }
    var a = tween.timer.time / tween.duration;
    if (a > 1) {
        a = 1;
    }
    for (var field in tween.fields) {
        var s = tween.starting[field],
            d = tween.fields[field] - tween.starting[field];
        tween.obj[field] = tween.curve(s, d, a);
    }
    if (a === 1) {
        tween.resolve(tween.fields);
        ct.tween.tweens.splice(i, 1);
        continue;
    }
    i++;
}

};
ct.rooms.afterStep = function afterStep() {
    
};
ct.rooms.beforeDraw = function beforeDraw() {
    
};
ct.rooms.afterDraw = function afterDraw() {
    ct.keyboard.clear();
for (const pointer of ct.pointer.down) {
    pointer.xprev = pointer.x;
    pointer.yprev = pointer.y;
    pointer.xuiprev = pointer.x;
    pointer.yuiprev = pointer.y;
}
for (const pointer of ct.pointer.hover) {
    pointer.xprev = pointer.x;
    pointer.yprev = pointer.y;
    pointer.xuiprev = pointer.x;
    pointer.yuiprev = pointer.y;
}
ct.inputs.registry['pointer.Wheel'] = 0;
ct.pointer.clearReleased();
ct.pointer.xmovement = ct.pointer.ymovement = 0;
if (ct.sound.follow && !ct.sound.follow.kill) {
    ct.sound.howler.pos(
        ct.sound.follow.x,
        ct.sound.follow.y,
        ct.sound.useDepth ? ct.sound.follow.z : 0
    );
} else if (ct.sound.manageListenerPosition) {
    ct.sound.howler.pos(ct.camera.x, ct.camera.y, ct.camera.z || 0);
}
ct.mouse.xprev = ct.mouse.x;
ct.mouse.yprev = ct.mouse.y;
ct.mouse.xuiprev = ct.mouse.xui;
ct.mouse.yuiprev = ct.mouse.yui;
ct.mouse.pressed = ct.mouse.released = false;
ct.inputs.registry['mouse.Wheel'] = 0;
for (const touch of ct.touch.events) {
    touch.xprev = touch.x;
    touch.yprev = touch.y;
    touch.xuiprev = touch.x;
    touch.yuiprev = touch.y;
    ct.touch.clearReleased();
}

};


ct.rooms.templates['test'] = {
    name: 'test',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-1472,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":-1408,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":-1280,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":-1024,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":-1000,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":-832,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":-640,"y":3584,"exts":{},"template":"Bar_Blue"},{"x":64,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":64,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":64,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":66,"y":1969,"exts":{},"template":"untitled(1)"},{"x":320,"y":1968,"exts":{},"template":"untitled(1)"},{"x":320,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":448,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":512,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":572,"y":1968,"exts":{},"template":"untitled(1)"},{"x":576,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":640,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":640,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":704,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":704,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":768,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":826,"y":1968,"exts":{},"template":"untitled(1)"},{"x":832,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":832,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":896,"y":1856,"exts":{},"template":"INIMIGO"},{"x":896,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1081,"y":1969,"exts":{},"template":"untitled(1)"},{"x":1088,"y":1856,"exts":{},"template":"INIMIGO"},{"x":1088,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":1088,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1088,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1152,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":1216,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":1280,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1337,"y":1968,"exts":{},"template":"untitled(1)"},{"x":1344,"y":1856,"exts":{},"template":"INIMIGO"},{"x":1344,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":1408,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1472,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":1472,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1536,"y":1856,"exts":{},"template":"INIMIGO"},{"x":1536,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":1592,"y":1970,"exts":{},"template":"untitled(1)"},{"x":1600,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":1664,"y":2304,"exts":{},"template":"Bar_Blue"},{"x":1664,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":448,"y":-128,"exts":{},"template":"chao3"},{"x":1152,"y":-704,"exts":{},"template":"chao3"},{"x":1984,"y":512,"exts":{},"template":"chao3"},{"x":2240,"y":512,"exts":{},"template":"chao3"},{"x":2434,"y":408,"exts":{},"template":"Mouse_Left"},{"x":2496,"y":512,"exts":{},"template":"chao3"},{"x":2752,"y":512,"exts":{},"template":"chao3"},{"x":3008,"y":512,"exts":{},"template":"chao3"},{"x":4,"y":656,"exts":{},"template":"chao3"},{"x":260,"y":656,"exts":{},"template":"chao3"},{"x":512,"y":640,"exts":{},"template":"chao3"},{"x":768,"y":640,"exts":{},"template":"chao3"},{"x":1024,"y":640,"exts":{},"template":"chao3"},{"x":1280,"y":640,"exts":{},"template":"chao3"},{"x":1536,"y":640,"exts":{},"template":"chao3"},{"x":1664,"y":576,"exts":{},"template":"chao3"},{"x":1728,"y":576,"exts":{},"template":"chao3"},{"x":851,"y":620,"exts":{},"template":"cabecinha"},{"x":192,"y":576,"exts":{},"template":"Hero"},{"x":1856,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":2112,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":2368,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":2624,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":2880,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":3136,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":3456,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":3392,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":3712,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":4032,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":3968,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":4160,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":4416,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":4680,"y":1984,"exts":{},"template":"Bar_Blue"},{"x":5100,"y":2048,"exts":{},"template":"Bar_Blue"},{"x":5504,"y":2176,"exts":{},"template":"Bar_Blue"},{"x":5760,"y":2176,"exts":{},"template":"Bar_Blue"},{"x":6208,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":6464,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":6784,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":6720,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":7104,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":7104,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":7104,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":7040,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":7360,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":7616,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":8256,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":8512,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":8768,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":9088,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":9024,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":7872,"y":2368,"exts":{},"template":"Bar_Blue"},{"x":9344,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":9600,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":9856,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":10112,"y":2432,"exts":{},"template":"Bar_Blue"},{"x":10368,"y":2560,"exts":{},"template":"Bar_Blue"},{"x":10624,"y":2688,"exts":{},"template":"Bar_Blue"},{"x":10880,"y":2752,"exts":{},"template":"Bar_Blue"},{"x":11136,"y":2752,"exts":{},"template":"Bar_Blue"},{"x":11392,"y":2752,"exts":{},"template":"Bar_Blue"},{"x":11712,"y":2880,"exts":{},"template":"chao3"},{"x":12032,"y":2944,"exts":{},"template":"chao3"},{"x":12416,"y":3072,"exts":{},"template":"chao3"},{"x":4096,"y":1856,"exts":{},"template":"INIMIGO"},{"x":4352,"y":1856,"exts":{},"template":"INIMIGO"},{"x":4416,"y":1856,"exts":{},"template":"INIMIGO"},{"x":4608,"y":1856,"exts":{},"template":"INIMIGO"},{"x":4736,"y":1856,"exts":{},"template":"INIMIGO"},{"x":4864,"y":1856,"exts":{},"template":"INIMIGO"},{"x":4928,"y":1856,"exts":{},"template":"INIMIGO"},{"x":5184,"y":1920,"exts":{},"template":"INIMIGO"},{"x":5504,"y":2048,"exts":{},"template":"INIMIGO"},{"x":5952,"y":2048,"exts":{},"template":"INIMIGO"},{"x":6336,"y":2240,"exts":{},"template":"INIMIGO"},{"x":6400,"y":2240,"exts":{},"template":"INIMIGO"},{"x":6464,"y":2240,"exts":{},"template":"INIMIGO"},{"x":6656,"y":2240,"exts":{},"template":"INIMIGO"},{"x":6912,"y":2240,"exts":{},"template":"INIMIGO"},{"x":7296,"y":2240,"exts":{},"template":"INIMIGO"},{"x":7104,"y":2240,"exts":{},"template":"INIMIGO"},{"x":7488,"y":2240,"exts":{},"template":"INIMIGO"},{"x":7808,"y":2240,"exts":{},"template":"INIMIGO"},{"x":8576,"y":2304,"exts":{},"template":"INIMIGO"},{"x":8768,"y":2304,"exts":{},"template":"INIMIGO"},{"x":8832,"y":2304,"exts":{},"template":"INIMIGO"},{"x":8960,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9088,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9216,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9344,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9472,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9600,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9920,"y":2304,"exts":{},"template":"INIMIGO"},{"x":10112,"y":2304,"exts":{},"template":"INIMIGO"},{"x":10752,"y":2560,"exts":{},"template":"INIMIGO"},{"x":10944,"y":2624,"exts":{},"template":"INIMIGO"},{"x":11200,"y":2624,"exts":{},"template":"Pig_Avatar"},{"x":11456,"y":2624,"exts":{},"template":"INIMIGO"},{"x":11776,"y":2752,"exts":{},"template":"INIMIGO"},{"x":12160,"y":2816,"exts":{},"template":"INIMIGO"},{"x":9792,"y":2304,"exts":{},"template":"INIMIGO"},{"x":9728,"y":2304,"exts":{},"template":"INIMIGO"},{"x":10304,"y":2304,"exts":{},"template":"INIMIGO"},{"x":10496,"y":2368,"exts":{},"template":"INIMIGO"},{"x":10624,"y":2432,"exts":{},"template":"INIMIGO"},{"x":11072,"y":2624,"exts":{},"template":"INIMIGO"},{"x":11392,"y":2624,"exts":{},"template":"INIMIGO"},{"x":11328,"y":2624,"exts":{},"template":"INIMIGO"},{"x":8704,"y":2304,"exts":{},"template":"INIMIGO"},{"x":10240,"y":2304,"exts":{},"template":"INIMIGO"},{"x":10048,"y":2304,"exts":{},"template":"INIMIGO"},{"x":12416,"y":2944,"exts":{},"template":"INIMIGO"},{"x":12544,"y":3008,"exts":{},"template":"INIMIGO"},{"x":12608,"y":3008,"exts":{},"template":"INIMIGO"},{"x":12608,"y":2944,"exts":{},"template":"INIMIGO"},{"x":12800,"y":3264,"exts":{},"template":"INIMIGO"},{"x":12736,"y":3008,"exts":{},"template":"INIMIGO"},{"x":12736,"y":3072,"exts":{},"template":"INIMIGO"},{"x":12864,"y":2944,"exts":{},"template":"INIMIGO"},{"x":12608,"y":2880,"exts":{},"template":"INIMIGO"},{"x":12608,"y":2880,"exts":{},"template":"INIMIGO"},{"x":12544,"y":2880,"exts":{},"template":"INIMIGO"},{"x":12544,"y":2944,"exts":{},"template":"INIMIGO"},{"x":12544,"y":3008,"exts":{},"template":"INIMIGO"},{"x":12672,"y":3008,"exts":{},"template":"INIMIGO"},{"x":12672,"y":2944,"exts":{},"template":"INIMIGO"},{"x":12672,"y":2944,"exts":{},"template":"INIMIGO"},{"x":12672,"y":2880,"exts":{},"template":"INIMIGO"},{"x":12544,"y":2880,"exts":{},"template":"INIMIGO"},{"x":12480,"y":2880,"exts":{},"template":"INIMIGO"},{"x":12544,"y":2816,"exts":{},"template":"INIMIGO"},{"x":12736,"y":3072,"exts":{},"template":"INIMIGO"},{"x":12800,"y":2816,"exts":{},"template":"INIMIGO"},{"x":12992,"y":3136,"exts":{},"template":"INIMIGO"},{"x":12864,"y":3264,"exts":{},"template":"INIMIGO"},{"x":13120,"y":2880,"exts":{},"template":"INIMIGO"},{"x":5696,"y":2048,"exts":{},"template":"INIMIGO"},{"x":1792,"y":1856,"exts":{},"template":"INIMIGO"},{"x":2048,"y":1856,"exts":{},"template":"INIMIGO"},{"x":2304,"y":1792,"exts":{},"template":"INIMIGO"},{"x":2432,"y":1856,"exts":{},"template":"INIMIGO"},{"x":2752,"y":1856,"exts":{},"template":"INIMIGO"},{"x":2944,"y":1856,"exts":{},"template":"INIMIGO"},{"x":3200,"y":1856,"exts":{},"template":"INIMIGO"},{"x":3584,"y":1920,"exts":{},"template":"INIMIGO"},{"x":3456,"y":1856,"exts":{},"template":"INIMIGO"},{"x":3840,"y":1792,"exts":{},"template":"INIMIGO"}]'),
    bgs: JSON.parse('[{"depth":-3,"texture":"Bg","extends":{"parallaxX":1,"repeat":"repeat"}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.vida = 4
this.mana = 3
this.control = true

ct.rooms.append('UI', {
    isUi: true
});
    },
    extends: {}
}
ct.rooms.templates['UI'] = {
    name: 'UI',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":20,"exts":{},"template":"HUD_vida_mana"},{"x":268,"y":40,"exts":{},"template":"Poção"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['start'] = {
    name: 'start',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":448,"y":256,"exts":{},"template":"Cloud_02"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Andar 1'] = {
    name: 'Andar 1',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":1,"y":586,"exts":{},"template":"Bar_Blue"},{"x":257,"y":586,"exts":{},"template":"Bar_Blue"},{"x":510,"y":586,"exts":{},"template":"Bar_Blue"},{"x":764,"y":586,"exts":{},"template":"Bar_Blue"},{"x":1016,"y":586,"exts":{},"template":"Bar_Blue"},{"x":-131,"y":-13,"exts":{},"template":"ParedeInv"},{"x":-149,"y":27,"exts":{},"template":"ParedeInv"},{"x":-131,"y":-10,"exts":{},"template":"ParedeInv"},{"x":-128,"y":128,"exts":{},"template":"ParedeInv"},{"x":-128,"y":64,"exts":{},"template":"ParedeInv"},{"x":1269,"y":586,"exts":{},"template":"Bar_Blue"},{"x":1522,"y":586,"exts":{},"template":"Bar_Blue"},{"x":1776,"y":586,"exts":{},"template":"Bar_Blue"},{"x":128,"y":448,"exts":{},"template":"Hero"},{"x":-252,"y":586,"exts":{},"template":"Bar_Blue"},{"x":-512,"y":586,"exts":{},"template":"Bar_Blue"},{"x":-768,"y":586,"exts":{},"template":"Bar_Blue"},{"x":2048,"y":448,"exts":{},"template":"ParedeInv2"},{"x":2048,"y":320,"exts":{},"template":"ParedeInv2"},{"x":2048,"y":192,"exts":{},"template":"ParedeInv2"},{"x":2048,"y":64,"exts":{},"template":"ParedeInv2"},{"x":2048,"y":-64,"exts":{},"template":"ParedeInv2"},{"x":2030,"y":586,"exts":{},"template":"Bar_Blue"},{"x":2285,"y":586,"exts":{},"template":"Bar_Blue"},{"x":-132,"y":388,"exts":{},"template":"ParedeInv"},{"x":925,"y":500,"exts":{},"template":"Porta_Inferno"},{"x":550,"y":500,"exts":{},"template":"Porta_Morcegos"},{"x":1253,"y":500,"exts":{},"template":"Porta_Uivo"}]'),
    bgs: JSON.parse('[{"depth":-7,"texture":"Bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        this.minimo = 640
this.maximo = 1660
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['CavernasDosMorcegos'] = {
    name: 'CavernasDosMorcegos',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":640,"exts":{},"template":"Bar_Blue"},{"x":256,"y":640,"exts":{},"template":"Bar_Blue"},{"x":512,"y":640,"exts":{},"template":"Bar_Blue"},{"x":768,"y":640,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":640,"exts":{},"template":"Bar_Blue"},{"x":0,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":256,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":512,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":768,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1181,"y":110,"exts":{},"template":"Beetroot"},{"x":836,"y":110,"exts":{},"template":"Beetroot"},{"x":512,"y":110,"exts":{},"template":"Beetroot"},{"x":64,"y":512,"exts":{},"template":"Hero"},{"x":1280,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1280,"y":640,"exts":{},"template":"Bar_Blue"},{"x":-128,"y":512,"exts":{},"template":"ParedeInv"},{"x":-128,"y":384,"exts":{},"template":"ParedeInv"},{"x":-128,"y":256,"exts":{},"template":"ParedeInv"},{"x":-128,"y":128,"exts":{},"template":"ParedeInv"},{"x":-128,"y":0,"exts":{},"template":"ParedeInv"},{"x":1207,"y":110,"exts":{},"template":"Beetroot"},{"x":1234,"y":110,"exts":{},"template":"Beetroot"},{"x":1265,"y":110,"exts":{},"template":"Beetroot"},{"x":-128,"y":640,"exts":{},"template":"ParedeInv"},{"x":-128,"y":-64,"exts":{},"template":"ParedeInv"},{"x":1536,"y":640,"exts":{},"template":"Bar_Blue"},{"x":1792,"y":640,"exts":{},"template":"Bar_Blue"},{"x":1792,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1670,"y":618,"exts":{},"template":"cabecinha_INV"},{"x":2048,"y":640,"exts":{},"template":"Bar_Blue"},{"x":2048,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2304,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2560,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2304,"y":640,"exts":{},"template":"Bar_Blue"},{"x":2432,"y":640,"exts":{},"template":"Bar_Blue"},{"x":2821,"y":618,"exts":{},"template":"plataformapequena2"},{"x":3710,"y":675,"exts":{},"template":"plataformapequena2"},{"x":2816,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3072,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3328,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3584,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3840,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4096,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4352,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4608,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4864,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5120,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4507,"y":705,"exts":{},"template":"plataformapequena2"},{"x":4789,"y":609,"exts":{},"template":"chao3"},{"x":3238,"y":579,"exts":{},"template":"plataformapequena2"},{"x":4030,"y":575,"exts":{},"template":"chao3"},{"x":5248,"y":640,"exts":{},"template":"Bar_Blue"},{"x":5504,"y":640,"exts":{},"template":"Bar_Blue"},{"x":5376,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5632,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5888,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6144,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6400,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6656,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6976,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6912,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":7232,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5932,"y":662,"exts":{},"template":"plataformapequena2"},{"x":6377,"y":596,"exts":{},"template":"plataformapequena2"},{"x":6718,"y":654,"exts":{},"template":"plataformapequena2"},{"x":6316,"y":127,"exts":{},"template":"Beetroot"},{"x":6844,"y":127,"exts":{},"template":"Beetroot"},{"x":6609,"y":125,"exts":{},"template":"Beetroot"},{"x":7044,"y":128,"exts":{},"template":"Beetroot"},{"x":7188,"y":614,"exts":{},"template":"chao3"},{"x":7627,"y":554,"exts":{},"template":"plataformapequena2"},{"x":7488,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":7744,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8000,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8256,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8512,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8768,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":9024,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":9280,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":9536,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8000,"y":640,"exts":{},"template":"plataformapequena2"},{"x":8384,"y":576,"exts":{},"template":"Bar_Blue"},{"x":8640,"y":576,"exts":{},"template":"Bar_Blue"},{"x":8896,"y":576,"exts":{},"template":"Bar_Blue"},{"x":9152,"y":576,"exts":{},"template":"Bar_Blue"},{"x":9039,"y":552,"exts":{},"template":"cabecinha_INV"},{"x":9045,"y":130,"exts":{},"template":"Beetroot"},{"x":8946,"y":123,"exts":{},"template":"Beetroot"},{"x":8793,"y":130,"exts":{},"template":"Beetroot"},{"x":9408,"y":576,"exts":{},"template":"Bar_Blue"},{"x":9664,"y":576,"exts":{},"template":"Bar_Blue"},{"x":9664,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":9920,"y":448,"exts":{},"template":"ParedeInv2"},{"x":9920,"y":320,"exts":{},"template":"ParedeInv2"},{"x":9920,"y":192,"exts":{},"template":"ParedeInv2"},{"x":9920,"y":128,"exts":{},"template":"ParedeInv2"},{"x":9920,"y":0,"exts":{},"template":"ParedeInv2"},{"x":9920,"y":576,"exts":{},"template":"Bar_Blue"},{"x":9920,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3677,"y":102,"exts":{},"template":"Beetroot"},{"x":3322,"y":102,"exts":{},"template":"Beetroot"},{"x":9550,"y":486,"exts":{},"template":"Porta_Fim"},{"x":4901,"y":586,"exts":{},"template":"cabecinha"},{"x":1536,"y":-64,"exts":{},"template":"Bar_Blue"}]'),
    bgs: JSON.parse('[{"depth":-11,"texture":"Bg","extends":{"scaleX":1,"scaleY":1}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.vida = 4
this.mana = 3
this.control = true
this.dirEspada = 1


ct.rooms.append('UI', {
    isUi: true
});

this.camera = true
this.maximo = 9450
this.minimo = 664

hudvisivel = true
    },
    extends: {}
}
ct.rooms.templates['MainMenu'] = {
    name: 'MainMenu',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":0,"exts":{},"template":"MainMenu"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        

ct.gamepad.on('connected', entroucontrole)
ct.gamepad.on('disconnected', tiroucontrole)

function entroucontrole() {
    controle = true
}

function tiroucontrole() {
    controle = false
}

console.log('btn1:',ct.gamepad.getButton('Button1'))
console.log('btn2:',ct.gamepad.getButton('Button2'))
console.log('btn3:',ct.gamepad.getButton('Button3'))
console.log('btn4:',ct.gamepad.getButton('Button4'))
console.log('L1:',ct.gamepad.getButton('L1'))
console.log('L2:',ct.gamepad.getButton('L2'))
console.log('R1:',ct.gamepad.getButton('R1'))
console.log('L3:',ct.gamepad.getButton('L3'))
console.log('R3:',ct.gamepad.getButton('R3'))
console.log('R2:',ct.gamepad.getButton('R2'))
console.log('Start:',ct.gamepad.getButton('Start'))
console.log('Select:',ct.gamepad.getButton('Select'))
console.log('Up:',ct.gamepad.getButton('Up'))
console.log('Down:',ct.gamepad.getButton('Down'))
console.log('Left:',ct.gamepad.getButton('Left'))
console.log('Right:',ct.gamepad.getButton('Right'))
console.log('Coiso Esquerdo:',ct.gamepad.getAxis('LStickX'))
console.log('Coiso Direito:',ct.gamepad.getAxis('RStickX'))
console.log('Coiso Cima:',ct.gamepad.getAxis('LStickY'))
console.log('Coiso Baixo:',ct.gamepad.getAxis('LStickY'))

    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        tutorial = false
arma = 1
    },
    extends: {}
}
ct.rooms.templates['Fase Boss'] = {
    name: 'Fase Boss',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":704,"exts":{},"template":"Bar_Blue"},{"x":256,"y":704,"exts":{},"template":"Bar_Blue"},{"x":512,"y":704,"exts":{},"template":"Bar_Blue"},{"x":768,"y":704,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":704,"exts":{},"template":"Bar_Blue"},{"x":1280,"y":704,"exts":{},"template":"Bar_Blue"},{"x":-256,"y":704,"exts":{},"template":"Bar_Blue"},{"x":-128,"y":576,"exts":{},"template":"ParedeInv"},{"x":-128,"y":576,"exts":{},"template":"ParedeInv"},{"x":-128,"y":448,"exts":{},"template":"ParedeInv"},{"x":-128,"y":192,"exts":{},"template":"ParedeInv"},{"x":-128,"y":128,"exts":{},"template":"ParedeInv"},{"x":-128,"y":320,"exts":{},"template":"ParedeInv"},{"x":-128,"y":0,"exts":{},"template":"ParedeInv"},{"x":1280,"y":576,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":448,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":320,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":192,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":64,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":0,"exts":{},"template":"ParedeInv2"},{"x":0,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":256,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":512,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":768,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":383,"y":499,"exts":{},"template":"Hero"},{"x":625,"y":496,"exts":{},"template":"plataformapequena2"},{"x":128,"y":496,"exts":{},"template":"plataformapequena2"},{"x":832,"y":704,"exts":{},"template":"treco"},{"x":1073,"y":628,"exts":{},"template":"BossPTP"},{"x":1117,"y":496,"exts":{},"template":"plataformapequena2"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"Bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.dirEspada = 1

hudvisivel = true

tutorial = false
arma = 1
    },
    extends: {}
}
ct.rooms.templates['InfernoPedroso'] = {
    name: 'InfernoPedroso',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":640,"exts":{},"template":"Bar_Blue"},{"x":384,"y":731,"exts":{},"template":"LAVA"},{"x":639,"y":731,"exts":{},"template":"LAVA"},{"x":894,"y":731,"exts":{},"template":"LAVA"},{"x":553,"y":609,"exts":{},"template":"plataformapequena2"},{"x":1149,"y":731,"exts":{},"template":"LAVA"},{"x":1400,"y":731,"exts":{},"template":"LAVA"},{"x":2420,"y":756,"exts":{},"template":"LAVA"},{"x":2675,"y":731,"exts":{},"template":"LAVA"},{"x":2929,"y":731,"exts":{},"template":"LAVA"},{"x":965,"y":461,"exts":{},"template":"plataformapequena2"},{"x":1522,"y":586,"exts":{},"template":"plataformapequena2"},{"x":-131,"y":504,"exts":{},"template":"ParedeInv"},{"x":-131,"y":387,"exts":{},"template":"ParedeInv"},{"x":-133,"y":275,"exts":{},"template":"ParedeInv"},{"x":-128,"y":171,"exts":{},"template":"ParedeInv"},{"x":-128,"y":48,"exts":{},"template":"ParedeInv"},{"x":-125,"y":-13,"exts":{},"template":"ParedeInv"},{"x":0,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":256,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":576,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":512,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":832,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":1088,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":1344,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":1600,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":1856,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":2112,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":2368,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":2624,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":2880,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":3136,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":3392,"y":-128,"exts":{},"template":"Bar_Blue"},{"x":1792,"y":576,"exts":{},"template":"chao maior"},{"x":2048,"y":576,"exts":{},"template":"chao maior"},{"x":2855,"y":494,"exts":{},"template":"plataformapequena2"},{"x":1654,"y":731,"exts":{},"template":"LAVA"},{"x":1665,"y":731,"exts":{},"template":"LAVA"},{"x":3185,"y":731,"exts":{},"template":"LAVA"},{"x":3440,"y":731,"exts":{},"template":"LAVA"},{"x":3695,"y":731,"exts":{},"template":"LAVA"},{"x":3904,"y":731,"exts":{},"template":"LAVA"},{"x":4160,"y":731,"exts":{},"template":"LAVA"},{"x":4416,"y":731,"exts":{},"template":"LAVA"},{"x":4672,"y":731,"exts":{},"template":"LAVA"},{"x":4928,"y":731,"exts":{},"template":"LAVA"},{"x":3648,"y":-256,"exts":{},"template":"chao maior"},{"x":3904,"y":-256,"exts":{},"template":"chao maior"},{"x":4160,"y":-256,"exts":{},"template":"chao maior"},{"x":4416,"y":-256,"exts":{},"template":"chao maior"},{"x":4672,"y":-256,"exts":{},"template":"chao maior"},{"x":4928,"y":-256,"exts":{},"template":"chao maior"},{"x":5184,"y":-256,"exts":{},"template":"chao maior"},{"x":5440,"y":-256,"exts":{},"template":"chao maior"},{"x":5696,"y":-256,"exts":{},"template":"chao maior"},{"x":5952,"y":-256,"exts":{},"template":"chao maior"},{"x":6208,"y":-256,"exts":{},"template":"chao maior"},{"x":3456,"y":384,"exts":{},"template":"plataformapequena2"},{"x":1132,"y":-24,"exts":{},"template":"Beetroot"},{"x":2233,"y":-31,"exts":{},"template":"Beetroot"},{"x":3765,"y":-21,"exts":{},"template":"Beetroot"},{"x":4647,"y":-24,"exts":{},"template":"Beetroot"},{"x":3833,"y":505,"exts":{},"template":"plataformapequena2"},{"x":5184,"y":731,"exts":{},"template":"LAVA"},{"x":5440,"y":731,"exts":{},"template":"LAVA"},{"x":5312,"y":576,"exts":{},"template":"chao maior"},{"x":5568,"y":576,"exts":{},"template":"chao maior"},{"x":5824,"y":576,"exts":{},"template":"chao maior"},{"x":6080,"y":576,"exts":{},"template":"chao maior"},{"x":6272,"y":576,"exts":{},"template":"chao maior"},{"x":6528,"y":448,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":384,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":256,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":128,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":0,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":-64,"exts":{},"template":"ParedeInv2"},{"x":6272,"y":-256,"exts":{},"template":"chao maior"},{"x":128,"y":448,"exts":{},"template":"Hero"},{"x":2505,"y":538,"exts":{},"template":"cabecinha"},{"x":4597,"y":248,"exts":{},"template":"plataformapequena2"},{"x":4231,"y":454,"exts":{},"template":"plataformapequena2"},{"x":5015,"y":427,"exts":{},"template":"plataformapequena2"},{"x":4605,"y":546,"exts":{},"template":"plataformapequena2"},{"x":4616,"y":513,"exts":{},"template":"cabecinha_INV"},{"x":-347,"y":803,"exts":{},"template":"Mola"},{"x":2300,"y":576,"exts":{},"template":"chao maior"},{"x":6196,"y":485,"exts":{},"template":"Porta_Sair"}]'),
    bgs: JSON.parse('[{"depth":-3,"texture":"Bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.minimo = 700
this.maximo = 6072

this.vida = 4
this.mana = 3
this.control = true
this.dirEspada = 1


ct.rooms.append('UI', {
    isUi: true
});

hudvisivel = true
    },
    extends: {}
}
ct.rooms.templates['Tela Morte'] = {
    name: 'Tela Morte',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":768,"y":576,"exts":{},"template":"Voltar"},{"x":128,"y":576,"exts":{},"template":"jogar_novamente"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"Tela_Morte","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        

if (ct.actions.Dir.pressed && this.pos == 1) {
    this.pos = 2
}

if (ct.actions.Esq.pressed && this.pos == 2) {
    this.pos = 1
}

if (this.pos == 1 && ct.actions.start.pressed) {
 ct.rooms.switch(fase)
}

if (this.pos == 2 && ct.actions.start.pressed) {
    ct.rooms.switch('Andar 1')
}



    },
    onDraw() {
        
    },
    onLeave() {
        debug1 = true
    },
    onCreate() {
        this.pos = 1
    },
    extends: {}
}
ct.rooms.templates['Tutorial'] = {
    name: 'Tutorial',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-128,"y":512,"exts":{},"template":"ParedeInv"},{"x":-128,"y":384,"exts":{},"template":"ParedeInv"},{"x":-128,"y":256,"exts":{},"template":"ParedeInv"},{"x":-128,"y":128,"exts":{},"template":"ParedeInv"},{"x":-128,"y":0,"exts":{},"template":"ParedeInv"},{"x":256,"y":-192,"exts":{},"template":"chao maior"},{"x":512,"y":-192,"exts":{},"template":"chao maior"},{"x":768,"y":-192,"exts":{},"template":"chao maior"},{"x":1024,"y":-192,"exts":{},"template":"chao maior"},{"x":0,"y":-192,"exts":{},"template":"chao maior"},{"x":1280,"y":-192,"exts":{},"template":"chao maior"},{"x":1536,"y":-192,"exts":{},"template":"chao maior"},{"x":1792,"y":-192,"exts":{},"template":"chao maior"},{"x":286,"y":559,"exts":{},"template":"Hero"},{"x":2048,"y":-192,"exts":{},"template":"chao maior"},{"x":2304,"y":-192,"exts":{},"template":"chao maior"},{"x":2560,"y":-192,"exts":{},"template":"chao maior"},{"x":2816,"y":-192,"exts":{},"template":"chao maior"},{"x":3072,"y":-192,"exts":{},"template":"chao maior"},{"x":3392,"y":-192,"exts":{},"template":"chao maior"},{"x":3328,"y":-192,"exts":{},"template":"chao maior"},{"x":3712,"y":-192,"exts":{},"template":"chao maior"},{"x":3648,"y":-192,"exts":{},"template":"chao maior"},{"x":3968,"y":-192,"exts":{},"template":"chao maior"},{"x":4224,"y":-192,"exts":{},"template":"chao maior"},{"x":1792,"y":512,"exts":{},"template":"Golem_Sleep"},{"x":4480,"y":-192,"exts":{},"template":"chao maior"},{"x":4736,"y":-192,"exts":{},"template":"chao maior"},{"x":4992,"y":-192,"exts":{},"template":"chao maior"},{"x":4992,"y":640,"exts":{},"template":"Bar_Blue"},{"x":5248,"y":640,"exts":{},"template":"Bar_Blue"},{"x":5248,"y":-192,"exts":{},"template":"chao maior"},{"x":5504,"y":640,"exts":{},"template":"Bar_Blue"},{"x":5504,"y":-192,"exts":{},"template":"chao maior"},{"x":4730,"y":635,"exts":{},"template":"Golem2_tuto"},{"x":5760,"y":-192,"exts":{},"template":"chao maior"},{"x":6016,"y":-192,"exts":{},"template":"chao maior"},{"x":6272,"y":-192,"exts":{},"template":"chao maior"},{"x":5760,"y":640,"exts":{},"template":"Bar_Blue"},{"x":6016,"y":640,"exts":{},"template":"Bar_Blue"},{"x":6272,"y":640,"exts":{},"template":"Bar_Blue"},{"x":6528,"y":512,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":384,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":256,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":128,"exts":{},"template":"ParedeInv2"},{"x":6528,"y":0,"exts":{},"template":"ParedeInv2"},{"x":5733,"y":552,"exts":{},"template":"Porta_Sair_tuto"},{"x":6528,"y":-192,"exts":{},"template":"chao maior"},{"x":6528,"y":640,"exts":{},"template":"Bar_Blue"},{"x":-256,"y":-192,"exts":{},"template":"chao maior"}]'),
    bgs: JSON.parse('[{"depth":-12,"texture":"Bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[{"texture":"chao4","frame":0,"x":2816,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":2560,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":2304,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":2048,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":1792,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":1536,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":1280,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":1024,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":768,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":512,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":256,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":0,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":3328,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":3072,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":4224,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":3968,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":4480,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":4736,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":4736,"y":640,"width":256,"height":128}],"extends":{"cgroup":"Solid"}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        this.corvo = ct.templates.list['Corvo'][0]
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.vida = 4
this.mana = 3
this.control = true
this.dirEspada = 1
this.apareceu = false
this.deleta1 = false
this.deleta2 = false
this.deleta3 = false
this.deletar4 = false
this.morreu = false
this.deletar5 = false
this.deletar6 = false
this.deletar2 = false
this.deletalogo = false
this.deletaisso = false
this.deletoudecria = false
this.ultimo = false
ct.rooms.append('UI', {
    isUi: true
});

this.camera = true
this.maximo = 9450
this.minimo = 664
ct.templates.copy('Corvo',980,36)


    },
    extends: {}
}
ct.rooms.templates['Início'] = {
    name: 'Início',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-128,"y":512,"exts":{},"template":"ParedeInv"},{"x":-128,"y":384,"exts":{},"template":"ParedeInv"},{"x":-128,"y":256,"exts":{},"template":"ParedeInv"},{"x":-128,"y":192,"exts":{},"template":"ParedeInv"},{"x":1280,"y":512,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":384,"exts":{},"template":"ParedeInv2"},{"x":1280,"y":320,"exts":{},"template":"ParedeInv2"},{"x":1408,"y":1728,"exts":{},"template":"ParedeInv2"},{"x":54,"y":560,"exts":{},"template":"Hero"},{"x":634,"y":551,"exts":{},"template":"Porta_Tutorial1"},{"x":1280,"y":-64,"exts":{},"template":"chao maior"},{"x":932,"y":404,"exts":{},"template":"SETA"}]'),
    bgs: JSON.parse('[{"depth":-11,"texture":"Bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[{"texture":"chao4","frame":0,"x":512,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":768,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":1024,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":1280,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":256,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":0,"y":640,"width":256,"height":128},{"texture":"chao4","frame":0,"x":-256,"y":640,"width":256,"height":128},{"texture":"chao maior","frame":0,"x":1536,"y":-64,"width":256,"height":256},{"texture":"chao maior","frame":0,"x":1024,"y":-64,"width":256,"height":256},{"texture":"chao maior","frame":0,"x":768,"y":-64,"width":256,"height":256},{"texture":"chao maior","frame":0,"x":512,"y":-64,"width":256,"height":256},{"texture":"chao maior","frame":0,"x":256,"y":-64,"width":256,"height":256},{"texture":"chao maior","frame":0,"x":0,"y":-64,"width":256,"height":256},{"texture":"chao maior","frame":0,"x":-256,"y":-64,"width":256,"height":256}],"extends":{"cgroup":"Solid"}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        var mc = ct.templates.list['Hero'][0]

// console.log(tutorial)

if (mc.x >= 1230) {
    if (tutorial) {
        ct.rooms.switch('Andar 1')
    } else if (!this.mostro && !this.delay) {
        // console.log('aaa')
        parototal = false
     ct.templates.copy('caixa_de_escolha_test',60,0)
     this.mostro = true
    } 
}

// // if (!this.mostro && tutorial && !this.delay) {
 
// // } 

if (this.delay && mc.x < 1210) {
    this.delay = false
}


    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.minimo  = 570
this.maximo = 700

this.delay = false
this.mostro = false

//controlavel


    },
    extends: {}
}
ct.rooms.templates['UivoDaMorte'] = {
    name: 'UivoDaMorte',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":640,"exts":{},"template":"Bar_Blue"},{"x":256,"y":640,"exts":{},"template":"Bar_Blue"},{"x":512,"y":640,"exts":{},"template":"Bar_Blue"},{"x":768,"y":640,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":640,"exts":{},"template":"Bar_Blue"},{"x":-128,"y":512,"exts":{},"template":"ParedeInv"},{"x":-128,"y":384,"exts":{},"template":"ParedeInv"},{"x":-128,"y":256,"exts":{},"template":"ParedeInv"},{"x":-128,"y":128,"exts":{},"template":"ParedeInv"},{"x":-128,"y":0,"exts":{},"template":"ParedeInv"},{"x":1280,"y":640,"exts":{},"template":"Bar_Blue"},{"x":1728,"y":576,"exts":{},"template":"plataformapequena2"},{"x":2079,"y":538,"exts":{},"template":"plataformapequena2"},{"x":2348,"y":583,"exts":{},"template":"plataformapequena2"},{"x":2560,"y":640,"exts":{},"template":"chao3"},{"x":3200,"y":576,"exts":{},"template":"plataformapequena2"},{"x":3648,"y":576,"exts":{},"template":"plataformapequena2"},{"x":3968,"y":576,"exts":{},"template":"Bar_Blue"},{"x":4224,"y":576,"exts":{},"template":"Bar_Blue"},{"x":0,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":256,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":512,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":768,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1024,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1280,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1536,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":1792,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2048,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2304,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2560,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":2816,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3072,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3328,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3584,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":3840,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4096,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4352,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4672,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4608,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4928,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5184,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5440,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5696,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":5952,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":4857,"y":562,"exts":{},"template":"plataformapequena2"},{"x":5323,"y":516,"exts":{},"template":"plataformapequena2"},{"x":5632,"y":512,"exts":{},"template":"chao3"},{"x":5888,"y":512,"exts":{},"template":"chao3"},{"x":6400,"y":448,"exts":{},"template":"plataformapequena2"},{"x":6208,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6464,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6720,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6976,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":7232,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":6912,"y":384,"exts":{},"template":"plataformapequena2"},{"x":7300,"y":448,"exts":{},"template":"plataformapequena2"},{"x":7488,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":7744,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8000,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":7616,"y":576,"exts":{},"template":"Bar_Blue"},{"x":7872,"y":576,"exts":{},"template":"Bar_Blue"},{"x":8128,"y":576,"exts":{},"template":"Bar_Blue"},{"x":8256,"y":-64,"exts":{},"template":"Bar_Blue"},{"x":8256,"y":576,"exts":{},"template":"Bar_Blue"},{"x":8512,"y":448,"exts":{},"template":"ParedeInv2"},{"x":8512,"y":320,"exts":{},"template":"ParedeInv2"},{"x":8512,"y":192,"exts":{},"template":"ParedeInv2"},{"x":8512,"y":64,"exts":{},"template":"ParedeInv2"},{"x":8281,"y":489,"exts":{},"template":"Porta_Sair"},{"x":1216,"y":192,"exts":{},"template":"Beetroot"},{"x":2112,"y":128,"exts":{},"template":"Beetroot"},{"x":2607,"y":511,"exts":{},"template":"cachorro"},{"x":3204,"y":129,"exts":{},"template":"Beetroot"},{"x":3357,"y":109,"exts":{},"template":"Beetroot"},{"x":3433,"y":109,"exts":{},"template":"Beetroot"},{"x":4032,"y":448,"exts":{},"template":"cachorro"},{"x":4304,"y":549,"exts":{},"template":"cabecinha_INV"},{"x":4873,"y":93,"exts":{},"template":"Beetroot"},{"x":5319,"y":110,"exts":{},"template":"Beetroot"},{"x":5696,"y":384,"exts":{},"template":"cachorro"},{"x":5952,"y":384,"exts":{},"template":"cachorro"},{"x":7941,"y":550,"exts":{},"template":"cabecinha_INV"},{"x":7736,"y":124,"exts":{},"template":"Beetroot"},{"x":8019,"y":122,"exts":{},"template":"Beetroot"},{"x":5568,"y":448,"exts":{},"template":"parede de cachorro "},{"x":6144,"y":448,"exts":{},"template":"parede de cachorro "},{"x":3904,"y":512,"exts":{},"template":"parede de cachorro "},{"x":4480,"y":512,"exts":{},"template":"parede de cachorro "},{"x":2496,"y":576,"exts":{},"template":"parede de cachorro "},{"x":2880,"y":576,"exts":{},"template":"parede de cachorro "},{"x":2624,"y":640,"exts":{},"template":"chao3"},{"x":192,"y":512,"exts":{},"template":"Hero"}]'),
    bgs: JSON.parse('[{"depth":-31,"texture":"Bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.minimo = 700
this.maximo = 8100

this.vida = 4
this.mana = 3
this.control = true
this.dirEspada = 1


ct.rooms.append('UI', {
    isUi: true
});

hudvisivel = true
    },
    extends: {}
}


/**
 * @namespace
 */
ct.styles = {
    types: { },
    /**
     * Creates a new style with a given name.
     * Technically, it just writes `data` to `ct.styles.types`
     */
    new(name, styleTemplate) {
        ct.styles.types[name] = styleTemplate;
        return styleTemplate;
    },
    /**
     * Returns a style of a given name. The actual behavior strongly depends on `copy` parameter.
     * @param {string} name The name of the style to load
     * @param {boolean|Object} [copy] If not set, returns the source style object.
     * Editing it will affect all new style calls.
     * When set to `true`, will create a new object, which you can safely modify
     * without affecting the source style.
     * When set to an object, this will create a new object as well,
     * augmenting it with given properties.
     * @returns {object} The resulting style
     */
    get(name, copy) {
        if (copy === true) {
            return ct.u.ext({}, ct.styles.types[name]);
        }
        if (copy) {
            return ct.u.ext(ct.u.ext({}, ct.styles.types[name]), copy);
        }
        return ct.styles.types[name];
    }
};

ct.styles.new(
    "teste",
    {
    "fontFamily": "\"CTPROJFONTRetro Gaming\", \"Retro Gaming\", sans-serif",
    "fontSize": 30,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 32,
    "fill": "#FFFFFF",
    "strokeThickness": 5,
    "stroke": "#000000"
});

ct.styles.new(
    "teste2",
    {
    "fontFamily": "\"CTPROJFONTRetro Gaming\", \"Retro Gaming\", sans-serif",
    "fontSize": 30,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 32,
    "fill": "#FFFFFF",
    "strokeThickness": 5,
    "stroke": "#000000"
});

ct.styles.new(
    "teste3",
    {
    "fontFamily": "\"CTPROJFONTRetro Gaming\", \"Retro Gaming\", sans-serif",
    "fontSize": 23,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 32,
    "fill": "#FFFFFF",
    "strokeThickness": 5,
    "stroke": "#000000"
});

ct.styles.new(
    "falacorvo",
    {
    "fontFamily": "\"CTPROJFONTRetro Gaming\", \"Retro Gaming\", sans-serif",
    "fontSize": 21,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 24,
    "fill": "#FFFFFF",
    "strokeThickness": 1,
    "stroke": "#000000"
});

ct.styles.new(
    "fullbranco",
    {
    "fontFamily": "\"CTPROJFONTRetro Gaming\", \"Retro Gaming\", sans-serif",
    "fontSize": 24,
    "fontStyle": "normal",
    "fontWeight": "100",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 32.400000000000006,
    "wordWrap": true,
    "wordWrapWidth": 350,
    "fill": "#FFFFFF"
});



/**
 * @extends {PIXI.AnimatedSprite}
 * @class
 * @property {string} template The name of the template from which the copy was created
 * @property {IShapeTemplate} shape The collision shape of a copy
 * @property {number} depth The relative position of a copy in a drawing stack.
 * Higher values will draw the copy on top of those with lower ones
 * @property {number} xprev The horizontal location of a copy in the previous frame
 * @property {number} yprev The vertical location of a copy in the previous frame
 * @property {number} xstart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} ystart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} hspeed The horizontal speed of a copy
 * @property {number} vspeed The vertical speed of a copy
 * @property {number} gravity The acceleration that pulls a copy at each frame
 * @property {number} gravityDir The direction of acceleration that pulls a copy at each frame
 * @property {number} depth The position of a copy in draw calls
 * @property {boolean} kill If set to `true`, the copy will be destroyed by the end of a frame.
 */
const Copy = (function Copy() {
    const textureAccessor = Symbol('texture');
    const zeroDirectionAccessor = Symbol('zeroDirection');
    const hspeedAccessor = Symbol('hspeed');
    const vspeedAccessor = Symbol('vspeed');
    let uid = 0;
    class Copy extends PIXI.AnimatedSprite {
        /**
         * Creates an instance of Copy.
         * @param {string} template The name of the template to copy
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object with additional properties
         * that will exist prior to a copy's OnCreate event
         * @param {PIXI.DisplayObject|Room} [container] A container to set as copy's parent
         * before its OnCreate event. Defaults to ct.room.
         * @memberof Copy
         */
        constructor(template, x, y, exts, container) {
            container = container || ct.room;
            var t;
            if (template) {
                if (!(template in ct.templates.templates)) {
                    throw new Error(`[ct.templates] An attempt to create a copy of a non-existent template \`${template}\` detected. A typo?`);
                }
                t = ct.templates.templates[template];
                if (t.texture && t.texture !== '-1') {
                    const textures = ct.res.getTexture(t.texture);
                    super(textures);
                    this[textureAccessor] = t.texture;
                    this.anchor.x = textures[0].defaultAnchor.x;
                    this.anchor.y = textures[0].defaultAnchor.y;
                } else {
                    super([PIXI.Texture.EMPTY]);
                }
                this.template = template;
                this.parent = container;
                this.blendMode = t.blendMode || PIXI.BLEND_MODES.NORMAL;
                if (t.playAnimationOnStart) {
                    this.play();
                }
                if (t.extends) {
                    ct.u.ext(this, t.extends);
                }
            } else {
                super([PIXI.Texture.EMPTY]);
            }
            // it is defined in main.js
            // eslint-disable-next-line no-undef
            this[copyTypeSymbol] = true;
            this.position.set(x || 0, y || 0);
            this.xprev = this.xstart = this.x;
            this.yprev = this.ystart = this.y;
            this[hspeedAccessor] = 0;
            this[vspeedAccessor] = 0;
            this[zeroDirectionAccessor] = 0;
            this.speed = this.direction = this.gravity = 0;
            this.gravityDir = 90;
            this.depth = 0;
            if (exts) {
                ct.u.ext(this, exts);
                if (exts.tx) {
                    this.scale.x = exts.tx;
                }
                if (exts.ty) {
                    this.scale.y = exts.ty;
                }
                if (exts.tr) {
                    this.angle = exts.tr;
                }
            }
            this.uid = ++uid;
            if (template) {
                ct.u.ext(this, {
                    template,
                    depth: t.depth,
                    onStep: t.onStep,
                    onDraw: t.onDraw,
                    onCreate: t.onCreate,
                    onDestroy: t.onDestroy,
                    shape: ct.res.getTextureShape(t.texture || -1)
                });
                if (exts && exts.depth !== void 0) {
                    this.depth = exts.depth;
                }
                if (ct.templates.list[template]) {
                    ct.templates.list[template].push(this);
                } else {
                    ct.templates.list[template] = [this];
                }
                this.onBeforeCreateModifier();
                ct.templates.templates[template].onCreate.apply(this);
            }
            return this;
        }

        /**
         * The name of the current copy's texture, or -1 for an empty texture.
         * @param {string} value The name of the new texture
         * @type {(string|number)}
         */
        set tex(value) {
            if (this[textureAccessor] === value) {
                return value;
            }
            var {playing} = this;
            this.textures = ct.res.getTexture(value);
            this[textureAccessor] = value;
            this.shape = ct.res.getTextureShape(value);
            this.anchor.x = this.textures[0].defaultAnchor.x;
            this.anchor.y = this.textures[0].defaultAnchor.y;
            if (playing) {
                this.play();
            }
            return value;
        }
        get tex() {
            return this[textureAccessor];
        }

        get speed() {
            return Math.hypot(this.hspeed, this.vspeed);
        }
        /**
         * The speed of a copy that is used in `this.move()` calls
         * @param {number} value The new speed value
         * @type {number}
         */
        set speed(value) {
            if (value === 0) {
                this[zeroDirectionAccessor] = this.direction;
                this.hspeed = this.vspeed = 0;
                return;
            }
            if (this.speed === 0) {
                const restoredDir = this[zeroDirectionAccessor];
                this[hspeedAccessor] = value * Math.cos(restoredDir * Math.PI / 180);
                this[vspeedAccessor] = value * Math.sin(restoredDir * Math.PI / 180);
                return;
            }
            var multiplier = value / this.speed;
            this.hspeed *= multiplier;
            this.vspeed *= multiplier;
        }
        get hspeed() {
            return this[hspeedAccessor];
        }
        set hspeed(value) {
            if (this.vspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[hspeedAccessor] = value;
            return value;
        }
        get vspeed() {
            return this[vspeedAccessor];
        }
        set vspeed(value) {
            if (this.hspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[vspeedAccessor] = value;
            return value;
        }
        get direction() {
            if (this.speed === 0) {
                return this[zeroDirectionAccessor];
            }
            return (Math.atan2(this.vspeed, this.hspeed) * 180 / Math.PI + 360) % 360;
        }
        /**
         * The moving direction of the copy, in degrees, starting with 0 at the right side
         * and going with 90 facing upwards, 180 facing left, 270 facing down.
         * This parameter is used by `this.move()` call.
         * @param {number} value New direction
         * @type {number}
         */
        set direction(value) {
            this[zeroDirectionAccessor] = value;
            if (this.speed > 0) {
                var speed = this.speed;
                this.hspeed = speed * Math.cos(value * Math.PI / 180);
                this.vspeed = speed * Math.sin(value * Math.PI / 180);
            }
            return value;
        }

        /**
         * Performs a movement step, reading such parameters as `gravity`, `speed`, `direction`.
         * @returns {void}
         */
        move() {
            if (this.gravity) {
                this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
                this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
            }
            this.x += this.hspeed * ct.delta;
            this.y += this.vspeed * ct.delta;
        }
        /**
         * Adds a speed vector to the copy, accelerating it by a given delta speed
         * in a given direction.
         * @param {number} spd Additive speed
         * @param {number} dir The direction in which to apply additional speed
         * @returns {void}
         */
        addSpeed(spd, dir) {
            this.hspeed += spd * Math.cos(dir * Math.PI / 180);
            this.vspeed += spd * Math.sin(dir * Math.PI / 180);
        }

        /**
         * Returns the room that owns the current copy
         * @returns {Room} The room that owns the current copy
         */
        getRoom() {
            let parent = this.parent;
            while (!(parent instanceof Room)) {
                parent = parent.parent;
            }
            return parent;
        }

        // eslint-disable-next-line class-methods-use-this
        onBeforeCreateModifier() {
            // Filled by ct.IDE and catmods
            
        }
    }
    return Copy;
})();

(function ctTemplateAddon(ct) {
    const onCreateModifier = function () {
        this.$chashes = ct.place.getHashes(this);
for (const hash of this.$chashes) {
    if (!(hash in ct.place.grid)) {
        ct.place.grid[hash] = [this];
    } else {
        ct.place.grid[hash].push(this);
    }
}
if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText = new PIXI.Text('Not initialized', {
        fill: 0xffffff,
        dropShadow: true,
        dropShadowDistance: 2,
        fontSize: [][0] || 16
    });
    this.$cDebugCollision = new PIXI.Graphics();
    this.addChild(this.$cDebugCollision, this.$cDebugText);
}

    };

    /**
     * An object with properties and methods for manipulating templates and copies,
     * mainly for finding particular copies and creating new ones.
     * @namespace
     */
    ct.templates = {
        Copy,
        /**
         * An object that contains arrays of copies of all templates.
         * @type {Object.<string,Array<Copy>>}
         */
        list: {
            BACKGROUND: [],
            TILEMAP: []
        },
        /**
         * A map of all the templates of templates exported from ct.IDE.
         * @type {object}
         */
        templates: { },
        /**
         * Creates a new copy of a given template inside a specific room.
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {Room} [room] The room to which add the copy.
         * Defaults to the current room.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copyIntoRoom(template, x = 0, y = 0, room, exts) {
            // An advanced constructor. Returns a Copy
            if (!room || !(room instanceof Room)) {
                throw new Error(`Attempt to spawn a copy of template ${template} inside an invalid room. Room's value provided: ${room}`);
            }
            const obj = new Copy(template, x, y, exts);
            room.addChild(obj);
            ct.stack.push(obj);
            onCreateModifier.apply(obj);
            return obj;
        },
        /**
         * Creates a new copy of a given template inside the current root room.
         * A shorthand for `ct.templates.copyIntoRoom(template, x, y, ct.room, exts)`
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copy(template, x = 0, y = 0, exts) {
            return ct.templates.copyIntoRoom(template, x, y, ct.room, exts);
        },
        /**
         * Applies a function to each copy in the current room
         * @param {Function} func The function to apply
         * @returns {void}
         */
        each(func) {
            for (const copy of ct.stack) {
                if (!(copy instanceof Copy)) {
                    continue; // Skip backgrounds and tile layers
                }
                func.apply(copy, this);
            }
        },
        /**
         * Applies a function to a given object (e.g. to a copy)
         * @param {Copy} obj The copy to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withCopy(obj, func) {
            func.apply(obj, this);
        },
        /**
         * Applies a function to every copy of the given template name
         * @param {string} template The name of the template to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withTemplate(template, func) {
            for (const copy of ct.templates.list[template]) {
                func.apply(copy, this);
            }
        },
        /**
         * Checks whether there are any copies of this template's name.
         * Will throw an error if you pass an invalid template name.
         * @param {string} template The name of a template to check.
         * @returns {boolean} Returns `true` if at least one copy exists in a room;
         * `false` otherwise.
         */
        exists(template) {
            if (!(template in ct.templates.templates)) {
                throw new Error(`[ct.templates] ct.templates.exists: There is no such template ${template}.`);
            }
            return ct.templates.list[template].length > 0;
        },
        /*
         * Checks whether a given object exists in game's world.
         * Intended to be applied to copies, but may be used with other PIXI entities.
         * @param {Copy|PIXI.DisplayObject|any} obj The copy which existence needs to be checked.
         * @returns {boolean} Returns `true` if a copy exists; `false` otherwise.
         */
        valid(obj) {
            if (obj instanceof Copy) {
                return !obj.kill;
            }
            if (obj instanceof PIXI.DisplayObject) {
                return Boolean(obj.position);
            }
            return Boolean(obj);
        },
        /**
         * Checks whether a given object is a ct.js copy.
         * @param {any} obj The object which needs to be checked.
         * @returns {boolean} Returns `true` if the passed object is a copy; `false` otherwise.
         */
        isCopy(obj) {
            return obj instanceof Copy;
        }
    };

    
ct.templates.templates["Hero"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Idle",
    onStep: function () {
        if (camera) {
ct.camera.follow = this;
}

if (this.y <= -50) {
    vida = 0
}

if (!parototal || vida <= 0) {
    this.hspeed = 0
     this.vspeed = 0
    controlavel = false
} else {
     controlavel = true
 }

if (this.x >= ct.room.minimo && this.x <= ct.room.maximo ) {
 ct.camera.borderX = null;
} 

if(this.x <= ct.room.minimo || this.x >= ct.room.maximo) {
    ct.camera.borderX = 80
}
//isso é pra pra controlar as bordas 


if (this.vida < 0 || this.y > 1000) {
  
    this.timerMorte += ct.delta
}

if (this.timerMorte >= 12) {
  ct.rooms.switch('Tela Morte')
}

fase = ct.room.name

if (!controlavel) {
    this.controlavel = false
} else {
    this.controlavel = true
}

mana = this.mana

vida = this.vida

ct.room.dirEspada = this.dirAnterior

if (!controle) {
 if (this.controlavel && !this.colidiu && vida > 0) {
     this.hspeed = ct.actions.MoveX.value * this.velocidade;     //A variável hspeed controla a velocidade horizontal do objeto
// //Não movemos o objeto na vertical pois isso é feito pela gravidade!
 }
} else {
    if (this.controlavel && !this.colidiu && vida > 0 && ct.gamepad.getAxis("LStickX") != 0) {
     this.hspeed = this.velocidade * ct.gamepad.getAxis("LStickX"); 
}
}

this.moveContinuousByAxes("Solid");       //Move o objeto, com colisão com o grupo "Solid"

if (ct.place.occupied(this,this.x,this.y,"Inimigo") && !this.colidiu){
    this.colidiu = true
    this.vida -= 1
}

if (this.colidiu) {
    controlavel = false
    this.tavoltando += ct.delta
    // this.hspeed = -8
}

if (ct.actions.Qualquer.pressed) {
    this.tavoltando += 1.5
}

    // console.log(this.hspeed)
    // console.log(parototal)
    // console.log(controlavel)

if (this.tavoltando >= 30) {
    this.colidiu = false
    controlavel = true
    this.tavoltando = 0
}




if (ct.place.meet(this,this.x,this.y,'LAVA')) {
    this.vida -= 1
}

// if (ct.place.meet(this,this.x,this.y,'VOID')) {
//     this.vida -= 1
// }

if (ct.place.occupied(this,this.x,this.y,"Projetil")){
    //this.angle = -90
    //console.log ('fuleco nao aguentou')
    this.vida -= 1
    this.timerDano = 0
}

if (ct.place.occupied(this,this.x+1,this.y,"FOGO")){
    //this.angle = -90
    //console.log ('fuleco nao aguentou o calor do rj')
    if (passiva == 4) {
    this.vida -= 2
    } else {this.vida--}
}

if (ct.place.meet(this,this.x,this.y,'FOGO2')){
    this.vida --;
}

var chao = ct.place.occupied(this,this.x,this.y+1,"Solid");   //Verifica se há uma colisão no "pé" do objeto, com o grupo  "solidos"
//
if (chao) {             //Se a colisão acontecer, ajustar a velocidade vertical para 0 - é necessário para evitar problemas
    this.vspeed = 0;
    this.noar = 0
    //this.gotoAndStop(0)
} else {
    //this.gotoAndStop(1)
}

if (this.vida <= 0) {
    this.controlavel = false
    this.angle = -90
    this.hspeed = 0
}

if (ct.actions.Pular.pressed  && chao && this.controlavel) {   //Se o botão de pular foi pressionado, ajustar a velocidade vertical - a gravidade faz o resto
    this.vspeed = -19;
    //this.tex = 'Jump'
}


if (ct.actions.Pular.released && !chao) {
    this.vspeed += 7.5
}

 

if (this.controlavel) {
if (ct.actions.Atirar.pressed && arma == 1 && this.timerTiro>12) {
    ct.templates.copy("Tiro1",this.x+ this.add,this.y+ this.addy, {
        hspeed: 10  * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    });
    this.timerTiro = 0;
    this.distanciaCenoura = 1;
}

if (ct.actions.Atirar.pressed && arma == 6 && this.timerTiro>30){
    ct.templates.copy("Tiro6",this.x+ this.add,this.y+ this.addy -40, {
        hspeed: 10  * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    });
    this.timerTiro = 0;
    this.distanciaCenoura = 1;
}

if (ct.actions.Atirar.pressed && arma == 4 && this.timerTiro>12) {
    ct.templates.copy("Tiro4",this.x+ this.add,this.y+ this.addy, {
        hspeed: 8  * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    });
    this.timerTiro = 0;
    this.distanciaCenoura = 1;
}

if (ct.actions.Atirar.pressed && arma == 3 && this.timerTiro>12) {
    ct.templates.copy("Tiro3",this.x+ this.add,this.y+ this.addy, {
        hspeed: 10  * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    });
    this.timerTiro = 0;
    this.distanciaCenoura = 1;
}

if (ct.actions.Atirar.pressed  && arma == 5 && this.timerTiro>12) {
    ct.templates.copy("Tiro5",this.x+ this.add,this.y+ this.addy, {
        hspeed: 10  * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    });
    this.timerTiro = 0;
    this.distanciaCenoura = 1;
}

if (ct.actions.Atirar.pressed && arma == 8 && this.timerTiro>28) {
if (this.dirAnterior == 1) {
    for (var i = -45;i < 45;) {
        ct.templates.copy('Tiro8',this.x + this.add,this.y + this.addy, {
        speed: 8,
        direction: i
        });
        this.timerTiro = 0;
        this.distanciaCenoura = 1;
        i += 13.5
    }
} else {
    for (var i = -45;i < 45;) {
        ct.templates.copy('Tiro8',this.x + this.add,this.y + this.addy, {
        speed: 8,
        direction: i + 180
        });
        this.timerTiro = 0;
        this.distanciaCenoura = 1;
        i += 13.5
    }
}
}
// console.log(this.dirAnterior)

if (ct.actions.Skill.pressed) {
    if (this.mana > 0) {
   if (this.scale.x == 1) {
    ct.templates.copy("Skill1",this.x + this.add + 32,this.y+this.addy, {
        hspeed: 9 * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    })
   } else if (this.scale.x == -1) {
         ct.templates.copy("Skill1",this.x + this.add + 32,this.y+this.addy, {
        hspeed: 9 * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0,
        angle:180
    })  
    //this.timerTiro = 0
}
this.mana --;
    } else {
            ct.templates.copy("texto",this.x-192,this.y-64)
            }
}




if (ct.actions.Melee.pressed  && this.timerMelee>=85) {
    ct.templates.copy("Crystal",this.x,this.y)
    this.timerMelee = 50
    this.combo += 1
}

// if (ct.actions.Melee.pressed && this.timerMelee>=78 && this.dirAnterior > 0) {
//     ct.templates.copy("Crystal2",this.x,this.y)
//     this.timerMelee = 62
//     this.combo += 1
// }

if (this.combo >= 3){
    this.timerMelee = 40
    this.combo = 0
}


if (ct.actions.Atirar.pressed  && arma == 10 && this.timerTiro>=100000) {
    ct.templates.copy("Tiro10",this.x+ this.add,this.y+ this.addy, {
        // hspeed: 6.5  * this.dirAnterior,
        // vspeed: 0 + this.speedy,
        // gravity: 0
    });
    this.dano = 3
    //var efeito = 'fogo'
    this.timerTiro = 0;
    //this.distanciaCenoura = 1;
}



if (ct.actions.Atirar.pressed  && arma == 2 && this.timerTiro >= 36 && !this.vairajada) {
    this.vairajada = true
    this.atirando = true
}

if (this.vairajada) {
    if (this.rajadareset < 3) {
    this.rajada += ct.delta
} else {
    this.atirando = false
    this.vairajada = false
    this.timerTiro = 0
    this.rajadareset = 0
}
}
if (this.rajada >= 12) {
     if (this.scale.x == 1) {
    ct.templates.copy("Tiro2",this.x + this.add + 16,this.y+this.addy, {
        hspeed:9.5 * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0
    })
}  else if (this.scale.x == -1) {
         ct.templates.copy("Tiro2",this.x + this.add + 16,this.y+this.addy, {
        hspeed:9.5 * this.dirAnterior,
        vspeed: 0 + this.speedy,
        gravity: 0,
        angle:180
    })
}
    this.rajada = 0
    this.rajadareset += 1
}

// console.log(this.timerTiro)

// console.log(this.atirando)
// if (ct.actions.Atirar.value>0) {
//     this.distanciaCenoura += 0.15;
//     if (this.distanciaCenoura>5) {
//         this.distanciaCenoura = 5;
//     }
// }
// }

if (ct.actions.Atirar.down  && this.timerTiro >= 10 && arma == 7) {
    ct.templates.copy('Tiro7',this.x + this.add,this.y+this.addy, {
        hspeed:12.5 * this.dirAnterior,
        vspeed: 0 + this.speedy
    })
    this.timerTiro = ct.random.dice(0,0,0,0,1,1,1,2)
}
this.timerTiro += ct.delta * this.buffatkspeed;
this.timerMelee += ct.delta;
this.timerDano += ct.delta
this.reloadRajada += ct.delta
if (ct.actions.Acel.pressed) {
    this.velocidade = 12
    this.animationSpeed = 12 / 60;
}

// if (ct.gamepad.getButton('L3')) {
//     this.velocidade = 12
//     this.animationSpeed = 12 / 60;
// }

if (ct.actions.Acel.released) {
    this.velocidade = 8
    this.animationSpeed = 8 / 60;
}

// if (!ct.gamepad.getButton('L3')) {
//     this.velocidade = 8
//     this.animationSpeed = 8 / 60;
// }

// if (ct.actions.Voo.pressed) {   //Se o botão de pular foi pressionado,vai voar
//     this.gravity = 0.15;
// }

// if (ct.actions.Voo.released) {   //Se o botão de pular foi pressionado,vai voar
//     this.gravity = 0.5;
// }


if (ct.actions.MoveX.value!=0) {
    this.dirAnterior = this.dir;
    this.dir = ct.actions.MoveX.value;
}
//controles setinhas
if (this.controlavel) {
    if(ct.actions.Dir.pressed) {
        this.add = 48
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = this.dir;
        this.scale.x = 1
        direcao = 1
        //this.tex = 'Walk'
    }

    if ( ct.gamepad.getAxis('LStickX') == 1) {
        this.hspeed = this.velocidade
    }

    
    if (ct.gamepad.getAxis('LStickX') == -1) {
        this.hspeed = this.velocidade * -1
    }

        if(ct.gamepad.getButton("Right") || ct.gamepad.getAxis('LStickX') == 1) {
        this.add = 48
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = this.dir;
        this.scale.x = 1
        direcao = 1
        //this.tex = 'Walk'
    }

    if(ct.actions.Esq.pressed || ct.gamepad.getAxis('LStickX') == -1) {
        this.add = -48
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = this.dir
        this.scale.x = -1
        direcao = -1
        //this.tex = 'Walk'
    }

        if(ct.gamepad.getButton('Left')) {
        this.add = -48
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = this.dir
        this.scale.x = -1
        direcao = -1
        console.log('yeee')
        //this.tex = 'Walk'
    }

console.log(ct.gamepad.getAxis('LStickX'))

    if (ct.actions.Cima.pressed || ct.gamepad.getAxis('LStickY') == -1) {
        this.add = 0
        this.addy = -96
        this.speedy = -5
        this.dirAnterior = 0
        var angulo = 90
        //this.tex = 'Cat_Up'
    }

    if (ct.actions.Baixo.pressed || ct.gamepad.getAxis('LStickY') == 1) {
        this.add = 0
        this.addy = 96
        this.speedy = 5
        this.dirAnterior = 0
        var angulo = 90
        //this.tex = 'Cat_Down'
    }

    if (ct.actions.Baixo.released) {
        if (direcao == 1) {
        this.add = 48
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = 1
        //direcao = 1
        //this.scale.x = 1
        } else if (direcao == -1) {
        this.add = -48
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = -1
        //direcao = -1
        //this.scale.x = -1  
        }
    }

        if (ct.actions.Cima.released) {
        if (direcao == 1) {
        this.add = 32
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = 1
        //direcao = 1
        //this.scale.x = 1
        } else if (direcao == -1) {
        this.add = -32
        this.addy = 0
        this.speedy = 0
        this.dir = ct.actions.MoveX.value;
        this.dirAnterior = -1
        //this.scale.x = -1  
        //direcao = -1
        }
    }

// console.log(direcao)
// console.log(ct.actions.MoveX.value)
//console.log(this.dir)
//console.log(this.dirAnterior)


    // if (ct.actions.Trocar2.pressed && arma!=2) {
    //     arma = 2
    // }

    if (ct.actions.Trocar1.pressed && pocao>0 && vida < 4) {
        this.vida += 1
        pocao -= 1
            }

    if (ct.actions.Trocar2.pressed && elixir>0 && mana < 3) {
        this.mana += 1
        elixir -= 1
            }



    if (ct.actions.Trocar3.pressed && arma !=3) {
        ct.templates.copy('Skill2',this.x + 32,this.y -64, {
            direcao: this.dirAnterior
        })
    }

        if (ct.actions.Quatro.released && !menuskillaberto) {
        ct.templates.copy('coiso_de_escolher',ct.camera.x - 640,0)
        menuskillaberto = true
    }
}
} else {
    //this.hspeed = 0
    //this.vspeed = 0
    
}

if (ct.place.meet(this,this.x+(2*this.dirAnterior),this.y, 'ParedeInv') && this.reloadTexto >= 30) {
    //ct.templates.copy("texto2",this.x-32,this.y-64)
    //this.reloadTexto = 0
    this.x += 15
}

if (ct.place.meet(this,this.x+(2*this.dirAnterior),this.y, 'ParedeInv2') && this.reloadTexto >= 30) {
    //ct.templates.copy("texto2",this.x-250,this.y-64)
    //this.reloadTexto = 0
    this.x -= 15
}

if (passiva == 1 && mana == 3) {
    this.buffatkspeed = 1.25
}

if (passiva == 2 && mana < 1) {
    this.buffatkspeed = 1.35
}

//com 1 de vida da mais dano

if (passiva == 3 && vida == 1) {
    buffdano = 2
} else {
    buffdano = 1
}


//passiva de ganhar mana depois de matar inimigo

if (passiva == 6) {
    if (matougrande) {
        mana += 1
        matougrande = false
    }
    if (matoumedio) {
        this.chancemana = ct.random.dice(1,2,3,4,5)
    }
}

if (this.chancemana >= 3) {
    mana += 1
    matoumedio = false
    this.chancemana = 0
} else {
    matoumedio = false
    this.chancemana = 0
}

if (ct.actions.Esc.pressed && !menuskillaberto && !tafazendotuto) {
    menuskillaberto = true
    parototal = false
    ct.templates.copy('MenuSkills',ct.camera.x - 640,0)
}


    },
    onDraw: function () {
        if (this.controlavel) {
if (ct.place.occupied(this, this.x, this.y + 2, 'Solid') && !this.colidiu) {
    if (ct.actions.MoveX.down) {
        if (ct.actions.Atirar.down && this.timerTiro < 16 && arma != 2 || ct.actions.Skill.pressed && mana != 0 || ct.actions.Atirar.down && arma == 7 || ct.actions.Atirar.down && arma == 2 && this.atirando) {
        this.tex = 'W_Shoot'
        console.log('a')
    } else {
        this.tex = 'Walk'
    }
    } else if (ct.actions.Atirar.down && this.timerTiro < 26 && arma != 2  && ct.actions.Cima.down|| ct.actions.Skill.pressed && mana != 0  && ct.actions.Cima.down|| ct.actions.Atirar.down && arma == 7  && ct.actions.Cima.down|| ct.actions.Atirar.down && arma == 2 && this.atirando && ct.actions.Cima.down) {
this.tex = 'Up_Shoot'
    } else if (ct.actions.Atirar.down && this.timerTiro < 26 && arma != 2  && ct.actions.Baixo.down|| ct.actions.Skill.pressed && mana != 0  && ct.actions.Baixo.down|| ct.actions.Atirar.down && arma == 7  && ct.actions.Baixo.down|| ct.actions.Atirar.down && arma == 2 && this.atirando && ct.actions.Baixo.down) {
this.tex = 'Down_Shoot'
    }
     else if (ct.actions.Atirar.down && this.timerTiro < 16 && arma != 2 || ct.actions.Skill.pressed && mana != 0 || ct.actions.Atirar.down && arma == 7 || ct.actions.Atirar.down && arma == 2 && this.atirando) {
        this.tex = 'Shoot'
        } else if (!this.atirando) {
        this.tex = 'Idle'
    }
} else if (ct.actions.Atirar.down && this.timerTiro < 16 && arma != 2 || ct.actions.Skill.pressed && mana != 0 || ct.actions.Atirar.down && arma == 7 || ct.actions.Atirar.down && arma == 2 && this.atirando) {
    this.tex = 'J_Shoot'
} else  {
    this.tex = 'Jump'
}
} else {
    this.tex = 'Idle'
}



if (this.colidiu && !ct.place.occupied(this,'Solid')) {
    this.tex = 'Dmg'
    // this.tint = 0x7d1b22
    // this.hspeed = -7.5
    this.x -= 5
    // this.y -= 5
} else {
    // this.tint = 0xFFFFFF
    // this.animationSpeed = 8/60
}

// if (this.colidiu) {
//     this.pisca = true
// } else {
//     this.pisca = false
// }

// if (this.pisca) {
//     this.pisca1 = true
// }

// if (this.pisca1) {
//     this.tint = 0x7d1b22
//     this.pisca2 = true
// }

// if (this.pisca2) {
//     this.tint = 0xFFFFFF
//     this.pisca1 = true
// }

    },
    onDestroy: function () {
        


    },
    onCreate: function () {
        //Ao Criar
this.animationSpeed = 8 / 60;
this.tex = 'Idle';
this.play();
this.combo = 0
this.timerDano = 31
this.reloadRajada = 40
this.timerMorte = 0
this.velocidade = 8;    
direcao = 1
parototal = true
this.buffatkspeed = 1
passiva = 4
      //Cria uma variável de velocidade neste objeto
//ct.camera.follow = this; 
camera = true 

 ct.camera.borderX = 60;
 ct.camera.borderY = -90


    //Faz a câmera do jogo seguir este objeto
this.gravity = 0.755;           //Ajusta a gravidade para o valor 0.5 - experimente com outros valores!
 
this.timerTiro = 1000000;
this.timerMelee = 60;
this.distanciaCenoura = 1;

this.dir = 1;
this.dirAnterior = 1;
// this.arma = 1
this.tavoltando = 0
this.controlavel = true;
controlavel = true
this.vida = 4
this.mana = 3
this.chancemana = 0
buffdano = 1
ct.room.vida = this.vida
this.reloadTexto = 60
this.foi1 = false
this.foi2 = false
this.foi3 = false
this.vairajada = false;
this.atirando = false;
this.rajada = 0;
this.rajadareset = 0;
this.add = 48
this.addy = 0
this.speedy = 0
    },
    extends: {
    "cgroup": "Hero",
    "alpha": 1
}
};
ct.templates.list['Hero'] = [];
ct.templates.templates["Bar_Blue"] = {
    depth: 4,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "chao4",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['Bar_Blue'] = [];
ct.templates.templates["Tiro1"] = {
    depth: 8,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0",
    onStep: function () {
        this.move()
this.angle += ct.delta * 5

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

if (this.vspeed != 0 && this.hspeed != 0) {
    this.kill = true
} else {
this.visible = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}







    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
// if (ct.actions.Dir.value != 0 && ct.actions.Cima.value != 0){
//     this.hspeed = 5
//     this.vspeed = -5
// }

// if (ct.actions.Esq.value != 0 && ct.actions.Cima.value != 0){
//     this.hspeed = -5
//     this.vspeed = -5
// }

// if (ct.actions.Esq.value != 0 && ct.actions.Baixo.value != 0){
//     this.hspeed = -5
//     this.vspeed = 5
// }

// if (ct.actions.Dir.value != 0 && ct.actions.Baixo.value != 0){
//     this.hspeed = 5
//     this.vspeed = 5
// }

 this.timerMorte = 30
    },
    extends: {
    "cgroup": "TIRO",
    "visible": false
}
};
ct.templates.list['Tiro1'] = [];
ct.templates.templates["untitled(1)"] = {
    depth: 27,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "untitled(1)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['untitled(1)'] = [];
ct.templates.templates["INIMIGO"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Chick_Avatar_Rounded",
    onStep: function () {
        if (ct.place.occupied(this,this.x,this.y,'TIRO')) {
this.kill = true
}

if (ct.place.occupied(this,this.x,this.y,'TIRO2')) {
this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        //this.ctype = 'Inimigo'

    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['INIMIGO'] = [];
ct.templates.templates["cachorro"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "DOG",
    onStep: function () {
        // this.moveContinuousByAxes("Solid");
dogexiste = true
this.move();
this.hspeed = this.velocidade * this.direcao * this.buffspeed
this.text.text = this.vida

this.text.x = 0
this.text.y = -20;
this.text.scale.x = 1
// console.log(this.text.scale.x)

this.addChild(this.text);

var chao = ct.place.occupied(this,this.x,this.y+1,"Solid");   //Verifica se há uma colisão no "pé" do objeto, com o grupo  "solidos"
//
if (chao) {             //Se a colisão acontecer, ajustar a velocidade vertical para 0 - é necessário para evitar problemas
    this.vspeed = 0;
    // this.noar = 0
    //this.gotoAndStop(0)
} 






this.play();

if (ct.place.occupied(this,'paredog') && this.cd == 0) {
   
    this.direcao = this.direcao * -1
     this.scale.x = this.scale.x * -1 
     this.x += 120 * this.direcao * -1
    this.cd = 55
}






var dist;
var player;

// player = ct.templates.list['Hero'][0]

// dist = ct.u.pointDistance(this.x,this.y,player.x,player.y)

// if (dist < 100) {
//     this.velocidade = 6
// }

if (this.cd > 0) {
    this.cd-- ;
}


//colisão

if (ct.place.occupied(this,this.x,this.y,"TIRO")){
    // this.vida -= 5
    ct.emitters.fire('test', this.x, this.y)
    ct.sound.spawn (ct.random.dice('test','Tomo tiro1'))
    this.tomou += 1
    this.tomou2 = true
    // this.addChild(this.text);
}

if (this.AnimationTimer > 0) {
    this.AnimationTimer --;
    this.reload = 0
}



//Tiro comum
if (ct.place.meet(this,this.x,this.y,'Tiro1')) {
    this.vida -= 5 * buffdano
}
//rajada
if (ct.place.meet(this,this.x,this.y,'Tiro2')) {
    this.vida -= 5 * buffdano

}//fogo
if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
    this.vida -= 3 * buffdano 
    this.efeito = 'fogo'
}
//teleguiado
if (ct.place.meet(this,this.x,this.y,'Tiro4')) {
    this.vida -= 2 * buffdano
}

//gelo
if (ct.place.meet(this,this.x,this.y,'Tiro5')) {
    this.vida -= 2 * buffdano
    this.efeito = 'slow'
	this.slow += 1	
	this.timerslow = 0
}



if (this.efeito === 'slow' && this.slow == 1 && !this.congelou) {
    // this.tint = 0xdefcf7
	this.buffatkspeed = 0.9
	this.buffspeed = 0.9
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 2 && !this.congelou) {
    // this.tint = 0x97f7ea
	this.buffatkspeed = 0.8
	this.buffspeed = 0.8
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 3 && !this.congelou) {
    // this.tint = 0x5fc4d4
	this.buffatkspeed = 0.7
	this.buffspeed = 0.7
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 4 && !this.congelou) {
    // this.tint = 0x498abf
	this.buffatkspeed = 0.6
	this.buffspeed = 0.6
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 5 && !this.congelou) {
    // this.tint = 0x353f94
	this.buffatkspeed = 0.5
	this.buffspeed = 0.5
	this.timerslow += ct.delta
}

if (this.slow > 5) {
    this.congelou = true
    this.slow = 5
}

if (this.congelou && !this.naopodecongelar) {
    this.buffatkspeed = 0
    this.buffspeed = 0
    this.timerDescongelar += ct.delta
}

if (this.timerDescongelar >= 180) {
    this.slow = 0
    this.efeito = 'nada'
    this.timerDescongelar = 0
    this.naopodecongelar = true
}

if (this.naopodecongelar) {
    this.timernaopodecongelar = 600
}




if (this.timernaopodecongelar > 0) {
    this.timernaopodecongelar -= 1
    this.slow = 0
    this.efeito = 'nada'

} else {
    this.naopodecongelar = false
}

if (this.timerslow >= 18) {
this.slow - 1
this.timerslow = 0 
}

if (this.slow == 0) {
// this.tint = 0xFFFFF
this.efeito = 'nada'
this.buffatkspeed = 1
this.buffspeed = 1
}
//penetraçao
if (ct.place.meet(this,this.x,this.y,'Tiro6')) {
  this.vida -= 7 * buffdano
}
//recarga
if (ct.place.meet(this,this.x,this.y,'Tiro7')) {
  this.vida -= 3 * this.recarga * buffdano
}
//metralhadora
if (ct.place.meet(this,this.x,this.y,'Tiro8')) {
  this.vida -= 1 * buffdano
}
//tiro de 12
if (ct.place.meet(this,this.x,this.y,'Tiro9')) {
  this.vida -= 2 * buffdano
}


if (ct.place.meet(this,this.x,this.y,'Skill1')) {
    this.vida -= 20
}

//bumerangue


//tem que botar no oncreate this.vaitomadps = 0


if (this.efeito == 'fogo' && this.timer >= 60) {
   this.vida = this.vida - 1
   this.flamejou += 1
   this.timer = 0 
}

if (this.flamejou >= 3) {
    this.efeito = 'nada'
}

this.timer += ct.delta

if (this.vida <= 0){
    this.kill = true
}



    },
    onDraw: function () {
        // if (this.efeito === 'slow' && this.slow == 1) {
//     this.tint = 0xdefcf7
// }

// if (this.efeito === 'slow' && this.slow == 2) {
//     this.tint = 0x97f7ea
// }

// if (this.efeito === 'slow' && this.slow == 3) {
//     this.tint = 0x5fc4d4
// }

// if (this.efeito === 'slow' && this.slow == 4) {
//     this.tint = 0x498abf
// }

// if (this.efeito === 'slow' && this.slow == 5) {
//     this.tint = 0x353f94
// }

// if (this.efeito === 'nada') {
//     this.tint = 0xFFFFFF
// }
    },
    onDestroy: function () {
        dogexiste = false
    },
    onCreate: function () {
        this.vida = 20
this.direcao = -1
this.scale.x = -1
this.velocidade = 2.5
this.cd = 0
this.animationSpeed = 5/60
this.y = this.y + 50
// this.gravity = 3
this.efeito = 'nada'
this.text = new PIXI.Text(this.vida, ct.styles.get('teste'));
this.nvaitomamaisbum = false
this.vaitomadps = 0
this.slow = 0
this.timerslow = 0
this.timerDescongelar = 0
this.timernaopodecongelar = 0
this.buffspeed = 1
this.buffatkspeed = 1
    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['cachorro'] = [];
ct.templates.templates["Pig_Avatar"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Pig_Avatar",
    onStep: function () {
        this.move();
if (ct.place.occupied(this,this.x,this.y,'TIRO')) {
    this.vida -= 1

}
//if(this.vida = this.morte) {
   // this.kill
//}
if (this.vida <= 0) {
 this.kill = true
 console.log ('123')
}

if (ct.place.occupied(this,this.x,this.y,'TIRO2')) {
    this.vida -= 1

}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.vida = 20
this.morte = 0
    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['Pig_Avatar'] = [];
ct.templates.templates["Skill2"] = {
    depth: 4,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "UI_CircledFrame",
    onStep: function () {
        this.moveContinuousByAxes ("Solid")
this.play

if (ct.place.occupied (this,this.x,this.y,'Inimigo')) {
    //ct.templates.copy("Goo_02",this.x,this.y)
    ct.sound.spawn('exp')
    //this.kill = true
}

if (ct.place.occupied (this,this.x,this.y+1,'Solid')) {
    //ct.templates.copy("Goo_02",this.x,this.y)
    //this.kill = true
    this.vspeed = 0
    //this.hspeed = 5
    //this.angle++
} 

this.hspeed = this.hspeed * 1.013
if (this.hspeed >= 25) {
    this.hspeed = 25
}

// if (ct.actions.Skill.down) {
//     ct.camera.follow = this
// }

    this.angle += ct.delta * 5 * this.hspeed / this.hspeedInicial 

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.hspeedInicial = 5
this.hspeed = 5 * this.direcao
this.gravity = 0.5
this.animationSpeed = 10/60

if (this.hspeed == 0) {
    mana += 1
    this.kill = true
}
    },
    extends: {
    "cgroup": "TIRO2"
}
};
ct.templates.list['Skill2'] = [];
ct.templates.templates["Goo_02"] = {
    depth: 15,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "tomateexplodindo",
    onStep: function () {
        this.move();

this.moveContinuousByAxes("Solid");       //Move o objeto, com colisão com o grupo "Solid"

this.morte += 0.15;
    if (this.morte>5) {
        this.kill
    }



//this.morte + 1
//if (this.morte <= 200) {
//    this.kill = true
//}
//console.log (this.morte)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.morte = 1
    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['Goo_02'] = [];
ct.templates.templates["Golem"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Golem",
    onStep: function () {
        this.moveContinuousByAxes ("Solid")
this.play();
golemexiste = true
ct.room.camera = false
//this.scale.x = -1 pra virar ele


if (ct.place.occupied(this,this.x,this.y+1,'Solid')) {
    this.vspeed = 0
}

this.animationSpeed = 5/60 * this.buffatkspeed


this.reload += ct.delta * this.buffatkspeed

if (this.reload >= 130) {
    ct.templates.copy("FOGO",this.x-32,this.y-12// {
    //     hspeed: -5,
    //     vspeed: 0,
    //     gravity: 0 
    // }
    );
    this.reload = 40
}
//if (this.reload = )

//  if (ct.place.occupied(this,this.x,this.y,'TIRO')) {
//     var vida = vida - dano
// }

if (ct.place.occupied(this,this.x,this.y,"TIRO")){
    // this.vida -= 5
    // ct.emitters.fire('test', this.x, this.y)
    ct.sound.spawn (ct.random.dice('test','Tomo tiro1'))
    this.tomou += 1
    this.tomou2 = true
    this.addChild(this.text);
}

if (this.AnimationTimer > 0) {
    this.AnimationTimer --;
    this.reload = 0
}

if (this.tomou >= 8) {
    this.tex = 'Golem_Dmg'
    this.AnimationTimer = 80
    this.tomou = 0
}

//Tiro comum
if (ct.place.meet(this,this.x,this.y,'Tiro1')) {
    this.vida -= 5 * buffdano
}
//rajada
if (ct.place.meet(this,this.x,this.y,'Tiro2')) {
    this.vida -= 5 * buffdano

}//fogo
if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
    this.vida -= 3 * buffdano 
    this.efeito = 'fogo'
}
//teleguiado
if (ct.place.meet(this,this.x,this.y,'Tiro4')) {
    this.vida -= 2 * buffdano
}

//gelo
if (ct.place.meet(this,this.x,this.y,'Tiro5')) {
    this.vida -= 2 * buffdano
    this.efeito = 'slow'
	this.slow += 1	
	this.timerslow = 0
}
//12
if (ct.place.meet(this,this.x,this.y,'Tiro8')) {
    this.vida -= 4 * buffdano	
}



if (this.efeito === 'slow' && this.slow == 1 && !this.congelou) {
    this.tint = 0xdefcf7
	this.buffatkspeed = 0.9
	this.buffspeed = 0.9
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 2 && !this.congelou) {
    this.tint = 0x97f7ea
	this.buffatkspeed = 0.8
	this.buffspeed = 0.8
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 3 && !this.congelou) {
    this.tint = 0x5fc4d4
	this.buffatkspeed = 0.7
	this.buffspeed = 0.7
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 4 && !this.congelou) {
    this.tint = 0x498abf
	this.buffatkspeed = 0.6
	this.buffspeed = 0.6
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 5 && !this.congelou) {
    this.tint = 0x353f94
	this.buffatkspeed = 0.5
	this.buffspeed = 0.5
	this.timerslow += ct.delta
}

if (this.slow > 5) {
    this.congelou = true
    this.slow = 5
}

if (this.congelou && !this.naopodecongelar) {
    this.buffatkspeed = 0
    this.buffspeed = 0
    this.timerDescongelar += ct.delta
}

if (this.timerDescongelar >= 180) {
    this.slow = 0
    this.efeito = 'nada'
    this.timerDescongelar = 0
    this.naopodecongelar = true
}

if (this.naopodecongelar) {
    this.timernaopodecongelar = 600
}




if (this.timernaopodecongelar > 0) {
    this.timernaopodecongelar -= 1
    this.slow = 0
    this.efeito = 'nada'

} else {
    this.naopodecongelar = false
}

if (this.timerslow >= 18) {
this.slow - 1
this.timerslow = 0 
}

if (this.slow == 0) {
this.tint = 0xFFFFF
this.efeito = 'nada'
this.buffatkspeed = 1
this.buffspeed = 1
}
//penetraçao
if (ct.place.meet(this,this.x,this.y,'Tiro6') && this.timerpen == 0) {
  this.vida -= 7 * buffdano
  this.timerpen = 45
}

if (this.timerpen > 0) {
    this.timerpen--;
}
//recarga
// if (ct.place.meet(this,this.x,this.y,'Tiro7')) {
//   this.vida -= 3 * this.recarga * buffdano
// }
//metralhadora
if (ct.place.meet(this,this.x,this.y,'Tiro7')) {
  this.vida -= 2 * buffdano
}
//tiro de 12
if (ct.place.meet(this,this.x,this.y,'Tiro9')) {
  this.vida -= 2 * buffdano
}


if (ct.place.meet(this,this.x,this.y,'Skill1')) {
    this.vida -= 20
}

//bumerangue


//tem que botar no oncreate this.vaitomadps = 0


if (this.efeito == 'fogo' && this.timer >= 60) {
   this.vida = this.vida - 1
   this.flamejou += 1
   this.timer = 0 
}

if (this.flamejou >= 3) {
    this.efeito = 'nada'
}

this.timer += ct.delta

if (this.vida <= 0){
    this.kill = true
}



if (this.tex == 'Golem_Dmg') {
if (this.AnimationTimer == 0) {
    //this.tint =  0xa63400
    this.reload = 100
    this.tex = 'Golem'   

}
this.tomou = 0

}

var alvo = ct.templates.list['Hero'][0];

if (this.x < alvo.x) {
    this.scale.x = -1
} else {
    this.scale.x = 1
}

if (ct.place.meet(this,'Crystal') && this.paro != true) {
    this.vida -= 2
    this.TimerAnimation -= 1.5
    this.paro = true
    //ct.sound.spawn('espada')
} else this.paro = false


this.text.text = this.vida

this.text.x = 0
this.text.y = -180;

this.addChild(this.text);

ct.room.camera = false

if (this.tomou2) {
    this.timertomou += ct.delta
}

if (this.timertomou >= 18) {
    this.tomou2 = false
    this.timertomou = 0

}

if (ct.place.meet(this,this.x,this.y,'Tiro10')) {
	if (!this.tomoubumerangue && !bumeranguevoltando) {
	this.vida -= 10 * buffdano
	this.tomoubumerangue = true
}  else if (bumeranguevoltando && !this.nvaitomamaisbum) {
    this.nvaitomamaisbum = true
	this.vida -= 10 * buffdano
	// this.nvaitomamaisbum = true
}
}


//o segundo tiro ta dando multiplo dano

if (this.nvaitomamaisbum) {
this.vaitomadps += ct.delta
}

if (this.vaitomadps > 65) {
this.nvaitomamaisbum = false
this.vaitomadps = 0
this.tomoubumerangue = false
}

if (ct.place.meet(this,'FOGO') && viraofogo) {
    this.vida -= 3
}





    },
    onDraw: function () {
        if (this.tex == 'Golem_Dmg') {
this.tint = 0x2d3432
}

if (this.tex !== 'Golem_Dmg') {
    if (this.tomou2) {
        this.tint = 0x614b07
        console.log('aaa')
    } else
this.tint = 0xFFFFFF
}

if (this.efeito === 'slow' && this.slow == 1) {
    this.tint = 0xdefcf7
}

if (this.efeito === 'slow' && this.slow == 2) {
    this.tint = 0x97f7ea
}

if (this.efeito === 'slow' && this.slow == 3) {
    this.tint = 0x5fc4d4
}

if (this.efeito === 'slow' && this.slow == 4) {
    this.tint = 0x498abf
}

if (this.efeito === 'slow' && this.slow == 5) {
    this.tint = 0x353f94
}
    },
    onDestroy: function () {
        golemexiste = false
// var alvo1 = ct.templates.list['Hero'][0];
// ct.camera.follow = alvo1
// //ct.camera.borderX = null;
// //ct.camera.borderY = 0
// ct.camera.drift = 0
// ct.room.camera = true
    },
    onCreate: function () {
        this.animationSpeed = 5/60
this.reload = 80
//hudvisivel = true
this.tint = 0xf0753d
this.tomou2 = false
this.paro = false
this.timertomou = 0
this.vida = 80
this.timerpen = 0

this.timer = 1
this.flamejou = 0 
this.efeito = 'nada'
this.tomou = 0
this.vaitomadps = 0 

this.buffatkspeed = 1
this.buffspeed = 1
// this.text = new PIXI.Text(this.vida, ct.styles.get('teste'));

// this.addChild(this.text);

// this.text.x = 0
// this.text.y = -180;



this.AnimationTimer = 0

this.text = new PIXI.Text(this.vida, ct.styles.get('teste'));
this.nvaitomamaisbum = false
this.vaitomadps = 0
this.slow = 0
this.timerslow = 0
this.timerDescongelar = 0
this.timernaopodecongelar = 0


// ct.sound.volume('Tomo Tiro1',0.6)
// ct.sound.volume('test',0.6)

    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['Golem'] = [];
ct.templates.templates["FOGO"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "fogo_animado_(1)",
    onStep: function () {
        this.move();
this.play

// if (ct.place.occupied (this,this.x,this.y, "Solid")) {
//     this.kill = true
// }

if (ct.place.occupied (this,this.x,this.y, "Hero")) {
    this.kill = true
}

this.morte++

if (this.morte > 300) {
    this.kill = true
}
var alvo = ct.templates.list['Hero'][0];
if (viraofogo && ct.place.meet(this,'Crystal') && passiva == 4 && !this.virou) {
    // this.direction = ct.u.pointDirection(this.x,this.y,alvo.x * -1,alvo.y)
    this.hspeed = this.hspeed * -1
    this.virou = true
}

if (ct.place.meet (this,"Golem") && viraofogo) {
     viraofogo = false
    this.kill = true
}

if (this.morte > 60 && this.jadesativou) {
    viraofogo = false
    this.jadesativou = true
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 5/60
this.morte = 0
var alvo = ct.templates.list['Hero'][0];
this.speed = 8.3
this.direction = ct.u.pointDirection(this.x,this.y,alvo.x, alvo.y+ct.random.range(-60,60))
this.virou = false

//ct.templates.copy('Ilum',this.x,this.y)
    },
    extends: {
    "cgroup": "FOGO"
}
};
ct.templates.list['FOGO'] = [];
ct.templates.templates["Mouse_Left"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Mouse_Right",
    onStep: function () {
        

if (ct.place.occupied(this,this.x,this.y,'test2')) {
    this.dir = 1
    this.tex = 'Mouse_Right'
}

this.moveContinuousByAxes("Solid");       //Move o objeto, com colisão com o grupo "Solid"

var chao = ct.place.occupied(this,this.x,this.y+1,"Solid");   //Verifica se há uma colisão no "pé" do objeto, com o grupo  "solidos"

if (chao) {             //Se a colisão acontecer, ajustar a velocidade vertical para 0 - é necessário para evitar problemas
    this.vspeed = 0;
}


this.text = new PIXI.Text('Sou só decoração :c', ct.styles.get('teste'));
this.text.x = this.x
this.text.y = this.y - 64;

this.addChild(this.text);

    },
    onDraw: function () {
        this.text2 = new PIXI.Text('aaaaaaa', ct.styles.get('teste'));
this.text2.x = 0;
this.text2.y = -64;

this.addChild(this.text2);
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.dir = 1

    },
    extends: {
    "visible": true
}
};
ct.templates.list['Mouse_Left'] = [];
ct.templates.templates["Beetroot"] = {
    depth: 1000,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Morcego_Idle",
    onStep: function () {
        this.move();
morcegoexiste = true
this.play();
var alvo = ct.templates.list['Hero'][0];
var dist = (ct.u.pointDistance(this.x,this.y,alvo.x,alvo.y))



if (dist <= 800 && alvo.x + 450 >= this.x) {
    this.tex = 'Morcego'
this.speed = ct.random.dice(5,6,7,8,9,10)
this.direction = ct.u.pointDirection(this.x,this.y,alvo.x, alvo.y)

// if (ct.place.occupied (this,this.x,this.y,'Hero')) {
// this.kill = true
} else if (ct.place.occupied(this,'Solid')) {
    this.tex = 'Morcego_Idle'
    this.speed = 0
} else {
    this.vspeed = -5
}

if (ct.place.occupied (this,this.x,this.y,'TIRO')) {
this.kill = true
}


if (ct.place.occupied (this,this.x,this.y,'TIRO2')) {
this.kill = true
}


if (ct.place.occupied (this,this.x,this.y,'TIRO3')) {
this.kill = true
}

if (ct.place.occupied (this,this.x,this.y,'Hero')) {
this.kill = true
}

if (ct.place.occupied (this,this.x,this.y,'Espada')) {
this.kill = true
}

if (ct.place.meet(this,this.x,this.y,'Tiro4')) {
    this.vida -= 4
    this.efeito = 'fogo'
}

if (ct.place.meet(this,this.x,this.y,'Tiro5')) {
    this.vida -= 2
    this.efeito = 'slow'
}

if (ct.place.meet(this,this.x,this.y,'Tiro6')) {
  this.vida -= 7
}

if (ct.place.meet(this,this.x,this.y,'Tiro7')) {
  this.vida -= 1 * buffdano
}

if (ct.place.meet(this,this.x,this.y,'Tiro8')) {
  this.vida -= 1
}

if (ct.place.meet(this,this.x,this.y,'Tiro9')) {
  this.vida -= 2
}


if (this.timerMorte >= 75) {
    this.kill = true
    this.timerMorte = 0
}

// if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
// this.kill = true
// }

// var sla = 2

// console.log (sla)

if (ct.templates.isCopy('Golem')) {
    this.tex = 'Morcego'
this.speed = ct.random.dice(5,6,7,8,9,10)
this.direction = ct.u.pointDirection(this.x,this.y,alvo.x, alvo.y)
} 

if (this.vida <= 0) {
    this.kill = true
}

// if (ct.place.occupied (this,this.x,this.y,'Hero')) {
// this.kill = true
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        morcegoexiste = false
    },
    onCreate: function () {
        //  this.addSpeed(4,ct.types.'Hero')  
//  this.direction = ct.templates.copy   

this.animationSpeed = 8/60
this.vida = 2

    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['Beetroot'] = [];
ct.templates.templates["chao3"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "chao3",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['chao3'] = [];
ct.templates.templates["Tiro3"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Pixilart_Sprite_Sheet",
    onStep: function () {
        this.move();
this.play();
this.angle += ct.delta * 7

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

if (this.vspeed != 0 && this.hspeed != 0) {
    this.kill = true
} else {
this.visible = true
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 8/60
    },
    extends: {
    "cgroup": "TIRO3",
    "visible": false
}
};
ct.templates.list['Tiro3'] = [];
ct.templates.templates["FOGO2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "fogo_animado_(1)",
    onStep: function () {
        this.move();
this.play();

// if (ct.place.occupied (this,this.x,this.y, "Solid")) {
//     this.kill = true
// }

if (ct.place.occupied (this,this.x,this.y, "Hero")) {
    this.kill = true
}

// if (ct.place.occupied (this,this.x,this.y, "Projetil")) {
//     this.kill = true
// }


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 5/60
this.gravity = 0.55
this.vspeed = -20

    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['FOGO2'] = [];
ct.templates.templates["HUD_vida_mana"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "HUD_vida_mana",
    onStep: function () {
        this.move();


if (hudvisivel) {

this.visible = true
} else this.visible = false
//console.log(ct.room.vida)

this.x == ct.camera.height - 750
this.y == ct.camera.width - 300

if (vida == 4 && mana == 3) {
    this.tex = '4_vida_3_mana'
}

if (vida == 4 && mana == 2) {
    this.tex = '4_vida_2_mana'
}

if (vida == 4 && mana == 1) {
    this.tex = '4_vida_1_mana'
}

if (vida == 4 && mana <= 0) {
    this.tex = '4_vida_0_mana'
}

if (vida == 3 && mana == 3) {
    this.tex = '3_vida_3_mana'
}

if (vida == 2 && mana == 3) {
    this.tex = '2_vida_3_mana'
}

if (vida == 1  && mana == 3) {
    this.tex = '1_vida_3__mana'
}

if (vida <= 0  && mana == 3) {
    this.tex = '0_vida_3_mana'
}
 
if (vida == 3  && mana == 2) {
    this.tex = '3_vida_2_mana'
}

if (vida == 2  && mana == 2) {
    this.tex = '2_vida_2_mana'
}
 
if (vida == 1  && mana == 2) {
    this.tex = '1_vida_2_mana'
}

if (vida <= 0  && mana == 2) {
    this.tex = '0_vida_2_mana'
}

if (vida == 3  && mana == 1) {
    this.tex = '3_vida_1_mana'
}

if (vida == 2  && mana == 1) {
    this.tex = '2_vida_1_mana'
}

if (vida == 1  && mana == 1) {
    this.tex = '1_vida_1_mana'
}

if (vida <= 0  && mana == 1) {
    this.tex = '0_vida_1_mana'
}

if (vida == 3  && mana <= 0) {
    this.tex = '3_vida_0_mana'
}

if (vida == 2  && mana <= 0) {
    this.tex = '2_vida_0_mana'
}

if (vida == 1  && mana <= 0) {
    this.tex = '1_vida_0_mana'
}

if (vida <= 0  && mana <= 0) {
    this.tex = '0_vida_0_mana'
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        //ct.camera.follow = this
    },
    extends: {
    "visible": true
}
};
ct.templates.list['HUD_vida_mana'] = [];
ct.templates.templates["Crystal"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Crystal",
    onStep: function () {
        this.move();
this.play();
// this.dir = ct.room.dirEspada
this.dir = direcao
// console.log(this.dir)

// if (ct.actions.Dir.pressed){
//     this.tex = 'Crystal'
//     this.dir = 1
// }

// if (ct.actions.Esq.pressed){
//     this.tex = 'Crystal2'
//     this.dir = -1
// }

if (passiva == 4) {
    if (ct.place.meet(this,'FOGO')) {
    let fogo = ct.templates.list['FOGO'][0]
    viraofogo = true
    console.log('aaa')
    }
}

if (this.dir < 0) {
    this.tex = 'Crystal2'
    this.visible = true
}

if (this.dir >= 0) {
    this.tex = 'Crystal'
    this.visible = true
}

var alvo = ct.templates.list['Hero'][0];
this.x = alvo.x + 72 * this.dir
this.y = alvo.y



// if (ct.place.occupied(this,this.x,this.y,'Hero')) {
//    while (this.counter > 0 && this.reload >= 18) {
//     ct.templates.copy('Beetroot', this.x + 600, this.y+ ct.random.range(-450,800));
//     this.counter --;
//     this.reload = 0
// }
// }

this.reload += ct.delta

// if (this.angle <= 145) {
//     this.angle += ct.delta * 6.5
// } else {
//     this.angle = -95
// }

if (this.currentFrame == 0) {
    this.angle = -45 * this.dir
}

if (this.currentFrame == 1) {
    this.angle = -30 * this.dir
}

if (this.currentFrame == 2) {
    this.angle = -15 * this.dir
}

if (this.currentFrame == 3) {
    this.angle = 0 * this.dir
}

if (this.currentFrame == 4) {
    this.angle = 15 * this.dir
}

if (this.currentFrame == 5) {
    this.angle = 30 * this.dir
}

if (this.currentFrame == 6) {
    this.angle = 45 * this.dir
}

if (this.currentFrame == 7) {
    this.angle = 60 * this.dir
    this.kill = true
}

if (this.currentFrame == 8) {
    this.angle = 75 * this.dir
    this.kill = true
}

if (this.currentFrame == 9) {
    this.angle = 90 * this.dir
    this.kill = true
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.counter = 40; // We need to create 20 Copies
this.reload = 1

this.angle = -95

this.animationSpeed = 21/60

this.dir = 1

// ct.sound.spawn('espada')

// if (ct.actions.Esq.down){
//     this.tex = 'Crystal2'
//     this.dir = -1
// }
    },
    extends: {
    "visible": false,
    "cgroup": "Espada",
    "alpha": 0.5
}
};
ct.templates.list['Crystal'] = [];
ct.templates.templates["texto"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();

this.vspeed = -3.5

this.addChild(this.text)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Mana Insuficiente!', ct.styles.get('teste2')); 

this.text.x = 0;
this.text.y = -64
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto'] = [];
ct.templates.templates["cabecinha"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "cabecinha",
    onStep: function () {
        this.move();
var alvo = ct.templates.list['Hero'][0];

if (!this.kill && !this.spawn) { 
    var dist = (ct.u.pointDistance(this.x,this.y,alvo.x,alvo.y))
}

if (dist <= 400 && !this.spawn) {
    ct.room.control = false;
    this.play()
    ct.camera.shake += 0.5;
    this.spawn = true
    ct.u.wait(300)
.then(() => {
    ct.camera.shake = 0;
    this.kill = true
ct.templates.copy('Golem2',this.x,this.y+32)
});
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 3/60
this.spawn = false


    },
    extends: {}
};
ct.templates.list['cabecinha'] = [];
ct.templates.templates["Golem2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "golem2",
    onStep: function () {
        this.move();
this.play()

//ct.room.camera = false


if (this.currentFrame == 8 && this.criou == false) {
    this.criou = true
    this.kill = true
    ct.templates.copy('Golem',this.x,this.y-96, {
    vspeed: -5,
    gravity: 1
})
}

// if (this.currentFrame == 5){ 
//     ct.sound.spawn('TERRA')
// } 
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 5/60
ct.sound.volume('TERRA',0.2)
ct.sound.spawn('TERRA')
this.criou = false

var alvo1 = ct.templates.list['Hero'][0];
//ct.camera.drift = 0.95
//ct.camera.moveTo(this.x-96,alvo1.y -176)
ct.camera.borderX = null;


    },
    extends: {}
};
ct.templates.list['Golem2'] = [];
ct.templates.templates["Cloud_02"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Cloud_02",
    onStep: function () {
        this.move();

if (ct.actions.start.pressed) {
ct.rooms.switch('Andar 1')
}

// if (ct.actions.Atirar.pressed) {
// ct.rooms.switch('Andar 1')
// }
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.texto = new PIXI.Text('Aperta Enter para entrar',ct.styles.get('teste'));
this.texto.x = -200;
this.texto.y = -100;


console.log(this.texto.x && this.texto.y)
this.addChild(this.texto);
    },
    extends: {
    "visible": true
}
};
ct.templates.list['Cloud_02'] = [];
ct.templates.templates["ParedeInv"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Pig_Avatar_Rounded",
    onStep: function () {
        this.move();


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid",
    "visible": false
}
};
ct.templates.list['ParedeInv'] = [];
ct.templates.templates["texto2"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();

this.vspeed = -3.5

this.addChild(this.text)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Não posso sair!', ct.styles.get('teste2')); 

this.text.x = 0;
this.text.y = -64
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto2'] = [];
ct.templates.templates["ParedeInv2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Pig_Avatar_Rounded",
    onStep: function () {
        this.move();


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid",
    "visible": false
}
};
ct.templates.list['ParedeInv2'] = [];
ct.templates.templates["Porta_Inferno"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        this.move();

if (ct.place.meet(this,this.x,this.y,'Hero')) {
    if (ct.actions.start.pressed) {
        ct.rooms.switch('InfernoPedroso')
    }
    this.addChild(this.text)
} else {
    this.removeChild(this.text)
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Inferno', ct.styles.get('teste3'));
this.text.x = -70
this.text.y = -150;
    },
    extends: {}
};
ct.templates.list['Porta_Inferno'] = [];
ct.templates.templates["cabecinha2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "cabecinha",
    onStep: function () {
        this.move();
var alvo = ct.templates.list['Hero'][0];

if (!this.kill) { 
    var dist = (ct.u.pointDistance(this.x,this.y,alvo.x,alvo.y))
}

if (dist <= 375) {
    ct.room.control = false;
    this.play()
    ct.camera.shake += 0.5;
    ct.u.wait(300)
.then(() => {
    ct.camera.shake = 0;
    this.kill = true
ct.templates.copy('Golem2',this.x,this.y+32)
});
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 3/60
this.scale.x = -1


    },
    extends: {}
};
ct.templates.list['cabecinha2'] = [];
ct.templates.templates["Golem22"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "golem2",
    onStep: function () {
        this.move();
this.play()
ct.sound.spawn('TERRA')


if (this.currentFrame == 8) {
    this.kill = true
    ct.templates.copy('Golem',851,549, {
    vspeed: -5,
    gravity: 1
})
}

// if (this.currentFrame == 5){
//     ct.sound.spawn('TERRA')
// } 
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 5/60
ct.sound.volume('TERRA',0.2)
    },
    extends: {}
};
ct.templates.list['Golem22'] = [];
ct.templates.templates["Vida"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "New_Piskel-1_(9)",
    onStep: function () {
        this.move();

var alvo = ct.templates.list['golem_animado_pronto_(1)'][0]

this.x = (alvo.x)
this.y = (alvo.y - 64)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Vida'] = [];
ct.templates.templates["Porta_Morcegos"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        this.move();

if (ct.place.meet(this,this.x,this.y,'Hero')) {
    if (ct.actions.start.pressed) {
        ct.rooms.switch('CavernasDosMorcegos')
    }
    this.addChild(this.text)
} else {
    this.removeChild(this.text)
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Cavernas dos morcegos', ct.styles.get('teste3'));
this.text.x = -142
this.text.y = -150;
    },
    extends: {}
};
ct.templates.list['Porta_Morcegos'] = [];
ct.templates.templates["plataformapequena2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "plataformapequena2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['plataformapequena2'] = [];
ct.templates.templates["cabecinha_INV"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "cabecinha",
    onStep: function () {
        this.move();
var alvo = ct.templates.list['Hero'][0];

if (!this.kill && !this.spawn) { 
    var dist = (ct.u.pointDistance(this.x,this.y,alvo.x,alvo.y))
}

if (dist <= 400 && !this.spawn) {
    ct.room.control = false;
    this.play()
    ct.camera.shake += 0.5;
    this.spawn = true
    ct.u.wait(300)
.then(() => {
    ct.camera.shake = 0;
    this.kill = true
ct.templates.copy('Golem2',this.x,this.y+32)
});
}





    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 3/60
this.spawn = false


    },
    extends: {
    "visible": false
}
};
ct.templates.list['cabecinha_INV'] = [];
ct.templates.templates["MainMenu"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "MainMenu",
    onStep: function () {
        this.move();
 console.log (this.pos)

if (ct.actions.Baixo.pressed && this.pos != 3) {
 this.pos += 1

}

if (ct.actions.Cima.pressed && this.pos != 1) {
 this.pos -= 1
}

if (this.pos == 1) {
 if(ct.actions.start.pressed) {
ct.rooms.switch('Início')
 }
    this.tex = 'MainMenu'
}

if (this.pos == 2) {
    this.tex = 'MainMenu2'
}

if (this.pos == 3) {
    this.tex = 'MainMenu3'
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.pos = 1
    },
    extends: {}
};
ct.templates.list['MainMenu'] = [];
ct.templates.templates["Porta_Fim"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        // this.move();

// if (ct.place.meet(this,this.x,this.y,'Hero')) {
//     if (ct.actions.start.pressed) {
//         ct.rooms.switch('InfernoPedroso')
//     }
//     this.addChild(this.text)
// } else {
//     this.removeChild(this.text)
// }

// if (this.x == 916) {
//    this.pos = 1
//    this.text = new PIXI.Text('Básico', ct.styles.get('teste3'));
// } else if (this.x == 1163) {
//     this.pos = 2
//     this.text = new PIXI.Text('Habilidades', ct.styles.get('teste3'));
// } else if (this.x == 1429) {
//     this.pos = 3
//     this.text = new PIXI.Text('Itens e passiva', ct.styles.get('teste3'));
// } else if (this.x == 1661) {
//     this.pos = 4
//     this.text = new PIXI.Text('Avançado', ct.styles.get('teste3'));
// }





    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
// this.text.x = -142
// this.text.y = -150;
    },
    extends: {}
};
ct.templates.list['Porta_Fim'] = [];
ct.templates.templates["Tiro2"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rajada",
    onStep: function () {
        this.move();
this.tempo += ct.delta


if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
this.visible = true
}

if (this.vspeed != 0 && this.hspeed != 0) {
    this.kill = true
} else {
this.visible = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}





    },
    onDraw: function () {
        // if (ct.actions.Atirar.pressed && this.arma == 3 && this.timerTiro >= 36) {
//    if (this.scale.x == 1) {
//     ct.templates.copy("Tiro2",this.x + this.add + 48,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0
//     })
//   ct.templates.copy("Tiro2",this.x + this.add + 0,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0
//     })

//     ct.templates.copy("Tiro2",this.x + this.add - 48,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0
//     })
//      this.timerTiro = 0
//    } else if (this.scale.x == -1) {
//          ct.templates.copy("Tiro2",this.x + this.add + 48,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0,
//         angle:180
//     })
//   ct.templates.copy("Tiro2",this.x + this.add + 0,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0,
//         angle:180
//     })

//     ct.templates.copy("Tiro2",this.x + this.add - 48,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0,
//         angle:180
//     })  
//     this.timerTiro = 0
// }
// }

// if (ct.actions.Atirar.pressed && this.arma == 3 && this.timerTiro >= 36 && !this.vairajada) {
//     this.vairajada = true
// }

// if (this.vairajada) {
//     if (this.rajadareset >= 3) {
//     this.rajada += ct.delta
// } else {
//     this.vairajada = false
//     this.timerTiro = 0
// }
// }
// if (this.rajada >= 20) {
//      if (this.scale.x == 1) {
//     ct.templates.copy("Tiro2",this.x + this.add + 32,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0
//     })
// }  else if (this.scale.x == -1) {
//          ct.templates.copy("Tiro2",this.x + this.add + 32,this.y+this.addy, {
//         hspeed:6 * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0,
//         angle:180
//     })
// }
//     this.rajada = 0
//     this.rajadareset += 1
// }
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        if (ct.actions.Cima.down && this.hspeed == 0) {
    this.angle = -90
}

if (ct.actions.Baixo.down && this.hspeed == 0) {
    this.angle = 90
}
this.vai = 0
// if (ct.actions.Dir.pressed){
//     this.tex = 'Rajada'
//     //this.dir = 1
// }

// if (ct.actions.Esq.pressed){
//     this.tex = 'Rajada2'
//     //this.dir = -1
// }

// this.virou = false
// this.tempo = 0
this.timerMorte = 30
    },
    extends: {
    "visible": false
}
};
ct.templates.list['Tiro2'] = [];
ct.templates.templates["BossPTP"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "New_Piskel-1",
    onStep: function () {
        
this.moveContinuousByAxes('Solid')
// console.log (this.dir)
// console.log(this.stunado)

this.text.text = this.vida

this.text.x = 0
this.text.y = -180;

this.addChild(this.text);

var alvo = ct.templates.list['Hero'][0];    

//Tiro comum
if (ct.place.meet(this,this.x,this.y,'Tiro1')) {
    this.vida -= 5 * buffdano
}
//rajada
if (ct.place.meet(this,this.x,this.y,'Tiro2')) {
    this.vida -= 5 * buffdano

}//fogo
if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
    this.vida -= 3 * buffdano 
    this.efeito = 'fogo'
}
//teleguiado
if (ct.place.meet(this,this.x,this.y,'Tiro4')) {
    this.vida -= 2 * buffdano
}

//gelo
if (ct.place.meet(this,this.x,this.y,'Tiro5')) {
    this.vida -= 2 * buffdano
    this.efeito = 'slow'
	this.slow += 1	
	this.timerslow = 0
}
//12
if (ct.place.meet(this,this.x,this.y,'Tiro8')) {
    this.vida -= 4 * buffdano	
}


if (this.vida <= 600 && this.vida >= 400) {
 this.puto = 10
}

if (this.vida <= 400 && this.vida >= 200) {
 this.puto = 20
}

if (this.vida <= 200) {
 this.puto = 30
}



// padrao 1,corrida e batida na parede
//padrao 2,porradao no chão
//padrao 3, puxar

if (this.padrao == 0 && !this.stun) {
this.timer += ct.delta
this.stunado = 0
this.aceleracao = 0
}

if (this.timer >= 150 - this.puto) {
     if (this.x >= alvo.x) {
    this.dir = -1
    //console.log('bbbbb')
    } else if (this.x <= alvo.x) {
    this.dir = 1
        //console.log('aaaaaa')
    }    

this.padrao = ct.random.dice(1,2)
this.velocidade2 = ct.random.dice(3.5,4,5.5) + this.aceleracao
this.timer = 0
}

//_________________________________________________________________________
//padrao 1 ptp

if (this.padrao == 1) {
this.aceleracao += ct.delta 
this.hspeed = this.dir * this.velocidade2// + this.aceleracao
}

if (this.aceleracao >= 7 + this.puto / 10) {
    this.aceleracao = 7 + this.puto / 10
}

if (this.padrao == 1 && ct.place.meet(this,this.x-1,this.y,'ParedeInv')) {
        console.log('aaa')
    this.stun = true
} else if (this.padrao != 1 && ct.place.meet(this,this.x-1,this.y,'ParedeInv2')) {
    this.stun = false
}

if (this.padrao == 1 && ct.place.meet(this,this.x+1,this.y,'ParedeInv2')) {
        console.log('aaa')
    this.stun = true
} else if (this.padrao != 1 && ct.place.meet(this,this.x+1,this.y,'ParedeInv')) {
    this.stun = false
}

if (this.stun) {
this.tint = 0x455b55
this.stunado += ct.delta + ct.random.dice(0,0.5,1)
} else {
    this.tint = 0xFFFFFF
}

if (this.stunado >= 143 - this.puto / 2) {
//this.tint = 0xFFFFFF
this.stun = false
this.padrao = 0
}

//________________________________________________________________________
//padrao 2

if (this.padrao == 2) {
    this.tint = 0x990f02 
    //ct.camera.shake 
    ct.templates.copy('treco',this.x - 30,this.y)
     ct.templates.copy('treco2',this.x + 30,this.y)
     this.padrao = 0
}



    },
    onDraw: function () {
        

// if (ct.place.meet(this,this.x,this.y,'ParedeInv') || ct.place.meet(this,this.x,this.y,'ParedeInv2')) {
// this.tint = 0x455b55
// } else {
//     this.tint = 0xFFFFFF
// }

// // if (ct.place.meet(this,this.x,this.y,'ParedeInv2')) {
// // this.tint = 0x455b55
// // }
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.padrao = 0
this.timer = 0
this.velocidade = 3
this.aceleracao = 3
this.vida = 800
this.dir = -1
this.stun = false
this.stunado = 135
this.puto = 0

this.text = new PIXI.Text(this.vida, ct.styles.get('teste'));

    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['BossPTP'] = [];
ct.templates.templates["Mola"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "mola-frame",
    onStep: function () {
        this.move();

this.timer += ct.delta
var alvo = ct.templates.list['Hero'][0];

if (this.timer >= 90 && alvo.x <= 1600 && this.random1 != this.random2){
    ct.templates.copy('FOGO2',this.random1,720)
    ct.templates.copy('FOGO2',this.random2,720)
   this.timer = 0
}

if (this.timer >= 90 && alvo.x >= 1600 && this.random3 != this.random4){
    ct.templates.copy('FOGO2',this.random3,720)
    ct.templates.copy('FOGO2',this.random4,720)
   this.timer = 0
}




this.random1 = ct.random.dice(350,700,1235,1500) 
this.random2 = ct.random.dice(350,700,1235,1500)
this.random3 = ct.random.dice(2670,2900,3200,3468,3680,4050,4225,4400,4830,5200)
this.random4 = ct.random.dice(2670,2900,3200,3468,3680,4050,4225,4400,4830,5200)

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.timer = 0
    },
    extends: {
    "cgroup": ""
}
};
ct.templates.list['Mola'] = [];
ct.templates.templates["treco"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: true,
    texture: "treco",
    onStep: function () {
        this.move();
if (this.currentFrame == 8) {
    this.gotoAndStop(8)
}

if (this.currentFrame >= 5) {
    this.hspeed = -6
}

this.hspeed -= 0.08
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 23/60


    },
    extends: {
    "cgroup": "Projetil"
}
};
ct.templates.list['treco'] = [];
ct.templates.templates["treco2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: true,
    texture: "treco",
    onStep: function () {
        this.move();
this.scale.x = -1


if (this.currentFrame == 8) {
   this.gotoAndStop(8)
}

if (this.currentFrame >= 5) {
    this.hspeed = 6
}

this.hspeed += 0.08
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 23/60
this.play();
this.scale.x = -1
    },
    extends: {
    "cgroup": "Projetil"
}
};
ct.templates.list['treco2'] = [];
ct.templates.templates["LAVA"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "New_Piskel_(13)",
    onStep: function () {
        this.move();
this.play();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 9/60;
    },
    extends: {}
};
ct.templates.list['LAVA'] = [];
ct.templates.templates["chao maior"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "chao maior",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['chao maior'] = [];
ct.templates.templates["Caixa_de_texto"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Caixa_de_texto",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Caixa_de_texto'] = [];
ct.templates.templates["jogar_novamente"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "jogar_novamente",
    onStep: function () {
        this.move();

if (ct.room.pos == 1){
    this.tex = 'jogar_novamente2'
} else {
    this.tex = 'jogar_novamente'
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['jogar_novamente'] = [];
ct.templates.templates["Voltar"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Voltar",
    onStep: function () {
        this.move();

if (ct.room.pos == 2){
    this.tex = 'Voltar2'
} else {
    this.tex = 'Voltar'
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Voltar'] = [];
ct.templates.templates["Porta_Tutorial1"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        // this.move();
if (!tutorial) {
if (ct.place.meet(this,this.x,this.y,'Hero')) {
    if (ct.actions.start.pressed) {
        ct.rooms.switch('Tutorial')
    }
    this.addChild(this.text)
} else {
    this.removeChild(this.text)
}
} else {
    if (ct.place.meet(this,this.x,this.y,'Hero')) {
    this.addChild(this.text) 
    } else {
        this.removeChild(this.text)
    }
 this.text = new PIXI.Text('Trancado', ct.styles.get('teste3'));   
 this.text.x = -40
 this.text.y = -150
}



// if (this.x == 916) {
//    this.pos = 1
//    this.text = new PIXI.Text('Básico', ct.styles.get('teste3'));
// } else if (this.x == 1163) {
//     this.pos = 2
//     this.text = new PIXI.Text('Habilidades', ct.styles.get('teste3'));
// } else if (this.x == 1429) {
//     this.pos = 3
//     this.text = new PIXI.Text('Itens e passiva', ct.styles.get('teste3'));
// } else if (this.x == 1661) {
//     this.pos = 4
//     this.text = new PIXI.Text('Avançado', ct.styles.get('teste3'));
// }





    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Tutorial', ct.styles.get('teste3'));
this.text.x = -60
this.text.y = -150

this.pos = 0
    },
    extends: {}
};
ct.templates.list['Porta_Tutorial1'] = [];
ct.templates.templates["Porta_Sair"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        this.move();

if (ct.place.meet(this,this.x,this.y,'Hero')) {
    if (ct.actions.start.pressed) {
        ct.rooms.switch('Andar 1')
    }
    this.addChild(this.text)
} else {
    this.removeChild(this.text)
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Sair', ct.styles.get('teste3'));
this.text.x = -70
this.text.y = -150;
    },
    extends: {}
};
ct.templates.list['Porta_Sair'] = [];
ct.templates.templates["Corvo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Corvo",
    onStep: function () {
        this.move();
tafazendotuto = true

var alvo = ct.templates.list['Hero'][0];
var dist = (ct.u.pointDistance(this.x,this.y,alvo.x,alvo.y))


 //console.log(alvo.vida)

if (debug1) {
    this.parte = 0
    debug1 = false
}
// this.fala10 = new PIXI.Text('Está vendo aquele Golem?',ct.styles.get('falacorvo'))
// this.fala10.x = this.x
// this.fala10.y = this.y - 32

if (this.y > 480) {
    this.vspeed = 0
}


if (this.parte < 7) {
    parototal = false

}

if (this.parte > 7) {
    parototal = true
}

if (!tutorial) {




// var texto8 = ct.templates.list['texto_está'][0]
// var texto9 = ct.templates.list['texto_dorm'][0]
// var texto10 = ct.templates.list['texto_aprov'][0]

// if (alvo.y <= 700) {
//     alvo.y = 100
// }

if (dist <= 250 && this.parte == 0 && !ct.room.ultimo) {
    //this.addChild(this.fala1)
    this.speed = 0
    this.parte = 1
    this.timer = 0
 
} 

//console.log('dist' + dist)

if (dist >= 250 && this.parte < 1 && !ct.room.ultimo) {
    this.speed = 6
this.direction = ct.u.pointDirection(this.x,this.y,alvo.x,alvo.y)
   //console.log('AAAAAAAAAAAAAAAAAAA')
}

if (this.parte == 1) {
if (this.y <= 480) {    
    this.vspeed = 3.5
} else {
    this.vspeed = 0
}
    //this.removeChild(this.fala1)
    this.addChild(this.fala1)
    
}

if (this.parte == 2) {
    this.removeChild(this.fala1)
    this.fala1.x = -200000000
    this.addChild(this.fala2)
}

if (this.parte == 3) {
 this.removeChild(this.fala2)
 this.fala2.x = -2053454354
    this.addChild(this.fala3)
}

if (this.parte == 4) {
 this.removeChild(this.fala3)
 this.fala3.x = -2053454354
    this.addChild(this.fala4)
    ct.room.apareceu = true
}

if (this.parte == 5 && !this.paro) {
    //ct.room.apareceu = true
ct.templates.copy('teclado_tuto',0,0)
this.paro = true
}

if (this.parte == 6) {
    this.fala4.x = -2053454354
    this.addChild(this.fala5)
}

if (this.parte == 7) {
     this.fala5.x = -2053454354
     this.addChild(this.fala6)
    // this.vspeed = -10
    // this.hspeed = -10
}
// this.scale.x = alvo.scale.x * -1

if (this.parte > 7 && !ct.room.ultimo) {
    if (dist >= 100) {
        if (this.x > alvo.x - 35) {
    this.hspeed = -3 * dist / 72
    } else if (this.x < alvo.x - 35) {
    this.hspeed = 3 * dist / 72
     this.scale.x = -1
    }

    } else {
        this.scale.x = -1
     
        this.hspeed = 0
    }
    this.fala6.x = -321331233
}

//if (this.parte)

if (this.timer >= 25 && ct.actions.Qualquer.pressed && this.parte != 5) {
    this.parte += 1
    this.timer = 0
}

if (this.parte == 5 && !ct.room.apareceu) {

    this.parte = 6
}

if (this.timer >= 140) {
    this.parte += 1
    this.timer = 0
}

if (this.parte != 5) {
    this.timer += ct.delta
}

if (alvo.x >= 1180 && this.parte2 < 1) {
    this.etapa2 = true
}

if (this.etapa2) {
    if (this.parte2 < 1) {
    ct.templates.copy('texto_está',this.x,this.y-64)
    this.parte2 = 1 
    //fccccccccccthis.addChild(this.fala10)
}
this.timer2 += ct.delta
parototal = false
}

if (this.timer2 >= 25 && ct.actions.Qualquer.pressed && this.etapa2) {
    this.parte2 += 1
    this.timer2 = 0
}



if (this.timer2 >= 180) {
    this.parte2 += 1
    this.timer2 = 0
}

if (this.parte2 == 2 && !this.crioutextonexxx) {
     ct.room.deleta1 = true
     ct.templates.copy('texto_dorm',this.x-176,this.y-64)
     this.crioutextonexxx = true
  
}

if (this.parte2 == 3  && !this.crioutextonexxx2) {
    ct.room.deleta2 = true
     ct.templates.copy('texto_aprov',this.x-32,this.y-32)
     this.crioutextonexxx2 = true
}

if (this.parte2 == 4) {
    ct.room.deleta3 = true
    parototal = true
    this.etapa2 = false
}

if (ct.room.morreu && !ct.room.deletar4) {
    this.etapa3 = true
    parototal = false
}

if (this.etapa3) {
    if (!this.crioutexto382) {
    ct.templates.copy('texto_muito',this.x-176,this.y-64)
    
    this.crioutexto382 = true
    
}
    this.timer3 += ct.delta
}
if (this.etapa3) {
if (this.timer3 >= 90 || ct.actions.Qualquer.pressed) {
    parototal = true
    ct.room.deletar4 = true
}
}

if (alvo.x >= 3200) {
    this.etapa4 = true
}

if (this.etapa4 && this.parte4 <= 2) {
    parototal = false
    this.timer4 += ct.delta
}

if (this.etapa4 && this.parte4 == 1 && !this.mostrouja) {
    ct.templates.copy('texto_pulo',this.x-176,this.y-64)
    this.mostrouja = true
}



if (this.etapa4 && this.parte4 == 2 && !this.mostrouja2) {
    ct.templates.copy('texto_pular',this.x-176,this.y-64)
    ct.room.deletar2 = true
    this.mostrouja2 = true
}

if (this.etapa4 && this.parte4 > 2) {
    parototal = true
    ct.room.deletalogo = true
}

if (this.etapa4 && ct.actions.Qualquer.pressed && this.timer4 >= 15) {
    this.parte4 += 1
    this.timer4 = 0
}

if (alvo.x >= 4230) {
    this.etapa5 = true
}

if (this.etapa5 && ct.actions.start.pressed && this.timer5 >= 15) {
    this.parte5 += 1
    this.timer5 = 0
}

if (this.etapa5) {
parototal = false
 this.timer5 += ct.delta
}

if (this.etapa5 && this.parte5 == 1 && !this.mostrouja3) {
     ct.templates.copy('texto_muito2',this.x-176,this.y-64)
    this.mostrouja3 = true
}

if (this.parte5 == 2 && !this.mostrouja4) {
    //console.log('aaaaa')
     ct.templates.copy('texto_ultima',this.x-176,this.y-64)
    this.mostrouja4 = true
    ct.room.deletaisso = true
}



//console.log(this.parte5)

if (this.parte5 == 3 && !ct.room.ultimo) {
    camera = false
    ct.templates.copy('camera',alvo.x,alvo.y)
}

if (ct.room.ultimo) {
    parototal = true
    this.scale.x = 1
    this.hspeed = -5
     this.vspeed = -5
     tafazendotuto = false
     //hudvisivel = true
}
}
//falta ajustar texto(colocar pra seguir o corvo),colocar pra voltar a HUD no final 
//e ajustar os times.
//a porta ta levando pro mapa errado porra
//checkpoint
//corvo ta indo pra baixo ainda ein
//

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        tafazendotuto = false
    },
    onCreate: function () {
        this.play()
this.x = 980;
this.y = 36;
this.animationSpeed = 14/60;
this.chegou = false;
this.parte = 0;
this.parte2 = 0;
this.etapa2 = false;
this.timer2 = 0;
this.etapa4 = false;
this.parte4 = 1;
this.timer4 = 0;
this.parte5 = 1;
this.timer5 = 0;
this.mostrouja = false;
this.mostrouja2 = false;
this.mostrouja3 = false;
this.mostrouja4 = false;
    hudvisivel = true;

var alvo = ct.templates.list['Hero'][0];
var dist = (ct.u.pointDistance(this.x,this.y,alvo.x,alvo.y))

this.fala1 = new PIXI.Text('Ei!', ct.styles.get('falacorvo'))

this.fala2 = new PIXI.Text('Você parece ser novo no castelo!', ct.styles.get('falacorvo'))

this.fala3 = new PIXI.Text('Vou te dar algumas dicas para sobreviver aqui.', ct.styles.get('falacorvo'))

this.fala4 = new PIXI.Text('Primeiramente,você deve ser familiarizar com os controles.', ct.styles.get('falacorvo'))

this.fala5 = new PIXI.Text('Ali na frente tem alguns testes para você usar suas técnicas em prática.', ct.styles.get('falacorvo'))

this.fala6 = new PIXI.Text('Vamos lá!Estou do seu lado.', ct.styles.get('falacorvo'))
this.fala1.x = -20
this.fala1.y = - 70
this.fala2.x = -200
this.fala2.y = - 70
this.fala3.x = -200
this.fala3.y = - 70
this.fala4.x = -200
this.fala4.y = - 70
this.fala5.x = -200
this.fala5.y = -70
this.fala6.x = -200
this.fala6.y = -70



    },
    extends: {}
};
ct.templates.list['Corvo'] = [];
ct.templates.templates["Poção"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Poção",
    onStep: function () {
        this.move();

if (hudvisivel) {
this.visible = true
} else this.visible = false

this.npocao.text = pocao + 'x'
this.nelixir.text = elixir + 'x'



this.npocao.x = -116
this.nelixir.x = 8

//so ajustar as posiçoes e fazer um texto menor que fica de criaaaaaa felas projetinho
// uiuiui amaral boa noite

this.addChild(this.npocao)
this.addChild(this.nelixir)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        pocao = 3
elixir = 3

this.npocao = new PIXI.Text(pocao + 'x',ct.styles.get('falacorvo'))
this.nelixir = new PIXI.Text(elixir + 'x',ct.styles.get('falacorvo'))
    },
    extends: {
    "alpha": 1
}
};
ct.templates.list['Poção'] = [];
ct.templates.templates["Skill1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "rasengan",
    onStep: function () {
        this.move();


this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

// if (this.vspeed == 0 && this.hspeed == 0) {
//     this.kill = true
// } else { 
//     this.visible = true
// }

// if (this.vspeed != 0 && this.hspeed != 0) {
//     this.kill = true
//     } else {
// this.visible = true
// }
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.play();
this.animationSpeed = 16/60
if (ct.actions.Cima.down && this.hspeed == 0) {
    this.angle = -90
}

if (ct.actions.Baixo.down && this.hspeed == 0) {
    this.angle = 90
}

this.timerMorte = 0

if (this.hspeed == 0) {
    mana += 1
    this.kill = true
}
    },
    extends: {
    "visible": true
}
};
ct.templates.list['Skill1'] = [];
ct.templates.templates["teclado_tuto"] = {
    depth: 7,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "teclado_tuto",
    onStep: function () {
        this.move();
this.apareceu += ct.delta

if (ct.actions.Esc.pressed) {
    hudvisivel = true
    ct.room.apareceu = false
    this.kill = true
    this.visible = false
}

//console.log(ct.room.apareceu)
// console.log(this.apareceu)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.apareceu = 0
hudvisivel = false

    },
    extends: {}
};
ct.templates.list['teclado_tuto'] = [];
ct.templates.templates["Golem_Sleep"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "golem_animado_mimindoÃ°Â_Â_Â¤_(1)",
    onStep: function () {
        this.moveContinuousByAxes ("Solid")
this.play();
ct.room.camera = false
//this.scale.x = -1 pra virar ele


if (ct.place.occupied(this,this.x,this.y+1,'Solid')) {
    this.vspeed = 0
}


//console.log (this.AnimationTimer)


this.reload += ct.delta
//console.log (this.reload)

// if (this.reload >= 130) {
//     ct.templates.copy("FOGO",this.x-32,this.y-12// {
//     //     hspeed: -5,
//     //     vspeed: 0,
//     //     gravity: 0 
//     // }
//     );
//     this.reload = 40
// }
//if (this.reload = )



if (ct.place.occupied(this,this.x,this.y,"TIRO")){
    // this.vida -= 5
    // ct.emitters.fire('test', this.x, this.y)
    ct.sound.spawn (ct.random.dice('test','Tomo tiro1'))
    this.tomou += 1
    this.tomou2 = true
    this.addChild(this.text);
}

if (this.AnimationTimer > 0) {
    this.AnimationTimer --;
    this.reload = 0
}

if (this.tomou >= 8) {
    // this.tex = 'Golem_Dmg'
    this.AnimationTimer = 80
    this.tomou = 0
}

//Tiro comum
if (ct.place.meet(this,this.x,this.y,'Tiro1')) {
    this.vida -= 5 * buffdano
}
//rajada
if (ct.place.meet(this,this.x,this.y,'Tiro2')) {
    this.vida -= 5 * buffdano

}//fogo
if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
    this.vida -= 3 * buffdano 
    this.efeito = 'fogo'
}
//teleguiado
if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
    this.vida -= 2 * buffdano
}

//gelo
if (ct.place.meet(this,this.x,this.y,'Tiro5')) {
    this.vida -= 2 * buffdano
    this.efeito = 'slow'
	this.slow += 1	
	this.timerslow = 0
}

console.log('slow' + '=' + this.slow)

if (this.efeito === 'slow' && this.slow == 1 && !this.congelou) {
    this.tint = 0xdefcf7
	this.buffatkspeed = 0.9
	this.buffspeed = 0.9
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 2 && !this.congelou) {
    this.tint = 0x97f7ea
	this.buffatkspeed = 0.8
	this.buffspeed = 0.8
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 3 && !this.congelou) {
    this.tint = 0x5fc4d4
	this.buffatkspeed = 0.7
	this.buffspeed = 0.7
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 4 && !this.congelou) {
    this.tint = 0x498abf
	this.buffatkspeed = 0.6
	this.buffspeed = 0.6
	this.timerslow += ct.delta
}

if (this.efeito === 'slow' && this.slow == 5 && !this.congelou) {
    this.tint = 0x353f94
	this.buffatkspeed = 0.5
	this.buffspeed = 0.5
	this.timerslow += ct.delta
}

if (this.slow > 5) {
    this.congelou = true
    this.slow = 5
}

if (this.congelou && !this.naopodecongelar) {
    this.buffatkspeed = 0
    this.buffspeed = 0
    this.timerDescongelar += ct.delta
}

if (this.timerDescongelar >= 180) {
    this.slow = 0
    this.efeito = 'nada'
    this.timerDescongelar = 0
    this.naopodecongelar = true
}

if (this.naopodecongelar) {
    this.timernaopodecongelar = 600
}




if (this.timernaopodecongelar > 0) {
    this.timernaopodecongelar -= 1
    this.slow = 0
    this.efeito = 'nada'

} else {
    this.naopodecongelar = false
}

if (this.timerslow >= 18) {
this.slow - 1
this.timerslow = 0 
}

if (this.slow == 0) {
this.tint = 0xFFFFF
this.efeito = 'nada'
this.buffatkspeed = 1
this.buffspeed = 1
}
//penetraçao
if (ct.place.meet(this,this.x,this.y,'Tiro6')) {
  this.vida -= 7 * buffdano
}
//recarga
if (ct.place.meet(this,this.x,this.y,'Tiro7')) {
  this.vida -= 3 * this.recarga * buffdano
}
//metralhadora
if (ct.place.meet(this,this.x,this.y,'Tiro8')) {
  this.vida -= 1 * buffdano
}
//tiro de 12
if (ct.place.meet(this,this.x,this.y,'Tiro9')) {
  this.vida -= 2 * buffdano
}


if (ct.place.meet(this,this.x,this.y,'Skill1')) {
    this.vida -= 20
}

//bumerangue


//tem que botar no oncreate this.vaitomadps = 0


if (this.efeito == 'fogo' && this.timer >= 60) {
   this.vida = this.vida - 1
   this.flamejou += 1
   this.timer = 0 
}

if (this.flamejou >= 3) {
    this.efeito = 'nada'
}

this.timer += ct.delta

if (this.vida <= 0){
    this.kill = true
}


var alvo = ct.templates.list['Hero'][0];

if (this.x < alvo.x) {
    this.scale.x = -1
} else {
    this.scale.x = 1
}

if (ct.place.meet(this,'Crystal') && this.paro != true) {
    this.vida -= 2
    this.TimerAnimation -= 1.5
    this.paro = true
    //ct.sound.spawn('espada')
} else this.paro = false


this.text.text = this.vida

this.text.x = 0
this.text.y = -180;

this.addChild(this.text);

ct.room.camera = false

if (this.tomou2) {
    this.timertomou += ct.delta
}

if (this.timertomou >= 18) {
    this.tomou2 = false
    this.timertomou = 0

}

if (ct.place.meet(this,this.x,this.y,'Tiro10')) {
	if (!this.tomoubumerangue && !bumeranguevoltando) {
	this.vida -= 10 * buffdano
	this.tomoubumerangue = true
}  else if (bumeranguevoltando && !this.nvaitomamaisbum) {
    this.nvaitomamaisbum = true
	this.vida -= 10 * buffdano
	// this.nvaitomamaisbum = true
}
}

console.log('a'+ this.nvaitomamaisbum)
//o segundo tiro ta dando multiplo dano

if (this.nvaitomamaisbum) {
this.vaitomadps += ct.delta
}

if (this.vaitomadps > 65) {
this.nvaitomamaisbum = false
this.vaitomadps = 0
this.tomoubumerangue = false
}







// if (this.AnimationTimer > 0) {
//     this.AnimationTimer --;
//     this.reload = 0
// }

// if (this.tomou >= 8) {
//     //this.tex = 'Golem_Dmg'
//     this.AnimationTimer = 80
//     this.tomou = 0
// }

if (ct.place.meet(this,this.x,this.y,'Tiro2')) {
    this.vida -= 5
    this.tomou += 1
}

if (ct.place.occupied(this,this.x,this.y,"TIRO2")){
    this.vida = this.vida - 12
}

if (ct.place.occupied(this,this.x,this.y,"TIRO3")){
    this.vida = this.vida - 2
    this.efeito = 'fogo'
    this.flamejou = 0
//ct.templates.copy("FOGO2",this.x-24,this.y-118)
}

if (this.efeito == 'fogo' && this.timer >= 60) {
   this.vida = this.vida - 1
   this.flamejou += 1
   this.timer = 0 
}

if (this.flamejou >= 3) {
    this.efeito = 'nada'
}

this.timer += ct.delta

if (this.vida <= 0){
    ct.room.morreu = true
    this.kill = true
}

// console.log (this.vida)
// console.log (this.efeito)

// if (this.tex == 'Golem_Dmg') {
// if (this.AnimationTimer == 0) {
//     //this.tint =  0xa63400
//     this.reload = 100
//     this.tex = 'Golem'   

// }
// this.tomou = 0

// }

var alvo = ct.templates.list['Hero'][0];

// if (this.x < alvo.x) {
//     this.scale.x = -1
// } else {
//     this.scale.x = 1
// }

if (ct.place.meet(this,'Crystal') && this.paro != true) {
    this.vida -= 2
    this.TimerAnimation -= 1.5
    this.paro = true
    //ct.sound.spawn('espada')
} else this.paro = false


this.text.text = this.vida

this.text.x = 0
this.text.y = -180;

//this.addChild(this.text);

ct.room.camera = false



    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 2/60
this.reload = 80

//this.tint = 0xf0753d

this.paro = false

this.vida = 80

this.timer = 1
this.flamejou = 0 
this.efeito = 'nada'
this.tomou = 0

// this.text = new PIXI.Text(this.vida, ct.styles.get('teste'));

// this.addChild(this.text);

// this.text.x = 0
// this.text.y = -180;



this.AnimationTimer = 0

this.text = new PIXI.Text(this.vida, ct.styles.get('teste'));




// ct.sound.volume('Tomo Tiro1',0.6)
// ct.sound.volume('test',0.6)

    },
    extends: {
    "cgroup": "Inimigo"
}
};
ct.templates.list['Golem_Sleep'] = [];
ct.templates.templates["texto_está"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();


//this.vspeed = -3.5
var corvo = ct.templates.list['Corvo'][0]

this.x = corvo.x - 128

this.text = new PIXI.Text('Está vendo aquele golem?',ct.styles.get('falacorvo'))

this.text.x = 0
this.text.y = 0


this.addChild(this.text)


if (ct.room.deleta1) {
    this.kill = true
    console.log ('aaa')
}

console.log('bbbb')

// if (corvo.x != this.text.x) {
//     this.addChild(this.text)
// }
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        



    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_está'] = [];
ct.templates.templates["texto_dorm"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();



this.addChild(this.text)

if (ct.room.deleta2) {
    this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Ele está dormindo!Um sono profundo!', ct.styles.get('falacorvo')); 

this.text.x = 0
this.text.y = 0
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_dorm'] = [];
ct.templates.templates["texto_aprov"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();


this.addChild(this.text)


if (ct.room.deleta3) {
    this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Aproveite!Atire nele!', ct.styles.get('falacorvo')); 

this.text.x = -80;
this.text.y = -32
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_aprov'] = [];
ct.templates.templates["texto_muito"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();



this.addChild(this.text)

if (ct.room.deletar4) {
    this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Muito Bem!Prossiga!', ct.styles.get('falacorvo')); 

this.text.x = 0
this.text.y = 0
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_muito'] = [];
ct.templates.templates["texto_pulo"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();




this.addChild(this.text)

if (ct.room.deletar2) {
    this.kill = true
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('As vezes você pode dar de cara com um buraco!', ct.styles.get('falacorvo')); 

this.text.x = 0
this.text.y = 0
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_pulo'] = [];
ct.templates.templates["texto_pular"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();




this.addChild(this.text)

if (ct.room.deletalogo) {
    this.kill = true
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Como você não voa,basta CORRER e PULAR!', ct.styles.get('falacorvo')); 

this.text.x = 0
this.text.y = 0
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_pular'] = [];
ct.templates.templates["texto_muito2"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();
var corvo = ct.templates.list['Corvo'][0]

this.x = corvo.x - 108

this.addChild(this.text)

if (ct.room.deletaisso) {
    this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Você é bom nisso!', ct.styles.get('falacorvo')); 

this.text.x = 0
this.text.y = 0
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_muito2'] = [];
ct.templates.templates["texto_ultima"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Carrot",
    onStep: function () {
        this.move();



this.addChild(this.text)

if (ct.room.deletoudecria) {
    this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.text = new PIXI.Text('Só mais um pouco e...', ct.styles.get('falacorvo')); 

this.text.x = 0
this.text.y = 0
    },
    extends: {
    "visible": true
}
};
ct.templates.list['texto_ultima'] = [];
ct.templates.templates["camera"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Bar_Blue",
    onStep: function () {
        this.move();
//camera do tutorial
if (!camera) {
    ct.camera.follow = this
}
if (this.x <= 4700) {
this.hspeed = 5
} else {
    // if (!this.criou) {
    // ct.templates.copy('Golem2',4665,635)
    // this.criou = true
    //}
    this.hspeed = 0
    this.timer += ct.delta
    this.cria = true
}

if (this.timer >= 60) {
    controlavel = true
    camera = true
    this.kill = true
    ct.room.ultimo = true
}

console.log(this.timer)

if (this.cria && this.criou > 5) {
ct.room.vai = true
}

if (this.timer >= 30) {
    ct.room.deletoudecria = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.criou = 8
this.timer = 0
    },
    extends: {
    "visible": false
}
};
ct.templates.list['camera'] = [];
ct.templates.templates["Golem2_tuto"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "golem2",
    onStep: function () {
        if (ct.room.vai) {

this.visible = true

this.move();
this.play()

if (this.currentFrame == 8 && this.criou == false) {
    this.criou = true
    this.kill = true
    ct.templates.copy('Golem',this.x,this.y-96, {
    vspeed: -5,
    gravity: 1
})
}

// if (this.currentFrame == 5){ 
//     ct.sound.spawn('TERRA')
// } 

}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.animationSpeed = 5/60

this.criou = false

var alvo1 = ct.templates.list['Hero'][0];
//ct.camera.drift = 0.95
//ct.camera.moveTo(this.x-96,alvo1.y -176)
//ct.camera.borderX = null;


    },
    extends: {
    "visible": false
}
};
ct.templates.list['Golem2_tuto'] = [];
ct.templates.templates["Porta_Sair_tuto"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        this.move();

if (ct.place.meet(this,this.x,this.y,'Hero')) {
    if (ct.actions.start.pressed) {
        tutorial = true
        ct.rooms.switch('Início')
    }
    this.addChild(this.text)
} else {
    this.removeChild(this.text)
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Sair', ct.styles.get('teste3'));
this.text.x = -32
this.text.y = -150;
    },
    extends: {}
};
ct.templates.list['Porta_Sair_tuto'] = [];
ct.templates.templates["caixa_de_aviso_sepa"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "caixa_de_aviso_sepa",
    onStep: function () {
        if (ct.actions.start.pressed) {
    this.kill = true
    this.visible = false
    controlavel = true
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        var alvo = ct.templates.list['Hero'][0]
alvo.x = 640
controlavel = false
    },
    extends: {}
};
ct.templates.list['caixa_de_aviso_sepa'] = [];
ct.templates.templates["caixa_de_escolha_test"] = {
    depth: 7,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "caixa_de_escolha_test",
    onStep: function () {
        this.move();

// if (ct.mouse.down) {
//  console.log ('dhjsak')
// }
if (ct.actions.Mouse1.pressed) {
    console.log (ct.mouse.x)
    console.log (ct.mouse.y)
    console.log ('a')
}

if (ct.mouse.x <= 640 && ct.mouse.x >= 339 && ct.mouse.y >= 360 && ct.mouse.y <= 446) {
 this.tex = 'caixa_de_escolha_testnao'
 this.red = true
 this.green = false
 //console.log('red')
} else if (!this.green) {
    this.tex = 'caixa_de_escolha_test'
    this.red = false
}


if (ct.mouse.x <= 1058 && ct.mouse.x >= 772 && ct.mouse.y >= 360 && ct.mouse.y <= 446) {
 this.tex = 'caixa_de_escolha_tests'
 this.green = true
 this.red = false
} else if (!this.red) {
    this.tex = 'caixa_de_escolha_test'
    this.green = false
}

if (this.green && ct.actions.Mouse1.pressed || ct.actions.start.pressed) {
    ct.rooms.switch('Andar 1')
    controlavel = true
}

if (this.red && ct.actions.Mouse1.pressed || ct.actions.Esc.pressed) {
    controlavel = true
    ct.room.mostro = false
    this.kill = true
    ct.room.delay = true
}

console.log(this.green)
console.log(this.red)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['caixa_de_escolha_test'] = [];
ct.templates.templates["SETA"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "SETA",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['SETA'] = [];
ct.templates.templates["Tiro10"] = {
    depth: 9,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Bumerangue test",
    onStep: function () {
        this.move();
this.angle += (ct.delta * 2.07 * this.hspeed) * this.treco
console.log(this.angle,this.treco)
var alvo = ct.templates.list['Hero'][0]

if (this.parte == 1) {
        this.vspeed += 0.008
    this.hspeed -= 0.14 * this.dir
}

console.log(this.dir)

if (this.x >= this.inicial + 650 && this.dir == 1) {
    this.parte = 2
    bumeranguevoltando = true
}

if (this.x <= this.inicial - 650 && this.dir == -1) {
    this.treco = -1
    this.parte = 2
    bumeranguevoltando = true
}

if (this.parte == 2) {

this.speed = 10 + ct.delta
this.direction = ct.u.pointDirection(this.x,this.y,alvo.x,alvo.y)
}

if (this.parte == 2 && ct.place.meet(this,'Hero')) {
    alvo.timerTiro = 100000
    bumeranguevoltando = false
    this.kill = true
    
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.parte = 1
if (direcao == 1) {
    this.dir = 1
} else if (direcao == -1) {
    this.dir = -1
}
this.inicial = this.x
this.inicialy = this.y

this.hspeed = 16 * direcao
this.vspeed = -7
this.gravity = 0.42
this.treco = 1
    },
    extends: {}
};
ct.templates.list['Tiro10'] = [];
ct.templates.templates["Tiro7"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Tomato",
    onStep: function () {
        this.move();
this.angle += 5
if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 75) {
    this.kill = true
    this.timerMorte = 0
}

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        

if (this.hspeed != 0){
     this.vspeed += ct.random.dice(1,2,1.5,0,-1,-2,-1.5)
}

if (this.vspeed != 0){
     this.hspeed += ct.random.dice(1,2,1.5,0,-1,-2,-1.5)
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

this.timerMorte = 30

    },
    extends: {
    "visible": false
}
};
ct.templates.list['Tiro7'] = [];
ct.templates.templates["MenuSkills"] = {
    depth: 20,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "menu_de_skills_pique_xenoverse",
    onStep: function () {
        this.move();
var alvo = ct.templates.list['Hero'][0]

// console.log(this.pos)

// if (ct.actions.Dir.pressed || ct.actions.Esq.pressed || ct.actions.Cima.pressed || ct.actions.Baixo.pressed) {
    
// }

if (ct.actions.Dir.released || ct.actions.Esq.released || ct.actions.Cima.released || ct.actions.Baixo.released) {
    this.aperto = false
}

if (ct.actions.Dir.pressed && this.pos != 5 && this.pos != 10 && !this.aperto) {
    this.pos += 1
    this.aperto = true
}

if (ct.actions.Esq.pressed && this.pos != 1 && this.pos != 6 && !this.aperto) {
    this.pos -= 1
    this.aperto = true
}

if (ct.actions.Cima.pressed && this.pos > 5 && !this.aperto) {
    this.pos -= 5
    this.aperto = true
}

if (ct.actions.Baixo.pressed && this.pos <= 5 && !this.aperto) {
    this.pos += 5
    this.aperto = true
}



if (ct.actions.Esc.pressed) {
    this.kill = true
    parototal = true
    menuskillaberto = false
}

if (this.pos == 1) {
xposmenuskill = ct.camera.x - 450
yposmenuskill = 186.5
}

if (this.pos == 2) {
xposmenuskill = ct.camera.x - 255
yposmenuskill = 186.5
}

if (this.pos == 3) {
xposmenuskill = ct.camera.x - 60
yposmenuskill = 186.5
}

if (this.pos == 4) {
xposmenuskill = ct.camera.x + 135
yposmenuskill = 186.5
}

if (this.pos == 5) {
xposmenuskill = ct.camera.x + 330
yposmenuskill = 186.5
}

if (this.pos == 6) {
xposmenuskill = ct.camera.x - 450 - 5 
yposmenuskill = 373
}

if (this.pos == 7) {
xposmenuskill = ct.camera.x - 255 - 5
yposmenuskill = 373
}

if (this.pos == 8) {
xposmenuskill = ct.camera.x - 60 - 5
yposmenuskill = 373
}

if (this.pos == 9) {
xposmenuskill = ct.camera.x + 135 - 5
yposmenuskill = 373
}

if (this.pos == 10) {
xposmenuskill = ct.camera.x + 330 - 5
yposmenuskill = 373
alvo.timerTiro = 100000
}

if (this.pos == 1 && ct.actions.start.pressed) {
    arma = 1
    this.kill = true
    parototal = true
    menuskillaberto = false
} 

if (this.pos == 2 && ct.actions.start.pressed) {
    arma = 2
    this.kill = true
    parototal = true
    menuskillaberto = false
} 

if (this.pos == 3 && ct.actions.start.pressed) {
    arma = 3
    this.kill = true
    parototal = true
    menuskillaberto = false
} 

if (this.pos == 4 && ct.actions.start.pressed) {
    arma = 4
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

if (this.pos == 5 && ct.actions.start.pressed) {
    arma = 5
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

if (this.pos == 6 && ct.actions.start.pressed) {
    arma = 6
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

if (this.pos == 7 && ct.actions.start.pressed) {
    arma = 7
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

if (this.pos == 8 && ct.actions.start.pressed) {
    arma = 8
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

if (this.pos == 9 && ct.actions.start.pressed) {
    arma = 9
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

if (this.pos == 10 && ct.actions.start.pressed) {
    arma = 10
    this.kill = true
        parototal = true
    menuskillaberto = false
} 

console.log("pos",this.pos)
console.log('x',xposmenuskill)
console.log('y' ,yposmenuskill)
console.log(parototal)


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.pos = arma
this.aperto = false
ct.templates.copy('selecionado',0,0)
    },
    extends: {}
};
ct.templates.list['MenuSkills'] = [];
ct.templates.templates["selecionado"] = {
    depth: 30,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "selecionado",
    onStep: function () {
        this.move();


if (this.x == xposmenuskill && this.y == yposmenuskill) {
    this.visible = true
}

this.x = xposmenuskill
this.y = yposmenuskill

// this.visible = true 

if (ct.actions.Esc.pressed || ct.actions.start.pressed) {
    this.kill = true
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        // this.play();
// this.animationSpeed = 10/60
yposmenuskill = 0
    },
    extends: {
    "visible": false
}
};
ct.templates.list['selecionado'] = [];
ct.templates.templates["Tiro4"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "tirin",
    onStep: function () {
        this.move();

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 275) {
    this.kill = true
    this.timerMorte = 0
}

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

if (golemexiste || dogexiste || morcegoexiste) {

if (golemexiste) {

var distgolem = ct.u.pointDistance(this.x,this.y,ct.templates.list['Golem'][0].x,ct.templates.list['Golem'][0].y) * 8.5
}

if (morcegoexiste) {
    var menordistancia = 9999999999999;
    var morcego;
    for (var i=0; i<ct.templates.list['Beetroot'].length;i++) {

        var distanciaatual = ct.u.pointDistance(this.x,this.y,ct.templates.list['Beetroot'][i].x,ct.templates.list['Beetroot'][i].y);
        if (distanciaatual<menordistancia) {
            menordistancia = distanciaatual;
            morcego = ct.templates.list['Beetroot'][i];
        }

    }

//var morcego = ct.templates.list['Beetroot'][0]
var distmorcego = ct.u.pointDistance(this.x,this.y,morcego.x,morcego.y) * 8.5
}

if (dogexiste) {
    var dog = ct.templates.list['cachorro'][0]
    var distdog = ct.u.pointDistance(this.x,this.y,dog.x,dog.y) * 8.5
}

if (distgolem != undefined) {

if (distmorcego < 2650 && distmorcego < distgolem && distmorcego < distdog) {
this.direction = ct.u.pointDirection(this.x,this.y,morcego.x, morcego.y)
this.speed = 7
}

if (distgolem < 2650 && distmorcego > distgolem && distgolem < distdog) {
    this.direction =  ct.u.pointDirection(this.x,this.y,ct.templates.list['Golem'][0].x, ct.templates.list['Golem'][0].y)
    this.speed = 7  
}

if (distdog < 2650 && distmorcego > distdog && distdog < distgolem) {
    this.direction =  ct.u.pointDirection(this.x,this.y,dog.x, dog.y)
    this.speed = 7  
}
} else if (dogexiste) {
    if (distmorcego < 2650 && distmorcego < distdog) {
this.direction = ct.u.pointDirection(this.x,this.y,morcego.x, morcego.y)
this.speed = 7
}


if (distdog < 2650 && distmorcego > distdog) {
    this.direction =  ct.u.pointDirection(this.x,this.y,dog.x, dog.y)
    this.speed = 7  
    // console.log(distanciaatual,distdog)
}
} else  {
    if (distmorcego < 2650) {
this.direction = ct.u.pointDirection(this.x,this.y,morcego.x, morcego.y)
this.speed = 7
}
}

if (golemexiste && !dogexiste) {
    if (distgolem < 2650 && distmorcego > distgolem) {
    this.direction =  ct.u.pointDirection(this.x,this.y,ct.templates.list['Golem'][0].x, ct.templates.list['Golem'][0].y)
    this.speed = 7  
}
}
} 



this.angle = this.direction




// console.log('distmorcego' + distmorcego)
// console.log ('distgolem' + distgolem)
// console.log ('distdog' + distdog)


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        

// if (this.hspeed != 0){
//      this.vspeed += ct.random.dice(1,2,1.5,0,-1,-2,-1.5)
// }

// if (this.vspeed != 0){
//      this.hspeed += ct.random.dice(1,2,1.5,0,-1,-2,-1.5)
// }

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

this.timerMorte = 30

this.distmorcego = 0
this.distgolem = 0

    },
    extends: {
    "visible": false
}
};
ct.templates.list['Tiro4'] = [];
ct.templates.templates["NewTemplate"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['NewTemplate'] = [];
ct.templates.templates["coiso_de_escolher"] = {
    depth: 106,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "coiso_de_escolher",
    onStep: function () {
        if (ct.actions.Esq.pressed && this.pos > 1) {
this.pos -= 1
}
parototal = false

var texto1;
var texto2;
var texto3;




// console.log(xposmenuescolha)

if (ct.actions.Dir.pressed && this.pos < 3) {
this.pos += 1
}

console.log('3:' + this.dado3)
console.log('2:' + this.dado2)
console.log('1:' + this.dado1)

if (this.dado1 != this.dado2 && this.dado1 != this.dado3 && this.dado2 != this.dado3) {
    this.visible = true
} else {
    // this.dado1 = ct.random.range(2,10)
    // this.dado2 = ct.random.range(2,10)
    // this.dado3 = ct.random.range(2,10)

    this.dado1 = ct.random.dice(2,3,4,5,7,10)
    this.dado2 = ct.random.dice(2,3,4,5,7,10)
    this.dado3 = ct.random.dice(2,3,4,5,7,10)
}

if (this.dado1 == 2 && this.visible) {
    ct.templates.copy('RAJADA',ct.camera.x - 500,360)
    texto1 = 'Lança uma rajada de três tiros.' 
}

if (this.dado1 == 3 && this.visible) {
    ct.templates.copy('fogotiro',ct.camera.x - 500,350)
    texto1 = 'Queima o seus inimigos com o passar do tempo.'
}

if (this.dado1 == 4 && this.visible) {
    ct.templates.copy('RATO',ct.camera.x - 500,400)
    texto1 = 'Um rato amaldiçoado a seguir os inimigos próximos.'
}

if (this.dado1 == 5 && this.visible) {
    ct.templates.copy('GELO',ct.camera.x - 500,360)
    texto1 = 'Um tiro que retarta seus inimigos.'
}

if (this.dado1 == 6 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x - 500,280)
    texto1 = ''
}

if (this.dado1 == 7 && this.visible) {
    ct.templates.copy('bolinha',ct.camera.x - 500,360)
    texto1 = 'Atira em velocidade extrema.Ótimo pra quem gosta de afundar o botão.'
}

if (this.dado1 == 8 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x - 500,280)
    texto1 = '' 
}

if (this.dado1 == 9 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x - 500,280)
    texto1 =  ''
}

if (this.dado1 == 10 && this.visible) {
    ct.templates.copy('Bumerangue',ct.camera.x - 500,300)
    texto1 = 'Vai e volta,dando um bom dano duas vezes.'
}

if (this.dado2 == 2 && this.visible) {
    ct.templates.copy('RAJADA',ct.camera.x - 100,360)
    texto2 = 'Lança uma rajada de três tiros.'
}

if (this.dado2 == 3 && this.visible) {
    ct.templates.copy('fogotiro',ct.camera.x - 100,350)
    texto2 = 'Queima o seus inimigos com o passar do tempo.'
}

if (this.dado2 == 4 && this.visible) {
    ct.templates.copy('RATO',ct.camera.x - 100,400)
    texto2 = 'Um rato amaldiçoado a seguir os inimigos próximos.'
}

if (this.dado2 == 5 && this.visible) {
    ct.templates.copy('GELO',ct.camera.x - 100,360)
    texto2 = 'Um tiro que retarta seus inimigos.'
}

if (this.dado2 == 6 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x - 100,280)
    console.log('aaa')
}

if (this.dado2 == 7 && this.visible) {
    ct.templates.copy('bolinha',ct.camera.x - 100,360)
    texto2 = 'Atira em velocidade extrema.Ótimo pra quem gosta de afundar o botão.'
}

if (this.dado2 == 8 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x - 100,280)
    console.log('aaa')
}

if (this.dado2 == 9 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x - 100,280)
    console.log('aaa')
}

if (this.dado2 == 10 && this.visible) {
    ct.templates.copy('Bumerangue',ct.camera.x - 100,300)
    console.log('aaa')
    texto2 = 'Vai e volta,dando um bom dano duas vezes.'
}

if (this.dado3 == 2 && this.visible) {
    ct.templates.copy('RAJADA',ct.camera.x + 290,360)
    texto3 = 'Lança uma rajada de três tiros.'
}

if (this.dado3 == 3 && this.visible) {
    ct.templates.copy('fogotiro',ct.camera.x + 290,350)
    texto3 = 'Queima o seus inimigos com o passar do tempo.'
}

if (this.dado3 == 4 && this.visible) {
    ct.templates.copy('RATO',ct.camera.x + 290,400)
    texto3 = 'Um rato amaldiçoado a seguir os inimigos próximos.'
}

if (this.dado3 == 5 && this.visible) {
    ct.templates.copy('GELO',ct.camera.x + 290,360)
   texto3 = 'Um tiro que retarta seus inimigos.'
}

if (this.dado3 == 6 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x + 290,280)
    // console.log('aaa')
}

if (this.dado3 == 7 && this.visible) {
    ct.templates.copy('bolinha',ct.camera.x + 290,360)
    texto3 = 'Atira em velocidade extrema.Ótimo pra quem gosta de afundar o botão.'
}

if (this.dado3 == 8 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x + 290,280)
    // console.log('aaa')
}

if (this.dado3 == 9 && this.visible) {
    // ct.templates.copy('RAJADA',ct.camera.x + 290,280)
    // console.log('aaa')
}

if (this.dado3 == 10 && this.visible) {
    ct.templates.copy('Bumerangue',ct.camera.x + 290,300)
    // console.log('aaa')
    texto3 = 'Vai e volta,dando um bom dano duas vezes.'
}

if (this.pos == 2) {
    if (ct.actions.start.pressed) {

    }
    this.removeChild(this.text)
    xposmenuescolha = ct.camera.x - 155 + 0
    yposmenuescolha = 250
    this.textochefe = texto2
    this.text.x = xposmenuescolha + 0
    this.text.y = yposmenuescolha + 320;

    this.addChild(this.text);
}

if (this.pos == 1) {
    if (ct.actions.start.pressed) {

    }
    this.removeChild(this.text)
    xposmenuescolha = ct.camera.x - 565 + 0
    yposmenuescolha = 250
    this.textochefe = texto1
    this.text.x = xposmenuescolha + 0
    this.text.y = yposmenuescolha + 320;

    this.addChild(this.text);
}


if (this.pos == 3) {
    if (ct.actions.start.pressed) {

    }
    this.removeChild(this.text)
    xposmenuescolha = ct.camera.x + 255 + 0
    yposmenuescolha = 250
    this.textochefe = texto3
    this.text.x = xposmenuescolha + 0
    this.text.y = yposmenuescolha + 320;

    this.addChild(this.text);

}
this.text.text = this.textochefe
console.log(this.text)



    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        parototal = true


menuskillaberto = false
    },
    onCreate: function () {
        this.pos = 1

    this.dado1 = ct.random.dice(2,3,4,5,7,10)
    this.dado2 = ct.random.dice(2,3,4,5,7,10)
    this.dado3 = ct.random.dice(2,3,4,5,7,10)
ct.templates.copy('selecionado2',xposmenuescolha,0)

this.textochefe = '';
this.text = new PIXI.Text(this.textochefe, ct.styles.get('fullbranco')); 
    },
    extends: {
    "visible": false
}
};
ct.templates.list['coiso_de_escolher'] = [];
ct.templates.templates["selecionado2"] = {
    depth: 200,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "SELECIONADO",
    onStep: function () {
        if (this.x == xposmenuescolha && this.y == yposmenuescolha) {
    this.visible = true
}

this.x = xposmenuescolha
this.y = yposmenuescolha
console.log(this.y)
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        yposmenuescolha = 0
    },
    extends: {
    "visible": false
}
};
ct.templates.list['selecionado2'] = [];
ct.templates.templates["RAJADA"] = {
    depth: 330,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "RAJADA",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['RAJADA'] = [];
ct.templates.templates["GELO"] = {
    depth: 300,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "GELO",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['GELO'] = [];
ct.templates.templates["bolinha"] = {
    depth: 300,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bolinha",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['bolinha'] = [];
ct.templates.templates["RATO"] = {
    depth: 328,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "RATO",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['RATO'] = [];
ct.templates.templates["Bumerangue"] = {
    depth: 300,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Bumerangue",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Bumerangue'] = [];
ct.templates.templates["fogotiro"] = {
    depth: 300,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "FOGO",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['fogotiro'] = [];
ct.templates.templates["Tiro5"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(5)",
    onStep: function () {
        this.move()

// this.angle += ct.delta * 5

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

if (this.vspeed != 0 && this.hspeed != 0) {
    this.kill = true
} else {
this.visible = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}









    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.timerMorte = 30
    },
    extends: {
    "visible": false
}
};
ct.templates.list['Tiro5'] = [];
ct.templates.templates["parede de cachorro "] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "paredog",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "visible": false,
    "cgroup": "paredog"
}
};
ct.templates.list['parede de cachorro '] = [];
ct.templates.templates["Porta_Uivo"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(7)",
    onStep: function () {
        this.move();

if (ct.place.meet(this,this.x,this.y,'Hero')) {
    if (ct.actions.start.pressed) {
        ct.rooms.switch('UivoDaMorte')
    }
    this.addChild(this.text)
} else {
    this.removeChild(this.text)
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('Uivo da morte', ct.styles.get('teste3'));
this.text.x = -70
this.text.y = -150;
    },
    extends: {}
};
ct.templates.list['Porta_Uivo'] = [];
ct.templates.templates["Tiro6"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Tiro_Pen1",
    onStep: function () {
        this.move();
this.play();
// this.angle += ct.delta * 5

if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.vida -= 5
}

if (this.vspeed == 0 && this.hspeed == 0) {
    this.kill = true
} else { 
    this.visible = true
}

if (this.vspeed != 0 && this.hspeed != 0) {
    this.kill = true
} else {
this.visible = true
}

this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}

if (this.currentFrame == 8) {
    this.tex = 'Tiro_Pen2'
}







    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        if (ct.actions.Cima.down && this.hspeed == 0) {
    this.angle = -90
    this.y += 100
    this.x -= 50
}

this.vida = 15

if (ct.actions.Baixo.down && this.hspeed == 0) {
    this.angle = 90
}

if (this.hspeed < 0) {
    this.scale.x = -1
}

if (this.vspeed > 0) {
    this.angle = 90
}

if (this.vspeed < 0) {
    this.angle = -90
}

this.vai = 0
// if (ct.actions.Dir.pressed){
//     this.tex = 'Rajada'
//     //this.dir = 1
// }

// if (ct.actions.Esq.pressed){
//     this.tex = 'Rajada2'
//     //this.dir = -1
// }

// this.virou = false
// this.tempo = 0
this.timerMorte = 30

this.animationSpeed = 36/60
    },
    extends: {
    "visible": true
}
};
ct.templates.list['Tiro6'] = [];
ct.templates.templates["Tiro8"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "tiro_de_12_",
    onStep: function () {
        this.move()
this.angle += ct.delta * 5
console.log('direcao',this.direction)
if (ct.place.occupied(this,this.x,this.y,'Inimigo')) {
this.kill = true
}

// if (this.vspeed == 0 && this.hspeed == 0) {
//     this.kill = true
// } else { 
//     this.visible = true
// }

// if (this.vspeed != 0 && this.hspeed != 0) {
//     this.kill = true
// } else {
// this.visible = true
// }

this.timerMorte += ct.delta


if (this.timerMorte >= 155) {
    this.kill = true
    this.timerMorte = 0
}







    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
// if (ct.actions.Dir.value != 0 && ct.actions.Cima.value != 0){
//     this.hspeed = 5
//     this.vspeed = -5
// }

// if (ct.actions.Esq.value != 0 && ct.actions.Cima.value != 0){
//     this.hspeed = -5
//     this.vspeed = -5
// }

// if (ct.actions.Esq.value != 0 && ct.actions.Baixo.value != 0){
//     this.hspeed = -5
//     this.vspeed = 5
// }

// if (ct.actions.Dir.value != 0 && ct.actions.Baixo.value != 0){
//     this.hspeed = 5
//     this.vspeed = 5
// }

 this.timerMorte = 105
    },
    extends: {
    "visible": true
}
};
ct.templates.list['Tiro8'] = [];
    (function vkeysTemplates() {
    ct.templates.templates.VKEY = {
        onStep: function () {
            var down = false,
                hover = false;
            if (ct.mouse) {
                if (ct.mouse.hoversUi(this)) {
                    hover = true;
                    if (ct.mouse.down) {
                        down = true;
                    }
                }
            }
            if (ct.touch) {
                for (const touch of ct.touch.events) {
                    if (ct.touch.collideUi(this, touch.id)) {
                        down = hover = true;
                        break;
                    }
                }
            }
            if (ct.pointer) {
                if (ct.pointer.hoversUi(this)) {
                    hover = true;
                    if (ct.pointer.collidesUi(this)) {
                        down = true;
                    }
                }
            }

            if (down) {
                this.tex = this.opts.texActive || this.opts.texNormal;
                ct.inputs.registry['vkeys.' + this.opts.key] = 1;
            } else {
                ct.inputs.registry['vkeys.' + this.opts.key] = 0;
                if (hover) {
                    this.tex = this.opts.texHover || this.opts.texNormal;
                } else {
                    this.tex = this.opts.texNormal;
                }
            }
        },
        onDraw: function () {
            this.x = (typeof this.opts.x === 'function') ? this.opts.x() : this.opts.x;
            this.y = (typeof this.opts.y === 'function') ? this.opts.y() : this.opts.y;
        },
        onDestroy: function () {
            void 0;
        },
        onCreate: function () {
            this.tex = this.opts.texNormal;
            this.depth = this.opts.depth;
        }
    };

    ct.templates.templates.VJOYSTICK = {
        onCreate: function () {
            this.tex = this.opts.tex;
            this.depth = this.opts.depth;
            this.down = false;
            this.trackball = new PIXI.Sprite(ct.res.getTexture(this.opts.trackballTex, 0));
            this.addChild(this.trackball);
        },
        // eslint-disable-next-line complexity
        onStep: function () {
            var dx = 0,
                dy = 0;
            if (ct.mouse) {
                if (ct.mouse.hoversUi(this)) {
                    if (ct.mouse.down) {
                        this.down = true;
                    }
                }
                if (ct.mouse.released) {
                    this.down = false;
                }
                if (this.down) {
                    dx = ct.mouse.xui - this.x;
                    dy = ct.mouse.yui - this.y;
                }
            }
            if (ct.touch) {
                if (!this.touchId) {
                    for (const touch of ct.touch.events) {
                        if (ct.touch.collideUi(this, touch.id)) {
                            this.down = true;
                            this.touchId = touch.id;
                            break;
                        }
                    }
                }
                var touch = ct.touch.getById(this.touchId);
                if (touch) {
                    dx = touch.xui - this.x;
                    dy = touch.yui - this.y;
                } else {
                    this.touchId = false;
                    this.down = false;
                }
            }
            if (ct.pointer) {
                if (this.trackedPointer && !ct.pointer.down.includes(this.trackedPointer)) {
                    this.trackedPointer = void 0;
                }
                if (!this.trackedPointer) {
                    const pointer = ct.pointer.collidesUi(this);
                    if (pointer) {
                        this.down = true;
                        this.trackedPointer = pointer;
                    }
                }
                if (this.trackedPointer) {
                    dx = this.trackedPointer.xui - this.x;
                    dy = this.trackedPointer.yui - this.y;
                } else {
                    this.touchId = false;
                    this.down = false;
                }
            }
            var r = this.shape.r || this.shape.right || 64;
            if (this.down) {
                dx /= r;
                dy /= r;
                var length = Math.hypot(dx, dy);
                if (length > 1) {
                    dx /= length;
                    dy /= length;
                }
                ct.inputs.registry['vkeys.' + this.opts.key + 'X'] = dx;
                ct.inputs.registry['vkeys.' + this.opts.key + 'Y'] = dy;
            } else {
                ct.inputs.registry['vkeys.' + this.opts.key + 'X'] = 0;
                ct.inputs.registry['vkeys.' + this.opts.key + 'Y'] = 0;
            }
            this.trackball.x = dx * r;
            this.trackball.y = dy * r;
        },
        onDraw: function () {
            this.x = (typeof this.opts.x === 'function') ? this.opts.x() : this.opts.x;
            this.y = (typeof this.opts.y === 'function') ? this.opts.y() : this.opts.y;
        },
        onDestroy: function () {
            void 0;
        }
    };
})();


    ct.templates.beforeStep = function beforeStep() {
        
    };
    ct.templates.afterStep = function afterStep() {
        
    };
    ct.templates.beforeDraw = function beforeDraw() {
        if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText.scale.x = this.$cDebugCollision.scale.x = 1 / this.scale.x;
    this.$cDebugText.scale.y = this.$cDebugCollision.scale.y = 1 / this.scale.y;
    this.$cDebugText.angle = this.$cDebugCollision.angle = -this.angle;

    const newtext = `Partitions: ${this.$chashes.join(', ')}
CGroup: ${this.cgroup || 'unset'}
Shape: ${(this._shape && this._shape.__type) || 'unused'}`;
    if (this.$cDebugText.text !== newtext) {
        this.$cDebugText.text = newtext;
    }
    this.$cDebugCollision
    .clear();
    ct.place.drawDebugGraphic.apply(this);
    this.$cHadCollision = false;
}

    };
    ct.templates.afterDraw = function afterDraw() {
        /* eslint-disable no-underscore-dangle */
if ((this.transform && (this.transform._localID !== this.transform._currentLocalID)) ||
    this.x !== this.xprev ||
    this.y !== this.yprev
) {
    delete this._shape;
    const oldHashes = this.$chashes || [];
    this.$chashes = ct.place.getHashes(this);
    for (const hash of oldHashes) {
        if (this.$chashes.indexOf(hash) === -1) {
            ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
        }
    }
    for (const hash of this.$chashes) {
        if (oldHashes.indexOf(hash) === -1) {
            if (!(hash in ct.place.grid)) {
                ct.place.grid[hash] = [this];
            } else {
                ct.place.grid[hash].push(this);
            }
        }
    }
}

    };
    ct.templates.onDestroy = function onDestroy() {
        if (this.$chashes) {
    for (const hash of this.$chashes) {
        ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
    }
}

    };
})(ct);
/**
 * @extends {PIXI.TilingSprite}
 * @property {number} shiftX How much to shift the texture horizontally, in pixels.
 * @property {number} shiftY How much to shift the texture vertically, in pixels.
 * @property {number} movementX The speed at which the background's texture moves by X axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} movementY The speed at which the background's texture moves by Y axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} parallaxX A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for horizontal movement.
 * @property {number} parallaxY A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for vertical movement.
 * @class
 */
class Background extends PIXI.TilingSprite {
    constructor(texName, frame = 0, depth = 0, exts = {}) {
        var width = ct.camera.width,
            height = ct.camera.height;
        const texture = texName instanceof PIXI.Texture ?
            texName :
            ct.res.getTexture(texName, frame || 0);
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-x') {
            height = texture.height * (exts.scaleY || 1);
        }
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-y') {
            width = texture.width * (exts.scaleX || 1);
        }
        super(texture, width, height);
        if (!ct.backgrounds.list[texName]) {
            ct.backgrounds.list[texName] = [];
        }
        ct.backgrounds.list[texName].push(this);
        ct.templates.list.BACKGROUND.push(this);
        ct.stack.push(this);
        this.anchor.x = this.anchor.y = 0;
        this.depth = depth;
        this.shiftX = this.shiftY = this.movementX = this.movementY = 0;
        this.parallaxX = this.parallaxY = 1;
        if (exts) {
            ct.u.extend(this, exts);
        }
        if (this.scaleX) {
            this.tileScale.x = Number(this.scaleX);
        }
        if (this.scaleY) {
            this.tileScale.y = Number(this.scaleY);
        }
        this.reposition();
    }
    onStep() {
        this.shiftX += ct.delta * this.movementX;
        this.shiftY += ct.delta * this.movementY;
    }
    /**
     * Updates the position of this background.
     */
    reposition() {
        const cameraBounds = this.isUi ?
            {
                x: 0, y: 0, width: ct.camera.width, height: ct.camera.height
            } :
            ct.camera.getBoundingBox();
        if (this.repeat !== 'repeat-x' && this.repeat !== 'no-repeat') {
            this.y = cameraBounds.y;
            this.tilePosition.y = -this.y * this.parallaxY + this.shiftY;
            this.height = cameraBounds.height + 1;
        } else {
            this.y = this.shiftY + cameraBounds.y * (this.parallaxY - 1);
        }
        if (this.repeat !== 'repeat-y' && this.repeat !== 'no-repeat') {
            this.x = cameraBounds.x;
            this.tilePosition.x = -this.x * this.parallaxX + this.shiftX;
            this.width = cameraBounds.width + 1;
        } else {
            this.x = this.shiftX + cameraBounds.x * (this.parallaxX - 1);
        }
    }
    onDraw() {
        this.reposition();
    }
    static onCreate() {
        void 0;
    }
    static onDestroy() {
        void 0;
    }
    get isUi() {
        return this.parent ? Boolean(this.parent.isUi) : false;
    }
}
/**
 * @namespace
 */
ct.backgrounds = {
    Background,
    list: {},
    /**
     * @returns {Background} The created background
     */
    add(texName, frame = 0, depth = 0, container = ct.room) {
        if (!texName) {
            throw new Error('[ct.backgrounds] The texName argument is required.');
        }
        const bg = new Background(texName, frame, depth);
        container.addChild(bg);
        return bg;
    }
};
ct.templates.Background = Background;

/**
 * @extends {PIXI.Container}
 * @class
 */
class Tilemap extends PIXI.Container {
    /**
     * @param {object} template A template object that contains data about depth
     * and tile placement. It is usually used by ct.IDE.
     */
    constructor(template) {
        super();
        this.pixiTiles = [];
        if (template) {
            this.depth = template.depth;
            this.tiles = template.tiles.map(tile => ({
                ...tile
            }));
            if (template.extends) {
                Object.assign(this, template.extends);
            }
            for (let i = 0, l = template.tiles.length; i < l; i++) {
                const textures = ct.res.getTexture(template.tiles[i].texture);
                const sprite = new PIXI.Sprite(textures[template.tiles[i].frame]);
                sprite.anchor.x = sprite.anchor.y = 0;
                sprite.shape = textures.shape;
                this.addChild(sprite);
                this.pixiTiles.push(sprite);
                this.tiles[i].sprite = sprite;
                sprite.x = template.tiles[i].x;
                sprite.y = template.tiles[i].y;
            }
        } else {
            this.tiles = [];
        }
        ct.templates.list.TILEMAP.push(this);
    }
    /**
     * Adds a tile to the tilemap. Will throw an error if a tilemap is cached.
     * @param {string} textureName The name of the texture to use
     * @param {number} x The horizontal location of the tile
     * @param {number} y The vertical location of the tile
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(textureName, x, y, frame = 0) {
        if (this.cached) {
            throw new Error('[ct.tiles] Adding tiles to cached tilemaps is forbidden. Create a new tilemap, or add tiles before caching the tilemap.');
        }
        const texture = ct.res.getTexture(textureName, frame);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.shape = texture.shape;
        this.tiles.push({
            texture: textureName,
            frame,
            x,
            y,
            width: sprite.width,
            height: sprite.height,
            sprite
        });
        this.addChild(sprite);
        this.pixiTiles.push(sprite);
        return sprite;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     */
    cache(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        // Divide tiles into a grid of larger cells so that we can cache these cells as
        const bounds = this.getLocalBounds();
        const cols = Math.ceil(bounds.width / chunkSize),
              rows = Math.ceil(bounds.height / chunkSize);
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = new PIXI.Container();
                this.cells.push(cell);
            }
        }
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0],
                  x = Math.floor((tile.x - bounds.x) / chunkSize),
                  y = Math.floor((tile.y - bounds.y) / chunkSize);
            this.cells[y * cols + x].addChild(tile);
        }
        this.removeChildren();

        // Filter out empty cells, cache filled ones
        for (let i = 0, l = this.cells.length; i < l; i++) {
            if (this.cells[i].children.length === 0) {
                this.cells.splice(i, 1);
                i--;
                l--;
                continue;
            }
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     */
    cacheDiamond(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        this.cells = [];
        this.diamondCellMap = {};
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0];
            const [xNormalized, yNormalized] = ct.u.rotate(tile.x, tile.y * 2, -45);
            const x = Math.floor(xNormalized / chunkSize),
                  y = Math.floor(yNormalized / chunkSize),
                  key = `${x}:${y}`;
            if (!(key in this.diamondCellMap)) {
                const chunk = new PIXI.Container();
                chunk.chunkX = x;
                chunk.chunkY = y;
                this.diamondCellMap[key] = chunk;
                this.cells.push(chunk);
            }
            this.diamondCellMap[key].addChild(tile);
        }
        this.removeChildren();

        this.cells.sort((a, b) => {
            const maxA = Math.max(a.chunkY, a.chunkX),
                  maxB = Math.max(b.chunkY, b.chunkX);
            if (maxA === maxB) {
                return b.chunkX - a.chunkX;
            }
            return maxA - maxB;
        });

        for (let i = 0, l = this.cells.length; i < l; i++) {
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
}
ct.templates.Tilemap = Tilemap;

/**
 * @namespace
 */
ct.tilemaps = {
    /**
     * Creates a new tilemap at a specified depth, and adds it to the main room (ct.room).
     * @param {number} [depth] The depth of a newly created tilemap. Defaults to 0.
     * @returns {Tilemap} The created tilemap.
     */
    create(depth = 0) {
        const tilemap = new Tilemap();
        tilemap.depth = depth;
        ct.room.addChild(tilemap);
        return tilemap;
    },
    /**
     * Adds a tile to the specified tilemap. It is the same as
     * calling `tilemap.addTile(textureName, x, y, frame).
     * @param {Tilemap} tilemap The tilemap to modify.
     * @param {string} textureName The name of the texture to use.
     * @param {number} x The horizontal location of the tile.
     * @param {number} y The vertical location of the tile.
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(tilemap, textureName, x, y, frame = 0) {
        return tilemap.addTile(textureName, x, y, frame);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This is the same as calling `tilemap.cache();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cache(tilemap, chunkSize) {
        tilemap.cache(chunkSize);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     * Note that tiles should be placed on a flat plane for the proper sorting.
     * If you need an effect of elevation, consider shifting each tile with
     * tile.pivot.y property.
     *
     * This is the same as calling `tilemap.cacheDiamond();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cacheDiamond(tilemap, chunkSize) {
        tilemap.cacheDiamond(chunkSize);
    }
};

/**
 * This class represents a camera that is used by ct.js' cameras.
 * Usually you won't create new instances of it, but if you need, you can substitute
 * ct.camera with a new one.
 *
 * @extends {PIXI.DisplayObject}
 * @class
 *
 * @property {number} x The real x-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetX`
 * if the camera is in transition.
 * @property {number} y The real y-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetY`
 * if the camera is in transition.
 * @property {number} width The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.x to get a scaled version.
 * To change this value, see `ct.width` property.
 * @property {number} height The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.y to get a scaled version.
 * To change this value, see `ct.height` property.
 * @property {number} targetX The x-coordinate of the target location.
 * Moving it instead of just using the `x` parameter will trigger the drift effect.
 * @property {number} targetY The y-coordinate of the target location.
 * Moving it instead of just using the `y` parameter will trigger the drift effect.
 *
 * @property {Copy|false} follow If set, the camera will follow the given copy.
 * @property {boolean} followX Works if `follow` is set to a copy.
 * Enables following in X axis. Set it to `false` and followY to `true`
 * to limit automatic camera movement to vertical axis.
 * @property {boolean} followY Works if `follow` is set to a copy.
 * Enables following in Y axis. Set it to `false` and followX to `true`
 * to limit automatic camera movement to horizontal axis.
 * @property {number|null} borderX Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number|null} borderY Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number} shiftX Displaces the camera horizontally
 * but does not change x and y parameters.
 * @property {number} shiftY Displaces the camera vertically
 * but does not change x and y parameters.
 * @property {number} drift Works if `follow` is set to a copy.
 * If set to a value between 0 and 1, it will make camera movement smoother
 *
 * @property {number} shake The current power of a screen shake effect,
 * relative to the screen's max side (100 is 100% of screen shake).
 * If set to 0 or less, it, disables the effect.
 * @property {number} shakePhase The current phase of screen shake oscillation.
 * @property {number} shakeDecay The amount of `shake` units substracted in a second.
 * Default is 5.
 * @property {number} shakeFrequency The base frequency of the screen shake effect.
 * Default is 50.
 * @property {number} shakeX A multiplier applied to the horizontal screen shake effect.
 * Default is 1.
 * @property {number} shakeY A multiplier applied to the vertical screen shake effect.
 * Default is 1.
 * @property {number} shakeMax The maximum possible value for the `shake` property
 * to protect players from losing their monitor, in `shake` units. Default is 10.
 */
const Camera = (function Camera() {
    const shakeCamera = function shakeCamera(camera, delta) {
        const sec = delta / (PIXI.Ticker.shared.maxFPS || 60);
        camera.shake -= sec * camera.shakeDecay;
        camera.shake = Math.max(0, camera.shake);
        if (camera.shakeMax) {
            camera.shake = Math.min(camera.shake, camera.shakeMax);
        }
        const phaseDelta = sec * camera.shakeFrequency;
        camera.shakePhase += phaseDelta;
        // no logic in these constants
        // They are used to desync fluctuations and remove repetitive circular movements
        camera.shakePhaseX += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1489) * 0.25);
        camera.shakePhaseY += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1734) * 0.25);
    };
    const followCamera = function followCamera(camera) {
        // eslint-disable-next-line max-len
        const bx = camera.borderX === null ? camera.width / 2 : Math.min(camera.borderX, camera.width / 2),
              // eslint-disable-next-line max-len
              by = camera.borderY === null ? camera.height / 2 : Math.min(camera.borderY, camera.height / 2);
        const tl = camera.uiToGameCoord(bx, by),
              br = camera.uiToGameCoord(camera.width - bx, camera.height - by);

        if (camera.followX) {
            if (camera.follow.x < tl.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x - bx + camera.width / 2;
            } else if (camera.follow.x > br.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x + bx - camera.width / 2;
            }
        }
        if (camera.followY) {
            if (camera.follow.y < tl.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y - by + camera.height / 2;
            } else if (camera.follow.y > br.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y + by - camera.height / 2;
            }
        }
    };
    const restrictInRect = function restrictInRect(camera) {
        if (camera.minX !== void 0) {
            const boundary = camera.minX + camera.width * camera.scale.x * 0.5;
            camera.x = Math.max(boundary, camera.x);
            camera.targetX = Math.max(boundary, camera.targetX);
        }
        if (camera.maxX !== void 0) {
            const boundary = camera.maxX - camera.width * camera.scale.x * 0.5;
            camera.x = Math.min(boundary, camera.x);
            camera.targetX = Math.min(boundary, camera.targetX);
        }
        if (camera.minY !== void 0) {
            const boundary = camera.minY + camera.height * camera.scale.y * 0.5;
            camera.y = Math.max(boundary, camera.y);
            camera.targetY = Math.max(boundary, camera.targetY);
        }
        if (camera.maxY !== void 0) {
            const boundary = camera.maxY - camera.height * camera.scale.y * 0.5;
            camera.y = Math.min(boundary, camera.y);
            camera.targetY = Math.min(boundary, camera.targetY);
        }
    };
    class Camera extends PIXI.DisplayObject {
        constructor(x, y, w, h) {
            super();
            this.follow = this.rotate = false;
            this.followX = this.followY = true;
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.z = 500;
            this.width = w || 1920;
            this.height = h || 1080;
            this.shiftX = this.shiftY = this.interpolatedShiftX = this.interpolatedShiftY = 0;
            this.borderX = this.borderY = null;
            this.drift = 0;

            this.shake = 0;
            this.shakeDecay = 5;
            this.shakeX = this.shakeY = 1;
            this.shakeFrequency = 50;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.shakeMax = 10;

            this.getBounds = this.getBoundingBox;
        }

        get scale() {
            return this.transform.scale;
        }
        set scale(value) {
            if (typeof value === 'number') {
                value = {
                    x: value,
                    y: value
                };
            }
            this.transform.scale.copyFrom(value);
        }

        /**
         * Moves the camera to a new position. It will have a smooth transition
         * if a `drift` parameter is set.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        moveTo(x, y) {
            this.targetX = x;
            this.targetY = y;
        }

        /**
         * Moves the camera to a new position. Ignores the `drift` value.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        teleportTo(x, y) {
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.interpolatedShiftX = this.shiftX;
            this.interpolatedShiftY = this.shiftY;
        }

        /**
         * Updates the position of the camera
         * @param {number} delta A delta value between the last two frames.
         * This is usually ct.delta.
         * @returns {void}
         */
        update(delta) {
            shakeCamera(this, delta);
            // Check if we've been following a copy that is now killed
            if (this.follow && this.follow.kill) {
                this.follow = false;
            }
            // Follow copies around
            if (this.follow && ('x' in this.follow) && ('y' in this.follow)) {
                followCamera(this);
            }

            // The speed of drift movement
            const speed = this.drift ? Math.min(1, (1 - this.drift) * delta) : 1;
            // Perform drift motion
            this.x = this.targetX * speed + this.x * (1 - speed);
            this.y = this.targetY * speed + this.y * (1 - speed);

            // Off-center shifts drift, too
            this.interpolatedShiftX = this.shiftX * speed + this.interpolatedShiftX * (1 - speed);
            this.interpolatedShiftY = this.shiftY * speed + this.interpolatedShiftY * (1 - speed);

            restrictInRect(this);

            // Recover from possible calculation errors
            this.x = this.x || 0;
            this.y = this.y || 0;
        }

        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedX() {
            // eslint-disable-next-line max-len
            const dx = (Math.sin(this.shakePhaseX) + Math.sin(this.shakePhaseX * 3.1846) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const x = this.x + dx * this.shake * Math.max(this.width, this.height) / 100 * this.shakeX;
            return x + this.interpolatedShiftX;
        }
        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedY() {
            // eslint-disable-next-line max-len
            const dy = (Math.sin(this.shakePhaseY) + Math.sin(this.shakePhaseY * 2.8948) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const y = this.y + dy * this.shake * Math.max(this.width, this.height) / 100 * this.shakeY;
            return y + this.interpolatedShiftY;
        }

        /**
         * Returns the position of the left edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getBottomLeftCorner` methods.
         * @returns {number} The location of the left edge.
         * @type {number}
         * @readonly
         */
        get left() {
            return this.computedX - (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the top edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getTopRightCorner` methods.
         * @returns {number} The location of the top edge.
         * @type {number}
         * @readonly
         */
        get top() {
            return this.computedY - (this.height / 2) * this.scale.y;
        }
        /**
         * Returns the position of the right edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopRightCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the right edge.
         * @type {number}
         * @readonly
         */
        get right() {
            return this.computedX + (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the bottom edge where the visible rectangle ends,
         * in game coordinates. This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getBottomLeftCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the bottom edge.
         * @type {number}
         * @readonly
         */
        get bottom() {
            return this.computedY + (this.height / 2) * this.scale.y;
        }

        /**
         * Translates a point from UI space to game space.
         * @param {number} x The x coordinate in UI space.
         * @param {number} y The y coordinate in UI space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        uiToGameCoord(x, y) {
            const modx = (x - this.width / 2) * this.scale.x,
                  mody = (y - this.height / 2) * this.scale.y;
            const result = ct.u.rotate(modx, mody, this.angle);
            return new PIXI.Point(
                result.x + this.computedX,
                result.y + this.computedY
            );
        }

        /**
         * Translates a point from game space to UI space.
         * @param {number} x The x coordinate in game space.
         * @param {number} y The y coordinate in game space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        gameToUiCoord(x, y) {
            const relx = x - this.computedX,
                  rely = y - this.computedY;
            const unrotated = ct.u.rotate(relx, rely, -this.angle);
            return new PIXI.Point(
                unrotated.x / this.scale.x + this.width / 2,
                unrotated.y / this.scale.y + this.height / 2
            );
        }
        /**
         * Gets the position of the top-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopLeftCorner() {
            return this.uiToGameCoord(0, 0);
        }

        /**
         * Gets the position of the top-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopRightCorner() {
            return this.uiToGameCoord(this.width, 0);
        }

        /**
         * Gets the position of the bottom-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomLeftCorner() {
            return this.uiToGameCoord(0, this.height);
        }

        /**
         * Gets the position of the bottom-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomRightCorner() {
            return this.uiToGameCoord(this.width, this.height);
        }

        /**
         * Returns the bounding box of the camera.
         * Useful for rotated viewports when something needs to be reliably covered by a rectangle.
         * @returns {PIXI.Rectangle} The bounding box of the camera.
         */
        getBoundingBox() {
            const bb = new PIXI.Bounds();
            const tl = this.getTopLeftCorner(),
                  tr = this.getTopRightCorner(),
                  bl = this.getBottomLeftCorner(),
                  br = this.getBottomRightCorner();
            bb.addPoint(new PIXI.Point(tl.x, tl.y));
            bb.addPoint(new PIXI.Point(tr.x, tr.y));
            bb.addPoint(new PIXI.Point(bl.x, bl.y));
            bb.addPoint(new PIXI.Point(br.x, br.y));
            return bb.getRectangle();
        }

        /**
         * Checks whether a given object (or any Pixi's DisplayObject)
         * is potentially visible, meaning that its bounding box intersects
         * the camera's bounding box.
         * @param {PIXI.DisplayObject} copy An object to check for.
         * @returns {boolean} `true` if an object is visible, `false` otherwise.
         */
        contains(copy) {
            // `true` skips transforms recalculations, boosting performance
            const bounds = copy.getBounds(true);
            return bounds.right > 0 &&
                bounds.left < this.width * this.scale.x &&
                bounds.bottom > 0 &&
                bounds.top < this.width * this.scale.y;
        }

        /**
         * Realigns all the copies in a room so that they distribute proportionally
         * to a new camera size based on their `xstart` and `ystart` coordinates.
         * Will throw an error if the given room is not in UI space (if `room.isUi` is not `true`).
         * You can skip the realignment for some copies
         * if you set their `skipRealign` parameter to `true`.
         * @param {Room} room The room which copies will be realigned.
         * @returns {void}
         */
        realign(room) {
            if (!room.isUi) {
                throw new Error('[ct.camera] An attempt to realing a room that is not in UI space. The room in question is', room);
            }
            const w = (ct.rooms.templates[room.name].width || 1),
                  h = (ct.rooms.templates[room.name].height || 1);
            for (const copy of room.children) {
                if (!('xstart' in copy) || copy.skipRealign) {
                    continue;
                }
                copy.x = copy.xstart / w * this.width;
                copy.y = copy.ystart / h * this.height;
            }
        }
        /**
         * This will align all non-UI layers in the game according to the camera's transforms.
         * This is automatically called internally, and you will hardly ever use it.
         * @returns {void}
         */
        manageStage() {
            const px = this.computedX,
                  py = this.computedY,
                  sx = 1 / (isNaN(this.scale.x) ? 1 : this.scale.x),
                  sy = 1 / (isNaN(this.scale.y) ? 1 : this.scale.y);
            for (const item of ct.stage.children) {
                if (!item.isUi && item.pivot) {
                    item.x = -this.width / 2;
                    item.y = -this.height / 2;
                    item.pivot.x = px;
                    item.pivot.y = py;
                    item.scale.x = sx;
                    item.scale.y = sy;
                    item.angle = -this.angle;
                }
            }
        }
    }
    return Camera;
})(ct);
void Camera;

(function timerAddon() {
    const ctTimerTime = Symbol('time');
    const ctTimerRoomUid = Symbol('roomUid');
    const ctTimerTimeLeftOriginal = Symbol('timeLeftOriginal');
    const promiseResolve = Symbol('promiseResolve');
    const promiseReject = Symbol('promiseReject');

    /**
     * @property {boolean} isUi Whether the timer uses ct.deltaUi or not.
     * @property {string|false} name The name of the timer
     */
    class CtTimer {
        /**
         * An object for holding a timer
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer
         * @param {boolean} [uiDelta=false] If `true`, it will use `ct.deltaUi` for counting time.
         * if `false`, it will use `ct.delta` for counting time.
         */
        constructor(timeMs, name = false, uiDelta = false) {
            this[ctTimerRoomUid] = ct.room.uid || null;
            this.name = name && name.toString();
            this.isUi = uiDelta;
            this[ctTimerTime] = 0;
            this[ctTimerTimeLeftOriginal] = timeMs;
            this.timeLeft = this[ctTimerTimeLeftOriginal];
            this.promise = new Promise((resolve, reject) => {
                this[promiseResolve] = resolve;
                this[promiseReject] = reject;
            });
            this.rejected = false;
            this.done = false;
            this.settled = false;
            ct.timer.timers.add(this);
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param {Function} onfulfilled The callback to execute when the Promise is resolved.
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        then(...args) {
            return this.promise.then(...args);
        }
        /**
         * Attaches a callback for the rejection of the Promise.
         *
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        catch(onrejected) {
            return this.promise.catch(onrejected);
        }

        /**
         * The time passed on this timer, in seconds
         * @type {number}
         */
        get time() {
            return this[ctTimerTime] * 1000 / ct.speed;
        }
        set time(newTime) {
            this[ctTimerTime] = newTime / 1000 * ct.speed;
        }

        /**
         * Updates the timer. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        update() {
            // Not something that would normally happen,
            // but do check whether this timer was not automatically removed
            if (this.rejected === true || this.done === true) {
                this.remove();
                return;
            }
            this[ctTimerTime] += this.isUi ? ct.deltaUi : ct.delta;
            if (ct.room.uid !== this[ctTimerRoomUid] && this[ctTimerRoomUid] !== null) {
                this.reject({
                    info: 'Room switch',
                    from: 'ct.timer'
                }); // Reject if the room was switched
            }

            // If the timer is supposed to end
            if (this.timeLeft !== 0) {
                this.timeLeft = this[ctTimerTimeLeftOriginal] - this.time;
                if (this.timeLeft <= 0) {
                    this.resolve();
                }
            }
        }

        /**
         * Instantly triggers the timer and calls the callbacks added through `then` method.
         * @returns {void}
         */
        resolve() {
            if (this.settled) {
                return;
            }
            this.done = true;
            this.settled = true;
            this[promiseResolve]();
            this.remove();
        }
        /**
         * Stops the timer with a given message by rejecting a Promise object.
         * @param {any} message The value to pass to the `catch` callback
         * @returns {void}
         */
        reject(message) {
            if (this.settled) {
                return;
            }
            this.rejected = true;
            this.settled = true;
            this[promiseReject](message);
            this.remove();
        }
        /**
         * Removes the timer from ct.js game loop. This timer will not trigger.
         * @returns {void}
         */
        remove() {
            ct.timer.timers.delete(this);
        }
    }
    window.CtTimer = CtTimer;

    /**
     * Timer utilities
     * @namespace
     */
    ct.timer = {
        /**
         * A set with all the active timers.
         * @type Set<CtTimer>
         */
        timers: new Set(),
        counter: 0,
        /**
         * Adds a new timer with a given name
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        add(timeMs, name = false) {
            return new CtTimer(timeMs, name, false);
        },
        /**
         * Adds a new timer with a given name that runs in a UI time scale
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        addUi(timeMs, name = false) {
            return new CtTimer(timeMs, name, true);
        },
        /**
         * Updates the timers. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        updateTimers() {
            for (const timer of this.timers) {
                timer.update();
            }
        }
    };
})();
if (document.fonts) { for (const font of document.fonts) { font.load(); }}/**
 * @typedef ICtPlaceRectangle
 * @property {number} [x1] The left side of the rectangle.
 * @property {number} [y1] The upper side of the rectangle.
 * @property {number} [x2] The right side of the rectangle.
 * @property {number} [y2] The bottom side of the rectangle.
 * @property {number} [x] The left side of the rectangle.
 * @property {number} [y] The upper side of the rectangle.
 * @property {number} [width] The right side of the rectangle.
 * @property {number} [height] The bottom side of the rectangle.
 */
/**
 * @typedef ICtPlaceLineSegment
 * @property {number} x1 The horizontal coordinate of the starting point of the ray.
 * @property {number} y1 The vertical coordinate of the starting point of the ray.
 * @property {number} x2 The horizontal coordinate of the ending point of the ray.
 * @property {number} y2 The vertical coordinate of the ending point of the ray.
 */
/**
 * @typedef ICtPlaceCircle
 * @property {number} x The horizontal coordinate of the circle's center.
 * @property {number} y The vertical coordinate of the circle's center.
 * @property {number} radius The radius of the circle.
 */
/* eslint-disable no-underscore-dangle */
/* global SSCD */
/* eslint prefer-destructuring: 0 */
(function ctPlace(ct) {
    const circlePrecision = 16,
          twoPi = Math.PI * 0;
    const debugMode = [false][0];

    const getSSCDShapeFromRect = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (obj.angle === 0) {
            position.x -= obj.scale.x > 0 ?
                (shape.left * obj.scale.x) :
                (-obj.scale.x * shape.right);
            position.y -= obj.scale.y > 0 ?
                (shape.top * obj.scale.y) :
                (-shape.bottom * obj.scale.y);
            return new SSCD.Rectangle(
                position,
                new SSCD.Vector(
                    Math.abs((shape.left + shape.right) * obj.scale.x),
                    Math.abs((shape.bottom + shape.top) * obj.scale.y)
                )
            );
        }
        const upperLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        const bottomLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const bottomRight = ct.u.rotate(
            shape.right * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const upperRight = ct.u.rotate(
            shape.right * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        return new SSCD.LineStrip(position, [
            new SSCD.Vector(upperLeft.x, upperLeft.y),
            new SSCD.Vector(bottomLeft.x, bottomLeft.y),
            new SSCD.Vector(bottomRight.x, bottomRight.y),
            new SSCD.Vector(upperRight.x, upperRight.y)
        ], true);
    };

    const getSSCDShapeFromCircle = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (Math.abs(obj.scale.x) === Math.abs(obj.scale.y)) {
            return new SSCD.Circle(position, shape.r * Math.abs(obj.scale.x));
        }
        const vertices = [];
        for (let i = 0; i < circlePrecision; i++) {
            const point = [
                Math.sin(twoPi / circlePrecision * i) * shape.r * obj.scale.x,
                Math.cos(twoPi / circlePrecision * i) * shape.r * obj.scale.y
            ];
            if (obj.angle !== 0) {
                const {x, y} = ct.u.rotate(point[0], point[1], obj.angle);
                vertices.push(x, y);
            } else {
                vertices.push(point);
            }
        }
        return new SSCD.LineStrip(position, vertices, true);
    };

    const getSSCDShapeFromStrip = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        const vertices = [];
        if (obj.angle !== 0) {
            for (const point of shape.points) {
                const {x, y} = ct.u.rotate(
                    point.x * obj.scale.x,
                    point.y * obj.scale.y, obj.angle
                );
                vertices.push(new SSCD.Vector(x, y));
            }
        } else {
            for (const point of shape.points) {
                vertices.push(new SSCD.Vector(point.x * obj.scale.x, point.y * obj.scale.y));
            }
        }
        return new SSCD.LineStrip(position, vertices, Boolean(shape.closedStrip));
    };

    const getSSCDShapeFromLine = function (obj) {
        const {shape} = obj;
        if (obj.angle !== 0) {
            const {x: x1, y: y1} = ct.u.rotate(
                shape.x1 * obj.scale.x,
                shape.y1 * obj.scale.y,
                obj.angle
            );
            const {x: x2, y: y2} = ct.u.rotate(
                shape.x2 * obj.scale.x,
                shape.y2 * obj.scale.y,
                obj.angle
            );
            return new SSCD.Line(
                new SSCD.Vector(
                    obj.x + x1,
                    obj.y + y1
                ),
                new SSCD.Vector(
                    x2 - x1,
                    y2 - y1
                )
            );
        }
        return new SSCD.Line(
            new SSCD.Vector(
                obj.x + shape.x1 * obj.scale.x,
                obj.y + shape.y1 * obj.scale.y
            ),
            new SSCD.Vector(
                (shape.x2 - shape.x1) * obj.scale.x,
                (shape.y2 - shape.y1) * obj.scale.y
            )
        );
    };

    /**
     * Gets SSCD shapes from object's shape field and its transforms.
     */
    var getSSCDShape = function (obj) {
        switch (obj.shape.type) {
        case 'rect':
            return getSSCDShapeFromRect(obj);
        case 'circle':
            return getSSCDShapeFromCircle(obj);
        case 'strip':
            return getSSCDShapeFromStrip(obj);
        case 'line':
            return getSSCDShapeFromLine(obj);
        default:
            return new SSCD.Circle(new SSCD.Vector(obj.x, obj.y), 0);
        }
    };

    // Premade filter predicates to avoid function creation and memory bloat during the game loop.
    const templateNameFilter = (target, other, template) => other.template === template;
    const cgroupFilter = (target, other, cgroup) => !cgroup || cgroup === other.cgroup;

    // Core collision-checking method that accepts various filtering predicates
    // and a variable partitioning grid.

    // eslint-disable-next-line max-params
    const genericCollisionQuery = function (
        target,
        customX,
        customY,
        partitioningGrid,
        queryAll,
        filterPredicate,
        filterVariable
    ) {
        const oldx = target.x,
              oldy = target.y;
        const shapeCashed = target._shape;
        let hashes, results;
        // Apply arbitrary location to the checked object
        if (customX !== void 0 && (oldx !== customX || oldy !== customY)) {
            target.x = customX;
            target.y = customY;
            target._shape = getSSCDShape(target);
            hashes = ct.place.getHashes(target);
        } else {
            hashes = target.$chashes || ct.place.getHashes(target);
            target._shape = target._shape || getSSCDShape(target);
        }
        if (queryAll) {
            results = [];
        }
        // Get all the known objects in close proximity to the tested object,
        // sourcing from the passed partitioning grid.
        for (const hash of hashes) {
            const array = partitioningGrid[hash];
            // Such partition cell is absent
            if (!array) {
                continue;
            }
            for (const obj of array) {
                // Skip checks against the tested object itself.
                if (obj === target) {
                    continue;
                }
                // Filter out objects
                if (!filterPredicate(target, obj, filterVariable)) {
                    continue;
                }
                // Check for collision between two objects
                if (ct.place.collide(target, obj)) {
                    // Singular pick; return the collided object immediately.
                    if (!queryAll) {
                        // Return the object back to its old position.
                        // Skip SSCD shape re-calculation.
                        if (oldx !== target.x || oldy !== target.y) {
                            target.x = oldx;
                            target.y = oldy;
                            target._shape = shapeCashed;
                        }
                        return obj;
                    }
                    // Multiple pick; push the collided object into an array.
                    if (!results.includes(obj)) {
                        results.push(obj);
                    }
                }
            }
        }
        // Return the object back to its old position.
        // Skip SSCD shape re-calculation.
        if (oldx !== target.x || oldy !== target.y) {
            target.x = oldx;
            target.y = oldy;
            target._shape = shapeCashed;
        }
        if (!queryAll) {
            return false;
        }
        return results;
    };

    ct.place = {
        m: 1, // direction modifier in ct.place.go,
        gridX: [1024][0] || 512,
        gridY: [1024][0] || 512,
        grid: {},
        tileGrid: {},
        getHashes(copy) {
            var hashes = [];
            var x = Math.round(copy.x / ct.place.gridX),
                y = Math.round(copy.y / ct.place.gridY),
                dx = Math.sign(copy.x - ct.place.gridX * x),
                dy = Math.sign(copy.y - ct.place.gridY * y);
            hashes.push(`${x}:${y}`);
            if (dx) {
                hashes.push(`${x + dx}:${y}`);
                if (dy) {
                    hashes.push(`${x + dx}:${y + dy}`);
                }
            }
            if (dy) {
                hashes.push(`${x}:${y + dy}`);
            }
            return hashes;
        },
        /**
         * Applied to copies in the debug mode. Draws a collision shape
         * @this Copy
         * @param {boolean} [absolute] Whether to use room coordinates
         * instead of coordinates relative to the copy.
         * @returns {void}
         */
        drawDebugGraphic(absolute) {
            const shape = this._shape || getSSCDShape(this);
            const g = this.$cDebugCollision;
            let color = 0x00ffff;
            if (this instanceof Copy) {
                color = 0x0066ff;
            } else if (this instanceof PIXI.Sprite) {
                color = 0x6600ff;
            }
            if (this.$cHadCollision) {
                color = 0x00ff00;
            }
            g.lineStyle(2, color);
            if (shape instanceof SSCD.Rectangle) {
                const pos = shape.get_position(),
                      size = shape.get_size();
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawRect(pos.x - this.x, pos.y - this.y, size.x, size.y);
                } else {
                    g.drawRect(pos.x, pos.y, size.x, size.y);
                }
                g.endFill();
            } else if (shape instanceof SSCD.LineStrip) {
                if (!absolute) {
                    g.moveTo(shape.__points[0].x, shape.__points[0].y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x, shape.__points[i].y);
                    }
                } else {
                    g.moveTo(shape.__points[0].x + this.x, shape.__points[0].y + this.y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x + this.x, shape.__points[i].y + this.y);
                    }
                }
            } else if (shape instanceof SSCD.Circle && shape.get_radius() > 0) {
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawCircle(0, 0, shape.get_radius());
                } else {
                    g.drawCircle(this.x, this.y, shape.get_radius());
                }
                g.endFill();
            } else if (shape instanceof SSCD.Line) {
                if (!absolute) {
                    g.moveTo(
                        shape.__position.x,
                        shape.__position.y
                    ).lineTo(
                        shape.__position.x + shape.__dest.x,
                        shape.__position.y + shape.__dest.y
                    );
                } else {
                    const p1 = shape.get_p1();
                    const p2 = shape.get_p2();
                    g.moveTo(p1.x, p1.y)
                    .lineTo(p2.x, p2.y);
                }
            } else if (!absolute) { // Treat as a point
                g.moveTo(-16, -16)
                .lineTo(16, 16)
                .moveTo(-16, 16)
                .lineTo(16, -16);
            } else {
                g.moveTo(-16 + this.x, -16 + this.y)
                .lineTo(16 + this.x, 16 + this.y)
                .moveTo(-16 + this.x, 16 + this.y)
                .lineTo(16 + this.x, -16 + this.y);
            }
        },
        collide(c1, c2) {
            // ct.place.collide(<c1: Copy, c2: Copy>)
            // Test collision between two copies
            c1._shape = c1._shape || getSSCDShape(c1);
            c2._shape = c2._shape || getSSCDShape(c2);
            if (c1._shape.__type === 'strip' ||
                c2._shape.__type === 'strip' ||
                c1._shape.__type === 'complex' ||
                c2._shape.__type === 'complex'
            ) {
                const aabb1 = c1._shape.get_aabb(),
                      aabb2 = c2._shape.get_aabb();
                if (!aabb1.intersects(aabb2)) {
                    return false;
                }
            }
            if (SSCD.CollisionManager.test_collision(c1._shape, c2._shape)) {
                if ([false][0]) {
                    c1.$cHadCollision = true;
                    c2.$cHadCollision = true;
                }
                return true;
            }
            return false;
        },
        /**
         * Determines if the place in (x,y) is occupied by any copies or tiles.
         * Optionally can take 'cgroup' as a filter for obstacles'
         * collision group (not shape type).
         *
         * @param {Copy} me The object to check collisions on.
         * @param {number} [x] The x coordinate to check, as if `me` was placed there.
         * @param {number} [y] The y coordinate to check, as if `me` was placed there.
         * @param {String} [cgroup] The collision group to check against
         * @returns {Copy|Array<Copy>} The collided copy, or an array of all the detected collisions
         * (if `multiple` is `true`)
         */
        occupied(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
            // Was any suitable copy found? Return it immediately and skip the query for tiles.
            if (copies) {
                return copies;
            }
            // Return query result for tiles.
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        occupiedMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
            const tiles = genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
            return copies.concat(tiles);
        },
        free(me, x, y, cgroup) {
            return !ct.place.occupied(me, x, y, cgroup);
        },
        meet(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                templateNameFilter, templateName
            );
        },
        meetMultiple(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                templateNameFilter, templateName
            );
        },
        copies(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
        },
        copiesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
        },
        tiles(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        tilesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
        },
        lastdist: null,
        nearest(x, y, templateName) {
            // ct.place.nearest(x: number, y: number, templateName: string)
            const copies = ct.templates.list[templateName];
            if (copies.length > 0) {
                var dist = Math.hypot(x - copies[0].x, y - copies[0].y);
                var inst = copies[0];
                for (const copy of copies) {
                    if (Math.hypot(x - copy.x, y - copy.y) < dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        furthest(x, y, template) {
            // ct.place.furthest(<x: number, y: number, template: Template>)
            const templates = ct.templates.list[template];
            if (templates.length > 0) {
                var dist = Math.hypot(x - templates[0].x, y - templates[0].y);
                var inst = templates[0];
                for (const copy of templates) {
                    if (Math.hypot(x - copy.x, y - copy.y) > dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        enableTilemapCollisions(tilemap, exactCgroup) {
            const cgroup = exactCgroup || tilemap.cgroup;
            if (tilemap.addedCollisions) {
                throw new Error('[ct.place] The tilemap already has collisions enabled.');
            }
            tilemap.cgroup = cgroup;
            // Prebake hashes and SSCD shapes for all the tiles
            for (const pixiSprite of tilemap.pixiTiles) {
                // eslint-disable-next-line no-underscore-dangle
                pixiSprite._shape = getSSCDShape(pixiSprite);
                pixiSprite.cgroup = cgroup;
                pixiSprite.$chashes = ct.place.getHashes(pixiSprite);
                /* eslint max-depth: 0 */
                for (const hash of pixiSprite.$chashes) {
                    if (!(hash in ct.place.tileGrid)) {
                        ct.place.tileGrid[hash] = [pixiSprite];
                    } else {
                        ct.place.tileGrid[hash].push(pixiSprite);
                    }
                }
                pixiSprite.depth = tilemap.depth;
            }
            if (debugMode) {
                for (const pixiSprite of tilemap.pixiTiles) {
                    pixiSprite.$cDebugCollision = new PIXI.Graphics();
                    ct.place.drawDebugGraphic.apply(pixiSprite, [false]);
                    pixiSprite.addChild(pixiSprite.$cDebugCollision);
                }
            }
            tilemap.addedCollisions = true;
        },
        moveAlong(me, dir, length, cgroup, precision) {
            if (!length) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            precision = Math.abs(precision || 1);
            if (length < 0) {
                length *= -1;
                dir += 180;
            }
            var dx = Math.cos(dir * Math.PI / 180) * precision,
                dy = Math.sin(dir * Math.PI / 180) * precision;
            while (length > 0) {
                if (length < 1) {
                    dx *= length;
                    dy *= length;
                }
                const occupied = ct.place.occupied(me, me.x + dx, me.y + dy, cgroup);
                if (!occupied) {
                    me.x += dx;
                    me.y += dy;
                    delete me._shape;
                } else {
                    return occupied;
                }
                length--;
            }
            return false;
        },
        moveByAxes(me, dx, dy, cgroup, precision) {
            if (dx === dy === 0) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            const obstacles = {
                x: false,
                y: false
            };
            precision = Math.abs(precision || 1);
            while (Math.abs(dx) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x + Math.sign(dx) * precision, me.y, cgroup);
                if (!occupied) {
                    me.x += Math.sign(dx) * precision;
                    dx -= Math.sign(dx) * precision;
                } else {
                    obstacles.x = occupied;
                    break;
                }
            }
            while (Math.abs(dy) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x, me.y + Math.sign(dy) * precision, cgroup);
                if (!occupied) {
                    me.y += Math.sign(dy) * precision;
                    dy -= Math.sign(dy) * precision;
                } else {
                    obstacles.y = occupied;
                    break;
                }
            }
            // A fraction of precision may be left but completely reachable; jump to this point.
            if (Math.abs(dx) < precision) {
                if (ct.place.free(me, me.x + dx, me.y, cgroup)) {
                    me.x += dx;
                }
            }
            if (Math.abs(dy) < precision) {
                if (ct.place.free(me, me.x, me.y + dy, cgroup)) {
                    me.y += dy;
                }
            }
            if (!obstacles.x && !obstacles.y) {
                return false;
            }
            return obstacles;
        },
        go(me, x, y, length, cgroup) {
            // ct.place.go(<me: Copy, x: number, y: number, length: number>[, cgroup: String])
            // tries to reach the target with a simple obstacle avoidance algorithm

            // if we are too close to the destination, exit
            if (ct.u.pdc(me.x, me.y, x, y) < length) {
                if (ct.place.free(me, x, y, cgroup)) {
                    me.x = x;
                    me.y = y;
                    delete me._shape;
                }
                return;
            }
            var dir = ct.u.pdn(me.x, me.y, x, y);

            //if there are no obstackles in front of us, go forward
            let projectedX = me.x + ct.u.ldx(length, dir),
                projectedY = me.y + ct.u.ldy(length, dir);
            if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                me.x = projectedX;
                me.y = projectedY;
                delete me._shape;
                me.dir = dir;
            // otherwise, try to change direction by 30...60...90 degrees.
            // Direction changes over time (ct.place.m).
            } else {
                for (var i = -1; i <= 1; i += 2) {
                    for (var j = 30; j < 150; j += 30) {
                        projectedX = me.x + ct.u.ldx(length, dir + j * ct.place.m * i);
                        projectedY = me.y + ct.u.ldy(length, dir + j * ct.place.m * i);
                        if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                            me.x = projectedX;
                            me.y = projectedY;
                            delete me._shape;
                            me.dir = dir + j * ct.place.m * i;
                            return;
                        }
                    }
                }
            }
        },
        traceCustom(shape, oversized, cgroup, getAll) {
            const results = [];
            if (debugMode) {
                shape.$cDebugCollision = ct.place.debugTraceGraphics;
                ct.place.drawDebugGraphic.apply(shape, [true]);
            }
            // Oversized tracing shapes won't work with partitioning table, and thus
            // will need to loop over all the copies and tiles in the room.
            // Non-oversized shapes can use plain ct.place.occupied.
            if (!oversized) {
                if (getAll) {
                    return ct.place.occupiedMultiple(shape, cgroup);
                }
                return ct.place.occupied(shape, cgroup);
            }
            // Oversized shapes.
            // Loop over all the copies in the room.
            for (const copy of ct.stack) {
                if (!cgroup || copy.cgroup === cgroup) {
                    if (ct.place.collide(shape, copy)) {
                        if (getAll) {
                            results.push(copy);
                        } else {
                            return copy;
                        }
                    }
                }
            }
            // Additionally, loop over all the tilesets and their tiles.
            for (const tilemap of ct.templates.list.TILEMAP) {
                if (!tilemap.addedCollisions) {
                    continue;
                }
                if (cgroup && tilemap.cgroup !== cgroup) {
                    continue;
                }
                for (const tile of tilemap.pixiTiles) {
                    if (ct.place.collide(shape, tile)) {
                        if (getAll) {
                            results.push(tile);
                        } else {
                            return tile;
                        }
                    }
                }
            }
            if (!getAll) {
                return false;
            }
            return results;
        },
        /**
         * Tests for intersections with a line segment.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the line segment; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceLineSegment} line An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceLine(line, cgroup, getAll) {
            let oversized = false;
            if (Math.abs(line.x1 - line.x2) > ct.place.gridX) {
                oversized = true;
            } else if (Math.abs(line.y1 - line.y2) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: line.x1,
                y: line.y1,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: line.x2 - line.x1,
                    y2: line.y2 - line.y1
                }
            };
            const result = ct.place.traceCustom(shape, oversized, cgroup, getAll);
            if (getAll) {
                // An approximate sorting by distance
                result.sort(function sortCopies(a, b) {
                    var dist1, dist2;
                    dist1 = ct.u.pdc(line.x1, line.y1, a.x, a.y);
                    dist2 = ct.u.pdc(line.x1, line.y1, b.x, b.y);
                    return dist1 - dist2;
                });
            }
            return result;
        },
        /**
         * Tests for intersections with a filled rectangle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the rectangle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceRectangle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceRect(rect, cgroup, getAll) {
            let oversized = false;
            rect = { // Copy the object
                ...rect
            };
            // Turn x1, x2, y1, y2 into x, y, width, and height
            if ('x1' in rect) {
                rect.x = rect.x1;
                rect.y = rect.y1;
                rect.width = rect.x2 - rect.x1;
                rect.height = rect.y2 - rect.y1;
            }
            if (Math.abs(rect.width) > ct.place.gridX || Math.abs(rect.height) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: rect.x,
                y: rect.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    right: rect.width,
                    bottom: rect.height
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a filled circle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the circle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceCircle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceCircle(circle, cgroup, getAll) {
            let oversized = false;
            if (circle.radius * 2 > ct.place.gridX || circle.radius * 2 > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: circle.x,
                y: circle.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'circle',
                    r: circle.radius
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a polyline. It is a hollow shape made
         * of connected line segments. The shape is not closed unless you add
         * the closing point by yourself.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the polyline; otherwise, returns the first one that fits the conditions.
         *
         * @param {Array<IPoint>} polyline An array of objects with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePolyline(polyline, cgroup, getAll) {
            const shape = {
                x: 0,
                y: 0,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'strip',
                    points: polyline
                }
            };
            return ct.place.traceCustom(shape, true, cgroup, getAll);
        },
        /**
         * Tests for intersections with a point.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the point; otherwise, returns the first one that fits the conditions.
         *
         * @param {object} point An object with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePoint(point, cgroup, getAll) {
            const shape = {
                x: point.x,
                y: point.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'point'
                }
            };
            return ct.place.traceCustom(shape, false, cgroup, getAll);
        }
    };
    // Aliases
    ct.place.traceRectange = ct.place.traceRect;
    // a magic procedure which tells 'go' function to change its direction
    setInterval(function switchCtPlaceGoDirection() {
        ct.place.m *= -1;
    }, 789);
})(ct);

(function fittoscreen(ct) {
    document.body.style.overflow = 'hidden';
    var canv = ct.pixiApp.view;
    const positionCanvas = function positionCanvas(mode, scale) {
        if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canv.style.transform = `translate(-50%, -50%) scale(${scale})`;
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        } else if (mode === 'expandViewport' || mode === 'expand' || mode === 'scaleFill') {
            canv.style.position = 'static';
            canv.style.top = 'unset';
            canv.style.left = 'unset';
        } else if (mode === 'scaleFit') {
            canv.style.transform = 'translate(-50%, -50%)';
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        }
    };
    var resize = function resize() {
        const {mode} = ct.fittoscreen;
        const pixelScaleModifier = ct.highDensity ? (window.devicePixelRatio || 1) : 1;
        const kw = window.innerWidth / ct.roomWidth,
              kh = window.innerHeight / ct.roomHeight;
        let k = Math.min(kw, kh);
        if (mode === 'fastScaleInteger') {
            k = k < 1 ? k : Math.floor(k);
        }
        var canvasWidth, canvasHeight,
            cameraWidth, cameraHeight;
        if (mode === 'expandViewport' || mode === 'expand') {
            canvasWidth = Math.ceil(window.innerWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(window.innerHeight * pixelScaleModifier);
            cameraWidth = window.innerWidth;
            cameraHeight = window.innerHeight;
        } else if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canvasWidth = Math.ceil(ct.roomWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(ct.roomHeight * pixelScaleModifier);
            cameraWidth = ct.roomWidth;
            cameraHeight = ct.roomHeight;
        } else if (mode === 'scaleFit' || mode === 'scaleFill') {
            if (mode === 'scaleFill') {
                canvasWidth = Math.ceil(ct.roomWidth * kw * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * kh * pixelScaleModifier);
                cameraWidth = window.innerWidth / k;
                cameraHeight = window.innerHeight / k;
            } else { // scaleFit
                canvasWidth = Math.ceil(ct.roomWidth * k * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * k * pixelScaleModifier);
                cameraWidth = ct.roomWidth;
                cameraHeight = ct.roomHeight;
            }
        }

        ct.pixiApp.renderer.resize(canvasWidth, canvasHeight);
        if (mode !== 'scaleFill' && mode !== 'scaleFit') {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier;
        } else {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier * k;
        }
        canv.style.width = Math.ceil(canvasWidth / pixelScaleModifier) + 'px';
        canv.style.height = Math.ceil(canvasHeight / pixelScaleModifier) + 'px';
        if (ct.camera) {
            ct.camera.width = cameraWidth;
            ct.camera.height = cameraHeight;
        }
        positionCanvas(mode, k);
    };
    var toggleFullscreen = function () {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow();
            win.setFullScreen(!win.isFullScreen());
            return;
        } catch (e) {
            void e; // Continue with web approach
        }
        var canvas = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement,
            requester = document.getElementById('ct'),
            request = requester.requestFullscreen ||
                      requester.webkitRequestFullscreen ||
                      requester.mozRequestFullScreen ||
                      requester.msRequestFullscreen,
            exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (!canvas) {
            var promise = request.call(requester);
            if (promise) {
                promise
                .catch(function fullscreenError(err) {
                    console.error('[ct.fittoscreen]', err);
                });
            }
        } else if (exit) {
            exit.call(document);
        }
    };
    var queuedFullscreen = function queuedFullscreen() {
        toggleFullscreen();
        document.removeEventListener('mouseup', queuedFullscreen);
        document.removeEventListener('keyup', queuedFullscreen);
        document.removeEventListener('click', queuedFullscreen);
    };
    var queueFullscreen = function queueFullscreen() {
        document.addEventListener('mouseup', queuedFullscreen);
        document.addEventListener('keyup', queuedFullscreen);
        document.addEventListener('click', queuedFullscreen);
    };
    window.addEventListener('resize', resize);
    ct.fittoscreen = resize;
    ct.fittoscreen.toggleFullscreen = queueFullscreen;
    var $mode = 'scaleFit';
    Object.defineProperty(ct.fittoscreen, 'mode', {
        configurable: false,
        enumerable: true,
        set(value) {
            $mode = value;
        },
        get() {
            return $mode;
        }
    });
    ct.fittoscreen.mode = $mode;
    ct.fittoscreen.getIsFullscreen = function getIsFullscreen() {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow;
            return win.isFullScreen;
        } catch (e) {
            void e; // Continue with web approach
        }
        return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
    };
})(ct);

(function mountCtPointer(ct) {
    const keyPrefix = 'pointer.';
    const setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    const getKey = function (key) {
        return ct.inputs.registry[keyPrefix + key];
    };
    const buttonMappings = {
        Primary: 1,
        Middle: 4,
        Secondary: 2,
        ExtraOne: 8,
        ExtraTwo: 16,
        Eraser: 32
    };
    var lastPanNum = 0,
        lastPanX = 0,
        lastPanY = 0,
        lastScaleDistance = 0,
        lastAngle = 0;

    // updates Action system's input methods for singular, double and triple pointers
    var countPointers = () => {
        setKey('Any', ct.pointer.down.length > 0 ? 1 : 0);
        setKey('Double', ct.pointer.down.length > 1 ? 1 : 0);
        setKey('Triple', ct.pointer.down.length > 2 ? 1 : 0);
    };
    // returns a new object with the necessary information about a pointer event
    var copyPointer = e => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        const pointer = {
            id: e.pointerId,
            x: positionGame.x,
            y: positionGame.y,
            clientX: e.clientX,
            clientY: e.clientY,
            xui: xui,
            yui: yui,
            xprev: positionGame.x,
            yprev: positionGame.y,
            buttons: e.buttons,
            xuiprev: xui,
            yuiprev: yui,
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            type: e.pointerType,
            width: e.width / rect.width * ct.camera.width,
            height: e.height / rect.height * ct.camera.height
        };
        return pointer;
    };
    var updatePointer = (pointer, e) => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        Object.assign(pointer, {
            x: positionGame.x,
            y: positionGame.y,
            xui: xui,
            yui: yui,
            clientX: e.clientX,
            clientY: e.clientY,
            pressure: e.pressure,
            buttons: e.buttons,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            width: e.width / rect.width * ct.camera.width,
            height: e.height / rect.height * ct.camera.height
        });
    };
    var writePrimary = function (pointer) {
        Object.assign(ct.pointer, {
            x: pointer.x,
            y: pointer.y,
            xui: pointer.xui,
            yui: pointer.yui,
            pressure: pointer.pressure,
            buttons: pointer.buttons,
            tiltX: pointer.tiltX,
            tiltY: pointer.tiltY,
            twist: pointer.twist
        });
    };

    var handleHoverStart = function (e) {
        const pointer = copyPointer(e);
        ct.pointer.hover.push(pointer);
        if (e.isPrimary) {
            writePrimary(pointer);
        }
    };
    var handleHoverEnd = function (e) {
        const pointer = ct.pointer.hover.find(p => p.id === e.pointerId);
        if (pointer) {
            pointer.invalid = true;
            ct.pointer.hover.splice(ct.pointer.hover.indexOf(pointer), 1);
        }
        // Handles mouse pointers that were dragged out of the ct.js frame while pressing,
        // as they don't trigger pointercancel or such
        const downId = ct.pointer.down.findIndex(p => p.id === e.pointerId);
        if (downId !== -1) {
            ct.pointer.down.splice(downId, 1);
        }
    };
    var handleMove = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        let pointerHover = ct.pointer.hover.find(p => p.id === e.pointerId);
        if (!pointerHover) {
            // Catches hover events that started before the game has loaded
            handleHoverStart(e);
            pointerHover = ct.pointer.hover.find(p => p.id === e.pointerId);
        }
        const pointerDown = ct.pointer.down.find(p => p.id === e.pointerId);
        if (!pointerHover && !pointerDown) {
            return;
        }
        if (pointerHover) {
            updatePointer(pointerHover, e);
        }
        if (pointerDown) {
            updatePointer(pointerDown, e);
        }
        if (e.isPrimary) {
            writePrimary(pointerHover || pointerDown);
        }
    };
    var handleDown = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        ct.pointer.type = e.pointerType;
        const pointer = copyPointer(e);
        ct.pointer.down.push(pointer);
        countPointers();
        if (e.isPrimary) {
            writePrimary(pointer);
        }
    };
    var handleUp = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        const pointer = ct.pointer.down.find(p => p.id === e.pointerId);
        if (pointer) {
            ct.pointer.released.push(pointer);
        }
        if (ct.pointer.down.indexOf(pointer) !== -1) {
            ct.pointer.down.splice(ct.pointer.down.indexOf(pointer), 1);
        }
        countPointers();
    };
    var handleWheel = function handleWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        if (![false][0]) {
            e.preventDefault();
        }
    };

    let locking = false;
    const genericCollisionCheck = function genericCollisionCheck(
        copy,
        specificPointer,
        set,
        uiSpace
    ) {
        if (locking) {
            return false;
        }
        for (const pointer of set) {
            if (specificPointer && pointer.id !== specificPointer.id) {
                continue;
            }
            if (ct.place.collide(copy, {
                x: uiSpace ? pointer.xui : pointer.x,
                y: uiSpace ? pointer.yui : pointer.y,
                scale: {
                    x: 1,
                    y: 1
                },
                angle: 0,
                shape: {
                    type: 'rect',
                    top: pointer.height / 2,
                    bottom: pointer.height / 2,
                    left: pointer.width / 2,
                    right: pointer.width / 2
                }
            })) {
                return pointer;
            }
        }
        return false;
    };
    // Triggers on every mouse press event to capture pointer after it was released by a user,
    // e.g. after the window was blurred
    const pointerCapturer = function pointerCapturer() {
        if (!document.pointerLockElement && !document.mozPointerLockElement) {
            const request = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            request.apply(document.body);
        }
    };
    const capturedPointerMove = function capturedPointerMove(e) {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const dx = e.movementX / rect.width * ct.camera.width,
              dy = e.movementY / rect.height * ct.camera.height;
        ct.pointer.xlocked += dx;
        ct.pointer.ylocked += dy;
        ct.pointer.xmovement = dx;
        ct.pointer.ymovement = dy;
    };

    ct.pointer = {
        setupListeners() {
            document.addEventListener('pointerenter', handleHoverStart, false);
            document.addEventListener('pointerout', handleHoverEnd, false);
            document.addEventListener('pointerleave', handleHoverEnd, false);
            document.addEventListener('pointerdown', handleDown, false);
            document.addEventListener('pointerup', handleUp, false);
            document.addEventListener('pointercancel', handleUp, false);
            document.addEventListener('pointermove', handleMove, false);
            document.addEventListener('wheel', handleWheel, {
                passive: false
            });
            document.addEventListener('DOMMouseScroll', handleWheel, {
                passive: false
            });
            document.addEventListener('contextmenu', e => {
                if (![false][0]) {
                    e.preventDefault();
                }
            });
        },
        hover: [],
        down: [],
        released: [],
        x: 0,
        y: 0,
        xprev: 0,
        yprev: 0,
        xui: 0,
        yui: 0,
        xuiprev: 0,
        yuiprev: 0,
        xlocked: 0,
        ylocked: 0,
        xmovement: 0,
        ymovement: 0,
        pressure: 1,
        buttons: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        width: 1,
        height: 1,
        type: null,
        clear() {
            ct.pointer.down.length = 0;
            ct.pointer.hover.length = 0;
            ct.pointer.clearReleased();
            countPointers();
        },
        clearReleased() {
            ct.pointer.released.length = 0;
        },
        collides(copy, pointer, checkReleased) {
            var set = checkReleased ? ct.pointer.released : ct.pointer.down;
            return genericCollisionCheck(copy, pointer, set, false);
        },
        collidesUi(copy, pointer, checkReleased) {
            var set = checkReleased ? ct.pointer.released : ct.pointer.down;
            return genericCollisionCheck(copy, pointer, set, true);
        },
        hovers(copy, pointer) {
            return genericCollisionCheck(copy, pointer, ct.pointer.hover, false);
        },
        hoversUi(copy, pointer) {
            return genericCollisionCheck(copy, pointer, ct.pointer.hover, true);
        },
        isButtonPressed(button, pointer) {
            if (!pointer) {
                return Boolean(getKey(button));
            }
            // eslint-disable-next-line no-bitwise
            return (pointer.buttons & buttonMappings[button]) === button ? 1 : 0;
        },
        updateGestures() {
            let x = 0,
                y = 0;
            const rect = ct.pixiApp.view.getBoundingClientRect();
            // Get the middle point of all the pointers
            for (const event of ct.pointer.down) {
                x += (event.clientX - rect.left) / rect.width;
                y += (event.clientY - rect.top) / rect.height;
            }
            x /= ct.pointer.down.length;
            y /= ct.pointer.down.length;

            let angle = 0,
                distance = lastScaleDistance;
            if (ct.pointer.down.length > 1) {
                const events = [
                    ct.pointer.down[0],
                    ct.pointer.down[1]
                ].sort((a, b) => a.id - b.id);
                angle = ct.u.pdn(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
                distance = ct.u.pdc(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
            }
            if (lastPanNum === ct.pointer.down.length) {
                if (ct.pointer.down.length > 1) {
                    setKey('DeltaRotation', (ct.u.degToRad(ct.u.deltaDir(lastAngle, angle))));
                    setKey('DeltaPinch', distance / lastScaleDistance - 1);
                } else {
                    setKey('DeltaPinch', 0);
                    setKey('DeltaRotation', 0);
                }
                if (!ct.pointer.down.length) {
                    setKey('PanX', 0);
                    setKey('PanY', 0);
                } else {
                    setKey('PanX', x - lastPanX);
                    setKey('PanY', y - lastPanY);
                }
            } else {
                // skip gesture updates to avoid shaking on new presses
                lastPanNum = ct.pointer.down.length;
                setKey('DeltaPinch', 0);
                setKey('DeltaRotation', 0);
                setKey('PanX', 0);
                setKey('PanY', 0);
            }
            lastPanX = x;
            lastPanY = y;
            lastAngle = angle;
            lastScaleDistance = distance;

            for (const button in buttonMappings) {
                setKey(button, 0);
                for (const pointer of ct.pointer.down) {
                    // eslint-disable-next-line no-bitwise
                    if ((pointer.buttons & buttonMappings[button]) === buttonMappings[button]) {
                        setKey(button, 1);
                    }
                }
            }
        },
        lock() {
            if (locking) {
                return;
            }
            locking = true;
            ct.pointer.xlocked = ct.pointer.xui;
            ct.pointer.ylocked = ct.pointer.yui;
            const request = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            request.apply(document.body);
            document.addEventListener('click', pointerCapturer);
            document.addEventListener('pointermove', capturedPointerMove);
        },
        unlock() {
            if (!locking) {
                return;
            }
            locking = false;
            if (document.pointerLockElement || document.mozPointerLockElement) {
                (document.exitPointerLock || document.mozExitPointerLock)();
            }
            document.removeEventListener('click', pointerCapturer);
            document.removeEventListener('pointermove', capturedPointerMove);
        },
        get locked() {
            // Do not return the Document object
            return Boolean(document.pointerLockElement || document.mozPointerLockElement);
        }
    };
    setKey('Wheel', 0);
    if ([false][0]) {
        ct.pointer.lock();
    }
})(ct);

(function ctKeyboard() {
    var keyPrefix = 'keyboard.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };

    ct.keyboard = {
        string: '',
        lastKey: '',
        lastCode: '',
        alt: false,
        shift: false,
        ctrl: false,
        clear() {
            delete ct.keyboard.lastKey;
            delete ct.keyboard.lastCode;
            ct.keyboard.string = '';
            ct.keyboard.alt = false;
            ct.keyboard.shift = false;
            ct.keyboard.ctrl = false;
        },
        check: [],
        onDown(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            ct.keyboard.lastKey = e.key;
            ct.keyboard.lastCode = e.code;
            if (e.code) {
                setKey(e.code, 1);
            } else {
                setKey('Unknown', 1);
            }
            if (e.key) {
                if (e.key.length === 1) {
                    ct.keyboard.string += e.key;
                } else if (e.key === 'Backspace') {
                    ct.keyboard.string = ct.keyboard.string.slice(0, -1);
                } else if (e.key === 'Enter') {
                    ct.keyboard.string = '';
                }
            }
            e.preventDefault();
        },
        onUp(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            if (e.code) {
                setKey(e.code, 0);
            } else {
                setKey('Unknown', 0);
            }
            e.preventDefault();
        }
    };

    if (document.addEventListener) {
        document.addEventListener('keydown', ct.keyboard.onDown, false);
        document.addEventListener('keyup', ct.keyboard.onUp, false);
    } else {
        document.attachEvent('onkeydown', ct.keyboard.onDown);
        document.attachEvent('onkeyup', ct.keyboard.onUp);
    }
})();

(function(global) {
    'use strict';
  
    var nativeKeyboardEvent = ('KeyboardEvent' in global);
    if (!nativeKeyboardEvent)
      global.KeyboardEvent = function KeyboardEvent() { throw TypeError('Illegal constructor'); };
  
    [
      ['DOM_KEY_LOCATION_STANDARD', 0x00], // Default or unknown location
      ['DOM_KEY_LOCATION_LEFT', 0x01], // e.g. Left Alt key
      ['DOM_KEY_LOCATION_RIGHT', 0x02], // e.g. Right Alt key
      ['DOM_KEY_LOCATION_NUMPAD', 0x03], // e.g. Numpad 0 or +
    ].forEach(function(p) { if (!(p[0] in global.KeyboardEvent)) global.KeyboardEvent[p[0]] = p[1]; });
  
    var STANDARD = global.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
        LEFT = global.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        RIGHT = global.KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
        NUMPAD = global.KeyboardEvent.DOM_KEY_LOCATION_NUMPAD;
  
    //--------------------------------------------------------------------
    //
    // Utilities
    //
    //--------------------------------------------------------------------
  
    function contains(s, ss) { return String(s).indexOf(ss) !== -1; }
  
    var os = (function() {
      if (contains(navigator.platform, 'Win')) { return 'win'; }
      if (contains(navigator.platform, 'Mac')) { return 'mac'; }
      if (contains(navigator.platform, 'CrOS')) { return 'cros'; }
      if (contains(navigator.platform, 'Linux')) { return 'linux'; }
      if (contains(navigator.userAgent, 'iPad') || contains(navigator.platform, 'iPod') || contains(navigator.platform, 'iPhone')) { return 'ios'; }
      return '';
    } ());
  
    var browser = (function() {
      if (contains(navigator.userAgent, 'Chrome/')) { return 'chrome'; }
      if (contains(navigator.vendor, 'Apple')) { return 'safari'; }
      if (contains(navigator.userAgent, 'MSIE')) { return 'ie'; }
      if (contains(navigator.userAgent, 'Gecko/')) { return 'moz'; }
      if (contains(navigator.userAgent, 'Opera/')) { return 'opera'; }
      return '';
    } ());
  
    var browser_os = browser + '-' + os;
  
    function mergeIf(baseTable, select, table) {
      if (browser_os === select || browser === select || os === select) {
        Object.keys(table).forEach(function(keyCode) {
          baseTable[keyCode] = table[keyCode];
        });
      }
    }
  
    function remap(o, key) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        var item = o[k];
        if (key in item) {
          r[item[key]] = item;
        }
      });
      return r;
    }
  
    function invert(o) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        r[o[k]] = k;
      });
      return r;
    }
  
    //--------------------------------------------------------------------
    //
    // Generic Mappings
    //
    //--------------------------------------------------------------------
  
    // "keyInfo" is a dictionary:
    //   code: string - name from UI Events KeyboardEvent code Values
    //     https://w3c.github.io/uievents-code/
    //   location (optional): number - one of the DOM_KEY_LOCATION values
    //   keyCap (optional): string - keyboard label in en-US locale
    // USB code Usage ID from page 0x07 unless otherwise noted (Informative)
  
    // Map of keyCode to keyInfo
    var keyCodeToInfoTable = {
      // 0x01 - VK_LBUTTON
      // 0x02 - VK_RBUTTON
      0x03: { code: 'Cancel' }, // [USB: 0x9b] char \x0018 ??? (Not in D3E)
      // 0x04 - VK_MBUTTON
      // 0x05 - VK_XBUTTON1
      // 0x06 - VK_XBUTTON2
      0x06: { code: 'Help' }, // [USB: 0x75] ???
      // 0x07 - undefined
      0x08: { code: 'Backspace' }, // [USB: 0x2a] Labelled Delete on Macintosh keyboards.
      0x09: { code: 'Tab' }, // [USB: 0x2b]
      // 0x0A-0x0B - reserved
      0X0C: { code: 'Clear' }, // [USB: 0x9c] NumPad Center (Not in D3E)
      0X0D: { code: 'Enter' }, // [USB: 0x28]
      // 0x0E-0x0F - undefined
  
      0x10: { code: 'Shift' },
      0x11: { code: 'Control' },
      0x12: { code: 'Alt' },
      0x13: { code: 'Pause' }, // [USB: 0x48]
      0x14: { code: 'CapsLock' }, // [USB: 0x39]
      0x15: { code: 'KanaMode' }, // [USB: 0x88]
      0x16: { code: 'Lang1' }, // [USB: 0x90]
      // 0x17: VK_JUNJA
      // 0x18: VK_FINAL
      0x19: { code: 'Lang2' }, // [USB: 0x91]
      // 0x1A - undefined
      0x1B: { code: 'Escape' }, // [USB: 0x29]
      0x1C: { code: 'Convert' }, // [USB: 0x8a]
      0x1D: { code: 'NonConvert' }, // [USB: 0x8b]
      0x1E: { code: 'Accept' }, // [USB: ????]
      0x1F: { code: 'ModeChange' }, // [USB: ????]
  
      0x20: { code: 'Space' }, // [USB: 0x2c]
      0x21: { code: 'PageUp' }, // [USB: 0x4b]
      0x22: { code: 'PageDown' }, // [USB: 0x4e]
      0x23: { code: 'End' }, // [USB: 0x4d]
      0x24: { code: 'Home' }, // [USB: 0x4a]
      0x25: { code: 'ArrowLeft' }, // [USB: 0x50]
      0x26: { code: 'ArrowUp' }, // [USB: 0x52]
      0x27: { code: 'ArrowRight' }, // [USB: 0x4f]
      0x28: { code: 'ArrowDown' }, // [USB: 0x51]
      0x29: { code: 'Select' }, // (Not in D3E)
      0x2A: { code: 'Print' }, // (Not in D3E)
      0x2B: { code: 'Execute' }, // [USB: 0x74] (Not in D3E)
      0x2C: { code: 'PrintScreen' }, // [USB: 0x46]
      0x2D: { code: 'Insert' }, // [USB: 0x49]
      0x2E: { code: 'Delete' }, // [USB: 0x4c]
      0x2F: { code: 'Help' }, // [USB: 0x75] ???
  
      0x30: { code: 'Digit0', keyCap: '0' }, // [USB: 0x27] 0)
      0x31: { code: 'Digit1', keyCap: '1' }, // [USB: 0x1e] 1!
      0x32: { code: 'Digit2', keyCap: '2' }, // [USB: 0x1f] 2@
      0x33: { code: 'Digit3', keyCap: '3' }, // [USB: 0x20] 3#
      0x34: { code: 'Digit4', keyCap: '4' }, // [USB: 0x21] 4$
      0x35: { code: 'Digit5', keyCap: '5' }, // [USB: 0x22] 5%
      0x36: { code: 'Digit6', keyCap: '6' }, // [USB: 0x23] 6^
      0x37: { code: 'Digit7', keyCap: '7' }, // [USB: 0x24] 7&
      0x38: { code: 'Digit8', keyCap: '8' }, // [USB: 0x25] 8*
      0x39: { code: 'Digit9', keyCap: '9' }, // [USB: 0x26] 9(
      // 0x3A-0x40 - undefined
  
      0x41: { code: 'KeyA', keyCap: 'a' }, // [USB: 0x04]
      0x42: { code: 'KeyB', keyCap: 'b' }, // [USB: 0x05]
      0x43: { code: 'KeyC', keyCap: 'c' }, // [USB: 0x06]
      0x44: { code: 'KeyD', keyCap: 'd' }, // [USB: 0x07]
      0x45: { code: 'KeyE', keyCap: 'e' }, // [USB: 0x08]
      0x46: { code: 'KeyF', keyCap: 'f' }, // [USB: 0x09]
      0x47: { code: 'KeyG', keyCap: 'g' }, // [USB: 0x0a]
      0x48: { code: 'KeyH', keyCap: 'h' }, // [USB: 0x0b]
      0x49: { code: 'KeyI', keyCap: 'i' }, // [USB: 0x0c]
      0x4A: { code: 'KeyJ', keyCap: 'j' }, // [USB: 0x0d]
      0x4B: { code: 'KeyK', keyCap: 'k' }, // [USB: 0x0e]
      0x4C: { code: 'KeyL', keyCap: 'l' }, // [USB: 0x0f]
      0x4D: { code: 'KeyM', keyCap: 'm' }, // [USB: 0x10]
      0x4E: { code: 'KeyN', keyCap: 'n' }, // [USB: 0x11]
      0x4F: { code: 'KeyO', keyCap: 'o' }, // [USB: 0x12]
  
      0x50: { code: 'KeyP', keyCap: 'p' }, // [USB: 0x13]
      0x51: { code: 'KeyQ', keyCap: 'q' }, // [USB: 0x14]
      0x52: { code: 'KeyR', keyCap: 'r' }, // [USB: 0x15]
      0x53: { code: 'KeyS', keyCap: 's' }, // [USB: 0x16]
      0x54: { code: 'KeyT', keyCap: 't' }, // [USB: 0x17]
      0x55: { code: 'KeyU', keyCap: 'u' }, // [USB: 0x18]
      0x56: { code: 'KeyV', keyCap: 'v' }, // [USB: 0x19]
      0x57: { code: 'KeyW', keyCap: 'w' }, // [USB: 0x1a]
      0x58: { code: 'KeyX', keyCap: 'x' }, // [USB: 0x1b]
      0x59: { code: 'KeyY', keyCap: 'y' }, // [USB: 0x1c]
      0x5A: { code: 'KeyZ', keyCap: 'z' }, // [USB: 0x1d]
      0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
      0x5C: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
      0x5D: { code: 'ContextMenu' }, // [USB: 0x65] Context Menu
      // 0x5E - reserved
      0x5F: { code: 'Standby' }, // [USB: 0x82] Sleep
  
      0x60: { code: 'Numpad0', keyCap: '0', location: NUMPAD }, // [USB: 0x62]
      0x61: { code: 'Numpad1', keyCap: '1', location: NUMPAD }, // [USB: 0x59]
      0x62: { code: 'Numpad2', keyCap: '2', location: NUMPAD }, // [USB: 0x5a]
      0x63: { code: 'Numpad3', keyCap: '3', location: NUMPAD }, // [USB: 0x5b]
      0x64: { code: 'Numpad4', keyCap: '4', location: NUMPAD }, // [USB: 0x5c]
      0x65: { code: 'Numpad5', keyCap: '5', location: NUMPAD }, // [USB: 0x5d]
      0x66: { code: 'Numpad6', keyCap: '6', location: NUMPAD }, // [USB: 0x5e]
      0x67: { code: 'Numpad7', keyCap: '7', location: NUMPAD }, // [USB: 0x5f]
      0x68: { code: 'Numpad8', keyCap: '8', location: NUMPAD }, // [USB: 0x60]
      0x69: { code: 'Numpad9', keyCap: '9', location: NUMPAD }, // [USB: 0x61]
      0x6A: { code: 'NumpadMultiply', keyCap: '*', location: NUMPAD }, // [USB: 0x55]
      0x6B: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
      0x6C: { code: 'NumpadComma', keyCap: ',', location: NUMPAD }, // [USB: 0x85]
      0x6D: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD }, // [USB: 0x56]
      0x6E: { code: 'NumpadDecimal', keyCap: '.', location: NUMPAD }, // [USB: 0x63]
      0x6F: { code: 'NumpadDivide', keyCap: '/', location: NUMPAD }, // [USB: 0x54]
  
      0x70: { code: 'F1' }, // [USB: 0x3a]
      0x71: { code: 'F2' }, // [USB: 0x3b]
      0x72: { code: 'F3' }, // [USB: 0x3c]
      0x73: { code: 'F4' }, // [USB: 0x3d]
      0x74: { code: 'F5' }, // [USB: 0x3e]
      0x75: { code: 'F6' }, // [USB: 0x3f]
      0x76: { code: 'F7' }, // [USB: 0x40]
      0x77: { code: 'F8' }, // [USB: 0x41]
      0x78: { code: 'F9' }, // [USB: 0x42]
      0x79: { code: 'F10' }, // [USB: 0x43]
      0x7A: { code: 'F11' }, // [USB: 0x44]
      0x7B: { code: 'F12' }, // [USB: 0x45]
      0x7C: { code: 'F13' }, // [USB: 0x68]
      0x7D: { code: 'F14' }, // [USB: 0x69]
      0x7E: { code: 'F15' }, // [USB: 0x6a]
      0x7F: { code: 'F16' }, // [USB: 0x6b]
  
      0x80: { code: 'F17' }, // [USB: 0x6c]
      0x81: { code: 'F18' }, // [USB: 0x6d]
      0x82: { code: 'F19' }, // [USB: 0x6e]
      0x83: { code: 'F20' }, // [USB: 0x6f]
      0x84: { code: 'F21' }, // [USB: 0x70]
      0x85: { code: 'F22' }, // [USB: 0x71]
      0x86: { code: 'F23' }, // [USB: 0x72]
      0x87: { code: 'F24' }, // [USB: 0x73]
      // 0x88-0x8F - unassigned
  
      0x90: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0x91: { code: 'ScrollLock' }, // [USB: 0x47]
      // 0x92-0x96 - OEM specific
      // 0x97-0x9F - unassigned
  
      // NOTE: 0xA0-0xA5 usually mapped to 0x10-0x12 in browsers
      0xA0: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0xA1: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0xA2: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0xA3: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0xA4: { code: 'AltLeft', location: LEFT }, // [USB: 0xe2]
      0xA5: { code: 'AltRight', location: RIGHT }, // [USB: 0xe6]
  
      0xA6: { code: 'BrowserBack' }, // [USB: 0x0c/0x0224]
      0xA7: { code: 'BrowserForward' }, // [USB: 0x0c/0x0225]
      0xA8: { code: 'BrowserRefresh' }, // [USB: 0x0c/0x0227]
      0xA9: { code: 'BrowserStop' }, // [USB: 0x0c/0x0226]
      0xAA: { code: 'BrowserSearch' }, // [USB: 0x0c/0x0221]
      0xAB: { code: 'BrowserFavorites' }, // [USB: 0x0c/0x0228]
      0xAC: { code: 'BrowserHome' }, // [USB: 0x0c/0x0222]
      0xAD: { code: 'AudioVolumeMute' }, // [USB: 0x7f]
      0xAE: { code: 'AudioVolumeDown' }, // [USB: 0x81]
      0xAF: { code: 'AudioVolumeUp' }, // [USB: 0x80]
  
      0xB0: { code: 'MediaTrackNext' }, // [USB: 0x0c/0x00b5]
      0xB1: { code: 'MediaTrackPrevious' }, // [USB: 0x0c/0x00b6]
      0xB2: { code: 'MediaStop' }, // [USB: 0x0c/0x00b7]
      0xB3: { code: 'MediaPlayPause' }, // [USB: 0x0c/0x00cd]
      0xB4: { code: 'LaunchMail' }, // [USB: 0x0c/0x018a]
      0xB5: { code: 'MediaSelect' },
      0xB6: { code: 'LaunchApp1' },
      0xB7: { code: 'LaunchApp2' },
      // 0xB8-0xB9 - reserved
      0xBA: { code: 'Semicolon',  keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
      0xBB: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
      0xBC: { code: 'Comma', keyCap: ',' }, // [USB: 0x36] ,<
      0xBD: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
      0xBE: { code: 'Period', keyCap: '.' }, // [USB: 0x37] .>
      0xBF: { code: 'Slash', keyCap: '/' }, // [USB: 0x38] /? (US Standard 101)
  
      0xC0: { code: 'Backquote', keyCap: '`' }, // [USB: 0x35] `~ (US Standard 101)
      // 0xC1-0xCF - reserved
  
      // 0xD0-0xD7 - reserved
      // 0xD8-0xDA - unassigned
      0xDB: { code: 'BracketLeft', keyCap: '[' }, // [USB: 0x2f] [{ (US Standard 101)
      0xDC: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
      0xDD: { code: 'BracketRight', keyCap: ']' }, // [USB: 0x30] ]} (US Standard 101)
      0xDE: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
      // 0xDF - miscellaneous/varies
  
      // 0xE0 - reserved
      // 0xE1 - OEM specific
      0xE2: { code: 'IntlBackslash',  keyCap: '\\' }, // [USB: 0x64] \| (UK Standard 102)
      // 0xE3-0xE4 - OEM specific
      0xE5: { code: 'Process' }, // (Not in D3E)
      // 0xE6 - OEM specific
      // 0xE7 - VK_PACKET
      // 0xE8 - unassigned
      // 0xE9-0xEF - OEM specific
  
      // 0xF0-0xF5 - OEM specific
      0xF6: { code: 'Attn' }, // [USB: 0x9a] (Not in D3E)
      0xF7: { code: 'CrSel' }, // [USB: 0xa3] (Not in D3E)
      0xF8: { code: 'ExSel' }, // [USB: 0xa4] (Not in D3E)
      0xF9: { code: 'EraseEof' }, // (Not in D3E)
      0xFA: { code: 'Play' }, // (Not in D3E)
      0xFB: { code: 'ZoomToggle' }, // (Not in D3E)
      // 0xFC - VK_NONAME - reserved
      // 0xFD - VK_PA1
      0xFE: { code: 'Clear' } // [USB: 0x9c] (Not in D3E)
    };
  
    // No legacy keyCode, but listed in D3E:
  
    // code: usb
    // 'IntlHash': 0x070032,
    // 'IntlRo': 0x070087,
    // 'IntlYen': 0x070089,
    // 'NumpadBackspace': 0x0700bb,
    // 'NumpadClear': 0x0700d8,
    // 'NumpadClearEntry': 0x0700d9,
    // 'NumpadMemoryAdd': 0x0700d3,
    // 'NumpadMemoryClear': 0x0700d2,
    // 'NumpadMemoryRecall': 0x0700d1,
    // 'NumpadMemoryStore': 0x0700d0,
    // 'NumpadMemorySubtract': 0x0700d4,
    // 'NumpadParenLeft': 0x0700b6,
    // 'NumpadParenRight': 0x0700b7,
  
    //--------------------------------------------------------------------
    //
    // Browser/OS Specific Mappings
    //
    //--------------------------------------------------------------------
  
    mergeIf(keyCodeToInfoTable,
            'moz', {
              0x3B: { code: 'Semicolon', keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
              0x3D: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6B: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6D: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
              0xBB: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
              0xBD: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD } // [USB: 0x56]
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-mac', {
              0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-win', {
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'chrome-mac', {
              0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
            });
  
    // Windows via Bootcamp (!)
    if (0) {
      mergeIf(keyCodeToInfoTable,
              'chrome-win', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
  
      mergeIf(keyCodeToInfoTable,
              'ie', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
    }
  
    mergeIf(keyCodeToInfoTable,
            'safari', {
              0x03: { code: 'Enter' }, // [USB: 0x28] old Safari
              0x19: { code: 'Tab' } // [USB: 0x2b] old Safari for Shift+Tab
            });
  
    mergeIf(keyCodeToInfoTable,
            'ios', {
              0x0A: { code: 'Enter', location: STANDARD } // [USB: 0x28]
            });
  
    mergeIf(keyCodeToInfoTable,
            'safari-mac', {
              0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
              0x5D: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
              0xE5: { code: 'KeyQ', keyCap: 'Q' } // [USB: 0x14] On alternate presses, Ctrl+Q sends this
            });
  
    //--------------------------------------------------------------------
    //
    // Identifier Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send keyIdentifier which can be
    // used to disambiguate keys.
  
    // keyIdentifierTable[keyIdentifier] -> keyInfo
  
    var keyIdentifierTable = {};
    if ('cros' === os) {
      keyIdentifierTable['U+00A0'] = { code: 'ShiftLeft', location: LEFT };
      keyIdentifierTable['U+00A1'] = { code: 'ShiftRight', location: RIGHT };
      keyIdentifierTable['U+00A2'] = { code: 'ControlLeft', location: LEFT };
      keyIdentifierTable['U+00A3'] = { code: 'ControlRight', location: RIGHT };
      keyIdentifierTable['U+00A4'] = { code: 'AltLeft', location: LEFT };
      keyIdentifierTable['U+00A5'] = { code: 'AltRight', location: RIGHT };
    }
    if ('chrome-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('safari-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('ios' === os) {
      // These only generate keyup events
      keyIdentifierTable['U+0010'] = { code: 'Function' };
  
      keyIdentifierTable['U+001C'] = { code: 'ArrowLeft' };
      keyIdentifierTable['U+001D'] = { code: 'ArrowRight' };
      keyIdentifierTable['U+001E'] = { code: 'ArrowUp' };
      keyIdentifierTable['U+001F'] = { code: 'ArrowDown' };
  
      keyIdentifierTable['U+0001'] = { code: 'Home' }; // [USB: 0x4a] Fn + ArrowLeft
      keyIdentifierTable['U+0004'] = { code: 'End' }; // [USB: 0x4d] Fn + ArrowRight
      keyIdentifierTable['U+000B'] = { code: 'PageUp' }; // [USB: 0x4b] Fn + ArrowUp
      keyIdentifierTable['U+000C'] = { code: 'PageDown' }; // [USB: 0x4e] Fn + ArrowDown
    }
  
    //--------------------------------------------------------------------
    //
    // Location Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send location/keyLocation which
    // can be used to disambiguate keys.
  
    // locationTable[location][keyCode] -> keyInfo
    var locationTable = [];
    locationTable[LEFT] = {
      0x10: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0x11: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0x12: { code: 'AltLeft', location: LEFT } // [USB: 0xe2]
    };
    locationTable[RIGHT] = {
      0x10: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0x11: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0x12: { code: 'AltRight', location: RIGHT } // [USB: 0xe6]
    };
    locationTable[NUMPAD] = {
      0x0D: { code: 'NumpadEnter', location: NUMPAD } // [USB: 0x58]
    };
  
    mergeIf(locationTable[NUMPAD], 'moz', {
      0x6D: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0x6B: { code: 'NumpadAdd', location: NUMPAD } // [USB: 0x57]
    });
    mergeIf(locationTable[LEFT], 'moz-mac', {
      0xE0: { code: 'MetaLeft', location: LEFT } // [USB: 0xe3]
    });
    mergeIf(locationTable[RIGHT], 'moz-mac', {
      0xE0: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
    mergeIf(locationTable[RIGHT], 'moz-win', {
      0x5B: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
  
    mergeIf(locationTable[RIGHT], 'mac', {
      0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
    mergeIf(locationTable[NUMPAD], 'chrome-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD } // [USB: 0x53]
    });
  
    mergeIf(locationTable[NUMPAD], 'safari-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0xBB: { code: 'NumpadAdd', location: NUMPAD }, // [USB: 0x57]
      0xBD: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0xBE: { code: 'NumpadDecimal', location: NUMPAD }, // [USB: 0x63]
      0xBF: { code: 'NumpadDivide', location: NUMPAD } // [USB: 0x54]
    });
  
  
    //--------------------------------------------------------------------
    //
    // Key Values
    //
    //--------------------------------------------------------------------
  
    // Mapping from `code` values to `key` values. Values defined at:
    // https://w3c.github.io/uievents-key/
    // Entries are only provided when `key` differs from `code`. If
    // printable, `shiftKey` has the shifted printable character. This
    // assumes US Standard 101 layout
  
    var codeToKeyTable = {
      // Modifier Keys
      ShiftLeft: { key: 'Shift' },
      ShiftRight: { key: 'Shift' },
      ControlLeft: { key: 'Control' },
      ControlRight: { key: 'Control' },
      AltLeft: { key: 'Alt' },
      AltRight: { key: 'Alt' },
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' },
  
      // Whitespace Keys
      NumpadEnter: { key: 'Enter' },
      Space: { key: ' ' },
  
      // Printable Keys
      Digit0: { key: '0', shiftKey: ')' },
      Digit1: { key: '1', shiftKey: '!' },
      Digit2: { key: '2', shiftKey: '@' },
      Digit3: { key: '3', shiftKey: '#' },
      Digit4: { key: '4', shiftKey: '$' },
      Digit5: { key: '5', shiftKey: '%' },
      Digit6: { key: '6', shiftKey: '^' },
      Digit7: { key: '7', shiftKey: '&' },
      Digit8: { key: '8', shiftKey: '*' },
      Digit9: { key: '9', shiftKey: '(' },
      KeyA: { key: 'a', shiftKey: 'A' },
      KeyB: { key: 'b', shiftKey: 'B' },
      KeyC: { key: 'c', shiftKey: 'C' },
      KeyD: { key: 'd', shiftKey: 'D' },
      KeyE: { key: 'e', shiftKey: 'E' },
      KeyF: { key: 'f', shiftKey: 'F' },
      KeyG: { key: 'g', shiftKey: 'G' },
      KeyH: { key: 'h', shiftKey: 'H' },
      KeyI: { key: 'i', shiftKey: 'I' },
      KeyJ: { key: 'j', shiftKey: 'J' },
      KeyK: { key: 'k', shiftKey: 'K' },
      KeyL: { key: 'l', shiftKey: 'L' },
      KeyM: { key: 'm', shiftKey: 'M' },
      KeyN: { key: 'n', shiftKey: 'N' },
      KeyO: { key: 'o', shiftKey: 'O' },
      KeyP: { key: 'p', shiftKey: 'P' },
      KeyQ: { key: 'q', shiftKey: 'Q' },
      KeyR: { key: 'r', shiftKey: 'R' },
      KeyS: { key: 's', shiftKey: 'S' },
      KeyT: { key: 't', shiftKey: 'T' },
      KeyU: { key: 'u', shiftKey: 'U' },
      KeyV: { key: 'v', shiftKey: 'V' },
      KeyW: { key: 'w', shiftKey: 'W' },
      KeyX: { key: 'x', shiftKey: 'X' },
      KeyY: { key: 'y', shiftKey: 'Y' },
      KeyZ: { key: 'z', shiftKey: 'Z' },
      Numpad0: { key: '0' },
      Numpad1: { key: '1' },
      Numpad2: { key: '2' },
      Numpad3: { key: '3' },
      Numpad4: { key: '4' },
      Numpad5: { key: '5' },
      Numpad6: { key: '6' },
      Numpad7: { key: '7' },
      Numpad8: { key: '8' },
      Numpad9: { key: '9' },
      NumpadMultiply: { key: '*' },
      NumpadAdd: { key: '+' },
      NumpadComma: { key: ',' },
      NumpadSubtract: { key: '-' },
      NumpadDecimal: { key: '.' },
      NumpadDivide: { key: '/' },
      Semicolon: { key: ';', shiftKey: ':' },
      Equal: { key: '=', shiftKey: '+' },
      Comma: { key: ',', shiftKey: '<' },
      Minus: { key: '-', shiftKey: '_' },
      Period: { key: '.', shiftKey: '>' },
      Slash: { key: '/', shiftKey: '?' },
      Backquote: { key: '`', shiftKey: '~' },
      BracketLeft: { key: '[', shiftKey: '{' },
      Backslash: { key: '\\', shiftKey: '|' },
      BracketRight: { key: ']', shiftKey: '}' },
      Quote: { key: '\'', shiftKey: '"' },
      IntlBackslash: { key: '\\', shiftKey: '|' }
    };
  
    mergeIf(codeToKeyTable, 'mac', {
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' }
    });
  
    // Corrections for 'key' names in older browsers (e.g. FF36-, IE9, etc)
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.key#Key_values
    var keyFixTable = {
      Add: '+',
      Decimal: '.',
      Divide: '/',
      Subtract: '-',
      Multiply: '*',
      Spacebar: ' ',
      Esc: 'Escape',
      Nonconvert: 'NonConvert',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Menu: 'ContextMenu',
      MediaNextTrack: 'MediaTrackNext',
      MediaPreviousTrack: 'MediaTrackPrevious',
      SelectMedia: 'MediaSelect',
      HalfWidth: 'Hankaku',
      FullWidth: 'Zenkaku',
      RomanCharacters: 'Romaji',
      Crsel: 'CrSel',
      Exsel: 'ExSel',
      Zoom: 'ZoomToggle'
    };
  
    //--------------------------------------------------------------------
    //
    // Exported Functions
    //
    //--------------------------------------------------------------------
  
  
    var codeTable = remap(keyCodeToInfoTable, 'code');
  
    try {
      var nativeLocation = nativeKeyboardEvent && ('location' in new KeyboardEvent(''));
    } catch (_) {}
  
    function keyInfoForEvent(event) {
      var keyCode = 'keyCode' in event ? event.keyCode : 'which' in event ? event.which : 0;
      var keyInfo = (function(){
        if (nativeLocation || 'keyLocation' in event) {
          var location = nativeLocation ? event.location : event.keyLocation;
          if (location && keyCode in locationTable[location]) {
            return locationTable[location][keyCode];
          }
        }
        if ('keyIdentifier' in event && event.keyIdentifier in keyIdentifierTable) {
          return keyIdentifierTable[event.keyIdentifier];
        }
        if (keyCode in keyCodeToInfoTable) {
          return keyCodeToInfoTable[keyCode];
        }
        return null;
      }());
  
      // TODO: Track these down and move to general tables
      if (0) {
        // TODO: Map these for newerish browsers?
        // TODO: iOS only?
        // TODO: Override with more common keyIdentifier name?
        switch (event.keyIdentifier) {
        case 'U+0010': keyInfo = { code: 'Function' }; break;
        case 'U+001C': keyInfo = { code: 'ArrowLeft' }; break;
        case 'U+001D': keyInfo = { code: 'ArrowRight' }; break;
        case 'U+001E': keyInfo = { code: 'ArrowUp' }; break;
        case 'U+001F': keyInfo = { code: 'ArrowDown' }; break;
        }
      }
  
      if (!keyInfo)
        return null;
  
      var key = (function() {
        var entry = codeToKeyTable[keyInfo.code];
        if (!entry) return keyInfo.code;
        return (event.shiftKey && 'shiftKey' in entry) ? entry.shiftKey : entry.key;
      }());
  
      return {
        code: keyInfo.code,
        key: key,
        location: keyInfo.location,
        keyCap: keyInfo.keyCap
      };
    }
  
    function queryKeyCap(code, locale) {
      code = String(code);
      if (!codeTable.hasOwnProperty(code)) return 'Undefined';
      if (locale && String(locale).toLowerCase() !== 'en-us') throw Error('Unsupported locale');
      var keyInfo = codeTable[code];
      return keyInfo.keyCap || keyInfo.code || 'Undefined';
    }
  
    if ('KeyboardEvent' in global && 'defineProperty' in Object) {
      (function() {
        function define(o, p, v) {
          if (p in o) return;
          Object.defineProperty(o, p, v);
        }
  
        define(KeyboardEvent.prototype, 'code', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return keyInfo ? keyInfo.code : '';
        }});
  
        // Fix for nonstandard `key` values (FF36-)
        if ('key' in KeyboardEvent.prototype) {
          var desc = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
          Object.defineProperty(KeyboardEvent.prototype, 'key', { get: function() {
            var key = desc.get.call(this);
            return keyFixTable.hasOwnProperty(key) ? keyFixTable[key] : key;
          }});
        }
  
        define(KeyboardEvent.prototype, 'key', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
        }});
  
        define(KeyboardEvent.prototype, 'location', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
        }});
  
        define(KeyboardEvent.prototype, 'locale', { get: function() {
          return '';
        }});
      }());
    }
  
    if (!('queryKeyCap' in global.KeyboardEvent))
      global.KeyboardEvent.queryKeyCap = queryKeyCap;
  
    // Helper for IE8-
    global.identifyKey = function(event) {
      if ('code' in event)
        return;
  
      var keyInfo = keyInfoForEvent(event);
      event.code = keyInfo ? keyInfo.code : '';
      event.key = (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
      event.location = ('location' in event) ? event.location :
        ('keyLocation' in event) ? event.keyLocation :
        (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
      event.locale = '';
    };
  
  }(self));
  
/* global Howler Howl */
(function ctHowler() {
    ct.sound = {};
    ct.sound.howler = Howler;
    Howler.orientation(0, -1, 0, 0, 0, 1);
    Howler.pos(0, 0, 0);
    ct.sound.howl = Howl;

    var defaultMaxDistance = [][0] || 2500;
    ct.sound.useDepth = [false][0] === void 0 ?
        false :
        [false][0];
    ct.sound.manageListenerPosition = [false][0] === void 0 ?
        true :
        [false][0];

    /**
     * Detects if a particular codec is supported in the system
     * @param {string} type One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav",
     * "aac", "caf", m4a", "mp4", "weba", "webm", "dolby", "flac".
     * @returns {boolean} true/false
     */
    ct.sound.detect = Howler.codecs;

    /**
     * Creates a new Sound object and puts it in resource object
     *
     * @param {string} name Sound's name
     * @param {object} formats A collection of sound files of specified extension,
     * in format `extension: path`
     * @param {string} [formats.ogg] Local path to the sound in ogg format
     * @param {string} [formats.wav] Local path to the sound in wav format
     * @param {string} [formats.mp3] Local path to the sound in mp3 format
     * @param {object} options An options object
     *
     * @returns {object} Sound's object
     */
    ct.sound.init = function init(name, formats, options) {
        options = options || {};
        var sounds = [];
        if (formats.wav && formats.wav.slice(-4) === '.wav') {
            sounds.push(formats.wav);
        }
        if (formats.mp3 && formats.mp3.slice(-4) === '.mp3') {
            sounds.push(formats.mp3);
        }
        if (formats.ogg && formats.ogg.slice(-4) === '.ogg') {
            sounds.push(formats.ogg);
        }
        // Do not use music preferences for ct.js debugger
        var isMusic = !navigator.userAgent.startsWith('ct.js') && options.music;
        var howl = new Howl({
            src: sounds,
            autoplay: false,
            preload: !isMusic,
            html5: isMusic,
            loop: options.loop,
            pool: options.poolSize || 5,

            onload: function () {
                if (!isMusic) {
                    ct.res.soundsLoaded++;
                }
            },
            onloaderror: function () {
                ct.res.soundsError++;
                howl.buggy = true;
                console.error('[ct.sound.howler] Oh no! We couldn\'t load ' +
                    (formats.wav || formats.mp3 || formats.ogg) + '!');
            }
        });
        if (isMusic) {
            ct.res.soundsLoaded++;
        }
        ct.res.sounds[name] = howl;
    };

    var set3Dparameters = (howl, opts, id) => {
        howl.pannerAttr({
            coneInnerAngle: opts.coneInnerAngle || 360,
            coneOuterAngle: opts.coneOuterAngle || 360,
            coneOuterGain: opts.coneOuterGain || 1,
            distanceModel: opts.distanceModel || 'linear',
            maxDistance: opts.maxDistance || defaultMaxDistance,
            refDistance: opts.refDistance || 1,
            rolloffFactor: opts.rolloffFactor || 1,
            panningModel: opts.panningModel || 'HRTF'
        }, id);
    };
    /**
     * Spawns a new sound and plays it.
     *
     * @param {string} name The name of a sound to be played
     * @param {object} [opts] Options object.
     * @param {Function} [cb] A callback, which is called when the sound finishes playing
     *
     * @returns {number} The ID of the created sound. This can be passed to Howler methods.
     */
    ct.sound.spawn = function spawn(name, opts, cb) {
        opts = opts || {};
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        var howl = ct.res.sounds[name];
        var id = howl.play();
        if (opts.loop) {
            howl.loop(true, id);
        }
        if (opts.volume !== void 0) {
            howl.volume(opts.volume, id);
        }
        if (opts.rate !== void 0) {
            howl.rate(opts.rate, id);
        }
        if (opts.x !== void 0 || opts.position) {
            if (opts.x !== void 0) {
                howl.pos(opts.x, opts.y || 0, opts.z || 0, id);
            } else {
                const copy = opts.position;
                howl.pos(copy.x, copy.y, opts.z || (ct.sound.useDepth ? copy.depth : 0), id);
            }
            set3Dparameters(howl, opts, id);
        }
        if (cb) {
            howl.once('end', cb, id);
        }
        return id;
    };

    /**
     * Stops playback of a sound, resetting its time to 0.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.stop = function stop(name, id) {
        if (ct.sound.playing(name, id)) {
            ct.res.sounds[name].stop(id);
        }
    };

    /**
     * Pauses playback of a sound or group, saving the seek of playback.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.pause = function pause(name, id) {
        ct.res.sounds[name].pause(id);
    };

    /**
     * Resumes a given sound, e.g. after pausing it.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.resume = function resume(name, id) {
        ct.res.sounds[name].play(id);
    };
    /**
     * Returns whether a sound is currently playing,
     * either an exact sound (found by its ID) or any sound of a given name.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {boolean} `true` if the sound is playing, `false` otherwise.
     */
    ct.sound.playing = function playing(name, id) {
        return ct.res.sounds[name].playing(id);
    };
    /**
     * Preloads a sound. This is usually applied to music files before playing
     * as they are not preloaded by default.
     *
     * @param {string} name The name of a sound
     * @returns {void}
     */
    ct.sound.load = function load(name) {
        ct.res.sounds[name].load();
    };


    /**
     * Changes/returns the volume of the given sound.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If empty, will return the existing volume.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {number} The current volume of the sound.
     */
    ct.sound.volume = function volume(name, volume, id) {
        return ct.res.sounds[name].volume(volume, id);
    };

    /**
     * Fades a sound to a given volume. Can affect either a specific instance or the whole group.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} newVolume The new volume from `0.0` to `1.0`.
     * @param {number} duration The duration of transition, in milliseconds.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {void}
     */
    ct.sound.fade = function fade(name, newVolume, duration, id) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldVolume = id ? howl.volume(id) : howl.volume;
            try {
                howl.fade(oldVolume, newVolume, duration, id);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Could not reliably fade a sound, reason:', e);
                ct.sound.volume(name, newVolume, id);
            }
        }
    };

    /**
     * Moves the 3D listener to a new position.
     *
     * @see https://github.com/goldfire/howler.js#posx-y-z
     *
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.moveListener = function moveListener(x, y, z) {
        Howler.pos(x, y, z || 0);
    };

    /**
     * Moves a 3D sound to a new location
     *
     * @param {string} name The name of a sound to move
     * @param {number} id The ID of a particular sound.
     * Pass `null` if you want to affect all the sounds of a given name.
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.position = function position(name, id, x, y, z) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldPosition = howl.pos(id);
            howl.pos(x, y, z || oldPosition[2], id);
        }
    };

    /**
     * Get/set the global volume for all sounds, relative to their own volume.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If omitted, will return the current global volume.
     *
     * @returns {number} The current volume.
     */
    ct.sound.globalVolume = Howler.volume.bind(Howler);

    ct.sound.exists = function exists(name) {
        return (name in ct.res.sounds);
    };
})();

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
ct.random = function random(x) {
    return Math.random() * x;
};
ct.u.ext(ct.random, {
    dice(...variants) {
        return variants[Math.floor(Math.random() * variants.length)];
    },
    histogram(...histogram) {
        const coeffs = [...histogram];
        let sumCoeffs = 0;
        for (let i = 0; i < coeffs.length; i++) {
            sumCoeffs += coeffs[i];
            if (i > 0) {
                coeffs[i] += coeffs[i - 1];
            }
        }
        const bucketPosition = Math.random() * sumCoeffs;
        var i;
        for (i = 0; i < coeffs.length; i++) {
            if (coeffs[i] > bucketPosition) {
                break;
            }
        }
        return i / coeffs.length + Math.random() / coeffs.length;
    },
    optimistic(exp) {
        return 1 - ct.random.pessimistic(exp);
    },
    pessimistic(exp) {
        exp = exp || 2;
        return Math.random() ** exp;
    },
    range(x1, x2) {
        return x1 + Math.random() * (x2 - x1);
    },
    deg() {
        return Math.random() * 360;
    },
    coord() {
        return [Math.floor(Math.random() * ct.width), Math.floor(Math.random() * ct.height)];
    },
    chance(x, y) {
        if (y) {
            return (Math.random() * y < x);
        }
        return (Math.random() * 100 < x);
    },
    from(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    // Mulberry32, by bryc from https://stackoverflow.com/a/47593316
    createSeededRandomizer(a) {
        return function seededRandomizer() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
});
{
    const handle = {};
    handle.currentRootRandomizer = ct.random.createSeededRandomizer(456852);
    ct.random.seeded = function seeded() {
        return handle.currentRootRandomizer();
    };
    ct.random.setSeed = function setSeed(seed) {
        handle.currentRootRandomizer = ct.random.createSeededRandomizer(seed);
    };
    ct.random.setSeed(9323846264);
}

(function ctMouse() {
    var keyPrefix = 'mouse.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    var buttonMap = {
        0: 'Left',
        1: 'Middle',
        2: 'Right',
        3: 'Special1',
        4: 'Special2',
        5: 'Special3',
        6: 'Special4',
        7: 'Special5',
        8: 'Special6',
        unknown: 'Unknown'
    };

    ct.mouse = {
        xui: 0,
        yui: 0,
        xprev: 0,
        yprev: 0,
        xuiprev: 0,
        yuiprev: 0,
        inside: false,
        pressed: false,
        down: false,
        released: false,
        button: 0,
        hovers(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.x === copy.x && ct.mouse.y === copy.y;
            }
            return false;
        },
        hoversUi(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.xui === copy.x && ct.mouse.yui === copy.y;
            }
            return false;
        },
        hide() {
            ct.pixiApp.renderer.view.style.cursor = 'none';
        },
        show() {
            ct.pixiApp.renderer.view.style.cursor = '';
        },
        get x() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui).x;
        },
        get y() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui).y;
        }
    };

    ct.mouse.listenerMove = function listenerMove(e) {
        var rect = ct.pixiApp.view.getBoundingClientRect();
        ct.mouse.xui = (e.clientX - rect.left) * ct.camera.width / rect.width;
        ct.mouse.yui = (e.clientY - rect.top) * ct.camera.height / rect.height;
        if (ct.mouse.xui > 0 &&
            ct.mouse.yui > 0 &&
            ct.mouse.yui < ct.camera.height &&
            ct.mouse.xui < ct.camera.width
        ) {
            ct.mouse.inside = true;
        } else {
            ct.mouse.inside = false;
        }
        window.focus();
    };
    ct.mouse.listenerDown = function listenerDown(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 1);
        ct.mouse.pressed = true;
        ct.mouse.down = true;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerUp = function listenerUp(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 0);
        ct.mouse.released = true;
        ct.mouse.down = false;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerContextMenu = function listenerContextMenu(e) {
        e.preventDefault();
    };
    ct.mouse.listenerWheel = function listenerWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        //e.preventDefault();
    };

    ct.mouse.setupListeners = function setupListeners() {
        if (document.addEventListener) {
            document.addEventListener('mousemove', ct.mouse.listenerMove, false);
            document.addEventListener('mouseup', ct.mouse.listenerUp, false);
            document.addEventListener('mousedown', ct.mouse.listenerDown, false);
            document.addEventListener('wheel', ct.mouse.listenerWheel, false, {
                passive: false
            });
            document.addEventListener('contextmenu', ct.mouse.listenerContextMenu, false);
            document.addEventListener('DOMMouseScroll', ct.mouse.listenerWheel, {
                passive: false
            });
        } else { // IE?
            document.attachEvent('onmousemove', ct.mouse.listenerMove);
            document.attachEvent('onmouseup', ct.mouse.listenerUp);
            document.attachEvent('onmousedown', ct.mouse.listenerDown);
            document.attachEvent('onmousewheel', ct.mouse.listenerWheel);
            document.attachEvent('oncontextmenu', ct.mouse.listenerContextMenu);
        }
    };
})();

/* Based on https://pixijs.io/pixi-filters/docs/PIXI.filters */
/* Sandbox demo: https://pixijs.io/pixi-filters/tools/demo/ */

(() => {
  const filters = [
    'Adjustment',
    'AdvancedBloom',
    'Ascii',
    'Bevel',
    'Bloom',
    'BulgePinch',
    'ColorMap',
    'ColorOverlay',
    'ColorReplace',
    'Convolution',
    'CrossHatch',
    'CRT',
    'Dot',
    'DropShadow',
    'Emboss',
    'Glitch',
    'Glow',
    'Godray',
    'KawaseBlur',
    'MotionBlur',
    'MultiColorReplace',
    'OldFilm',
    'Outline',
    'Pixelate',
    'RadialBlur',
    'Reflection',
    'RGBSplit',
    'Shockwave',
    'SimpleLightmap',
    'TiltShift',
    'Twist',
    'ZoomBlur',
    //Built-in filters
    'Alpha',
    'Blur',
    'BlurPass',
    'ColorMatrix',
    'Displacement',
    'FXAA',
    'Noise'
  ];

  const addFilter = (target, fx) => {
    if (!target.filters) {
      target.filters = [fx];
    } else {
      target.filters.push(fx);
    }
    return fx;
  };

  const createFilter = (target, filter, ...args) => {
    let fx;
    let filterName = filter + 'Filter';
    if (filterName === 'BlurPassFilter') {
      filterName = 'BlurFilterPass';
    }
    if (args.length > 0) {
      fx = new PIXI.filters[filterName](...args);
    } else {
      fx = new PIXI.filters[filterName]();
    }
    return addFilter(target, fx);
  };

  ct.filters = {};

  for (const filter of filters) {
    ct.filters['add' + filter] = (target, ...args) =>
      createFilter(target, filter, ...args);
  }

  ct.filters.remove = (target, filter) => {
    for (const f in target.filters) {
      if (target.filters[f] === filter) {
        target.filters.splice(f, 1);
      }
    }
  };

  ct.filters.custom = (target, vertex, fragment, uniforms) => {
    const fx = new PIXI.Filter(vertex, fragment, uniforms);
    return addFilter(target, fx);
  }

})();

/* eslint-disable no-nested-ternary */
/* global CtTimer */

ct.tween = {
    /**
     * Creates a new tween effect and adds it to the game loop
     *
     * @param {Object} options An object with options:
     * @param {Object|Copy} options.obj An object to animate. All objects are supported.
     * @param {Object} options.fields A map with pairs `fieldName: newValue`.
     * Values must be of numerical type.
     * @param {Function} options.curve An interpolating function. You can write your own,
     * or use default ones (see methods in `ct.tween`). The default one is `ct.tween.ease`.
     * @param {Number} options.duration The duration of easing, in milliseconds.
     * @param {Number} options.useUiDelta If true, use ct.deltaUi instead of ct.delta.
     * The default is `false`.
     * @param {boolean} options.silent If true, will not throw errors if the animation
     * was interrupted.
     *
     * @returns {Promise} A promise which is resolved if the effect was fully played,
     * or rejected if it was interrupted manually by code, room switching or instance kill.
     * You can call a `stop()` method on this promise to interrupt it manually.
     */
    add(options) {
        var tween = {
            obj: options.obj,
            fields: options.fields || {},
            curve: options.curve || ct.tween.ease,
            duration: options.duration || 1000,
            timer: new CtTimer(this.duration, false, options.useUiDelta || false)
        };
        var promise = new Promise((resolve, reject) => {
            tween.resolve = resolve;
            tween.reject = reject;
            tween.starting = {};
            for (var field in tween.fields) {
                tween.starting[field] = tween.obj[field] || 0;
            }
            ct.tween.tweens.push(tween);
        });
        if (options.silent) {
            promise.catch(() => void 0);
            tween.timer.catch(() => void 0);
        }
        promise.stop = function stop() {
            tween.reject({
                code: 0,
                info: 'Stopped by game logic',
                from: 'ct.tween'
            });
        };
        return promise;
    },
    /**
     * Linear interpolation.
     * Here and below, these parameters are used:
     *
     * @param {Number} s Starting value
     * @param {Number} d The change of value to transition to, the Delta
     * @param {Number} a The current timing state, 0-1
     * @returns {Number} Interpolated value
     */
    linear(s, d, a) {
        return d * a + s;
    },
    ease(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a + s;
        }
        a--;
        return -d / 2 * (a * (a - 2) - 1) + s;
    },
    easeInQuad(s, d, a) {
        return d * a * a + s;
    },
    easeOutQuad(s, d, a) {
        return -d * a * (a - 2) + s;
    },
    easeInCubic(s, d, a) {
        return d * a * a * a + s;
    },
    easeOutCubic(s, d, a) {
        a--;
        return d * (a * a * a + 1) + s;
    },
    easeInOutCubic(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a * a + s;
        }
        a -= 2;
        return d / 2 * (a * a * a + 2) + s;
    },
    easeInOutQuart(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a * a * a + s;
        }
        a -= 2;
        return -d / 2 * (a * a * a * a - 2) + s;
    },
    easeInQuart(s, d, a) {
        return d * a * a * a * a + s;
    },
    easeOutQuart(s, d, a) {
        a--;
        return -d * (a * a * a * a - 1) + s;
    },
    easeInCirc(s, d, a) {
        return -d * (Math.sqrt(1 - a * a) - 1) + s;
    },
    easeOutCirc(s, d, a) {
        a--;
        return d * Math.sqrt(1 - a * a) + s;
    },
    easeInOutCirc(s, d, a) {
        a *= 2;
        if (a < 1) {
            return -d / 2 * (Math.sqrt(1 - a * a) - 1) + s;
        }
        a -= 2;
        return d / 2 * (Math.sqrt(1 - a * a) + 1) + s;
    },
    easeInBack(s, d, a) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        var x = c3 * a * a * a - c1 * a * a;
        return d * x + s;
    },
    easeOutBack(s, d, a) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        var x = 1 + c3 * (a - 1) ** 3 + c1 * (a - 1) ** 2;
        return d * x + s;
    },
    easeInOutBack(s, d, a) {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        var x = a < 0.5 ?
            ((2 * a) ** 2 * ((c2 + 1) * 2 * a - c2)) / 2 :
            ((2 * a - 2) ** 2 * ((c2 + 1) * (a * 2 - 2) + c2) + 2) / 2;
        return d * x + s;
    },
    easeInElastic(s, d, a) {
        const c4 = (2 * Math.PI) / 3;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                -(2 ** (10 * a - 10)) * Math.sin((a * 10 - 10.75) * c4);
        return d * x + s;
    },
    easeOutElastic(s, d, a) {
        const c4 = (2 * Math.PI) / 3;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                2 ** (-10 * a) * Math.sin((a * 10 - 0.75) * c4) + 1;
        return d * x + s;
    },
    easeInOutElastic(s, d, a) {
        const c5 = (2 * Math.PI) / 4.5;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                a < 0.5 ?
                    -(2 ** (20 * a - 10) * Math.sin((20 * a - 11.125) * c5)) / 2 :
                    (2 ** (-20 * a + 10) * Math.sin((20 * a - 11.125) * c5)) / 2 + 1;
        return d * x + s;
    },
    easeOutBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x;
        if (a < 1 / d1) {
            x = n1 * a * a;
        } else if (a < 2 / d1) {
            x = n1 * (a -= 1.5 / d1) * a + 0.75;
        } else if (a < 2.5 / d1) {
            x = n1 * (a -= 2.25 / d1) * a + 0.9375;
        } else {
            x = n1 * (a -= 2.625 / d1) * a + 0.984375;
        }
        return d * x + s;
    },
    easeInBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x;
        a = 1 - a;
        if (a < 1 / d1) {
            x = n1 * a * a;
        } else if (a < 2 / d1) {
            x = n1 * (a -= 1.5 / d1) * a + 0.75;
        } else if (a < 2.5 / d1) {
            x = n1 * (a -= 2.25 / d1) * a + 0.9375;
        } else {
            x = n1 * (a -= 2.625 / d1) * a + 0.984375;
        }
        return d * (1 - x) + s;
    },
    easeInOutBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x, b;
        if (a < 0.5) {
            b = 1 - 2 * a;
        } else {
            b = 2 * a - 1;
        }
        if (b < 1 / d1) {
            x = n1 * b * b;
        } else if (b < 2 / d1) {
            x = n1 * (b -= 1.5 / d1) * b + 0.75;
        } else if (b < 2.5 / d1) {
            x = n1 * (b -= 2.25 / d1) * b + 0.9375;
        } else {
            x = n1 * (b -= 2.625 / d1) * b + 0.984375;
        }
        if (a < 0.5) {
            x = (1 - b) / 1;
        } else {
            x = (1 + b) / 1;
        }
        return d * x + s;
    },
    tweens: [],
    wait: ct.u.wait
};
ct.tween.easeInOutQuad = ct.tween.ease;

(function ctVkeys() {
    ct.vkeys = {
        button(options) {
            var opts = ct.u.ext({
                key: 'Vk1',
                depth: 100,
                texNormal: -1,
                x: 128,
                y: 128,
                container: ct.room
            }, options || {});
            const copy = ct.templates.copy('VKEY', 0, 0, {
                opts: opts
            }, opts.container);
            if (typeof options.x === 'function' || typeof options.y === 'function') {
                copy.skipRealign = true;
            }
            return copy;
        },
        joystick(options) {
            var opts = ct.u.ext({
                key: 'Vjoy1',
                depth: 100,
                tex: -1,
                trackballTex: -1,
                x: 128,
                y: 128,
                container: ct.room
            }, options || {});
            const copy = ct.templates.copy('VJOYSTICK', 0, 0, {
                opts: opts
            }, opts.container);
            if (typeof options.x === 'function' || typeof options.y === 'function') {
                copy.skipRealign = true;
            }
            return copy;
        }
    };
})();

(function mountCtTouch(ct) {
    var keyPrefix = 'touch.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    var lastPanNum = 0,
        lastPanX = 0,
        lastPanY = 0,
        lastScaleDistance = 0,
        lastAngle = 0;
    // updates Action system's input methods for singular, double and triple touches
    var countTouches = () => {
        setKey('Any', ct.touch.events.length > 0 ? 1 : 0);
        setKey('Double', ct.touch.events.length > 1 ? 1 : 0);
        setKey('Triple', ct.touch.events.length > 2 ? 1 : 0);
    };
    // returns a new object with the necessary information about a touch event
    var copyTouch = e => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        const touch = {
            id: e.identifier,
            x: positionGame.x,
            y: positionGame.y,
            xui: xui,
            yui: yui,
            xprev: positionGame.x,
            yprev: positionGame.y,
            xuiprev: xui,
            yuiprev: yui,
            r: e.radiusX ? Math.max(e.radiusX, e.radiusY) : 0
        };
        return touch;
    };
    var findTouch = id => {
        for (let i = 0; i < ct.touch.events.length; i++) {
            if (ct.touch.events[i].id === id) {
                return ct.touch.events[i];
            }
        }
        return false;
    };
    var findTouchId = id => {
        for (let i = 0; i < ct.touch.events.length; i++) {
            if (ct.touch.events[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    var handleStart = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        for (let i = 0, l = e.changedTouches.length; i < l; i++) {
            var touch = copyTouch(e.changedTouches[i]);
            ct.touch.events.push(touch);
            ct.touch.x = touch.x;
            ct.touch.y = touch.y;
            ct.touch.xui = touch.xui;
            ct.touch.yui = touch.yui;
        }
        countTouches();
    };
    var handleMove = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        for (let i = 0, l = e.changedTouches.length; i < l; i++) {
            const touch = e.changedTouches[i],
                  upd = findTouch(e.changedTouches[i].identifier);
            if (upd) {
                const rect = ct.pixiApp.view.getBoundingClientRect();
                upd.xui = (touch.clientX - rect.left) / rect.width * ct.camera.width;
                upd.yui = (touch.clientY - rect.top) / rect.height * ct.camera.height;
                ({x: upd.x, y: upd.y} = ct.u.uiToGameCoord(upd.xui, upd.yui));
                upd.r = touch.radiusX ? Math.max(touch.radiusX, touch.radiusY) : 0;
                ct.touch.x = upd.x;
                ct.touch.y = upd.y;
                ct.touch.xui = upd.xui;
                ct.touch.yui = upd.yui;
            }
        }
    };
    var handleRelease = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        var touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const ind = findTouchId(touches[i].identifier);
            if (ind !== -1) {
                ct.touch.released.push(ct.touch.events.splice(ind, 1)[0]);
            }
        }
        countTouches();
    };
    var mouseDown = function (e) {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        var touch = {
            id: -1,
            xui: (e.clientX - rect.left) * ct.camera.width / rect.width,
            yui: (e.clientY - rect.top) * ct.camera.height / rect.height,
            r: 0
        };
        ({x: touch.x, y: touch.y} = ct.u.uiToGameCoord(touch.xui, touch.yui));
        ct.touch.events.push(touch);
        ct.touch.x = touch.x;
        ct.touch.y = touch.y;
        ct.touch.xui = touch.xui;
        ct.touch.yui = touch.yui;
        countTouches();
    };
    var mouseMove = function (e) {
        const rect = ct.pixiApp.view.getBoundingClientRect(),
              touch = findTouch(-1);
        if (touch) {
            touch.xui = (e.clientX - rect.left) * ct.camera.width / rect.width;
            touch.yui = (e.clientY - rect.top) * ct.camera.height / rect.height;
            ({x: touch.x, y: touch.y} = ct.u.uiToGameCoord(touch.xui, touch.yui));
            ct.touch.x = touch.x;
            ct.touch.y = touch.y;
            ct.touch.xui = touch.xui;
            ct.touch.yui = touch.yui;
        }
    };
    var mouseUp = function () {
        ct.touch.events = ct.touch.events.filter(x => x.id !== -1);
        countTouches();
    };
    ct.touch = {
        released: [],
        setupListeners() {
            document.addEventListener('touchstart', handleStart, false);
            document.addEventListener('touchstart', () => {
                ct.touch.enabled = true;
            }, {
                once: true
            });
            document.addEventListener('touchend', handleRelease, false);
            document.addEventListener('touchcancel', handleRelease, false);
            document.addEventListener('touchmove', handleMove, false);
        },
        setupMouseListeners() {
            document.addEventListener('mousemove', mouseMove, false);
            document.addEventListener('mouseup', mouseUp, false);
            document.addEventListener('mousedown', mouseDown, false);
        },
        enabled: false,
        events: [],
        x: 0,
        y: 0,
        xprev: 0,
        yprev: 0,
        xui: 0,
        yui: 0,
        xuiprev: 0,
        yuiprev: 0,
        clear() {
            ct.touch.events.length = 0;
            ct.touch.clearReleased();
            countTouches();
        },
        clearReleased() {
            ct.touch.released.length = 0;
        },
        collide(copy, id, rel) {
            var set = rel ? ct.touch.released : ct.touch.events;
            if (id !== void 0 && id !== false) {
                const i = findTouchId(id);
                if (i === -1) {
                    return false;
                }
                return ct.place.collide(copy, {
                    x: set[i].x,
                    y: set[i].y,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                });
            }
            for (let i = 0, l = set.length; i < l; i++) {
                if (ct.place.collide(copy, {
                    x: set[i].x,
                    y: set[i].y,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                })) {
                    return true;
                }
            }
            return false;
        },
        collideUi(copy, id, rel) {
            var set = rel ? ct.touch.released : ct.touch.events;
            if (id !== void 0 && id !== false) {
                const i = findTouchId(id);
                if (i === -1) {
                    return false;
                }
                return ct.place.collide(copy, {
                    x: set[i].xui,
                    y: set[i].yui,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                });
            }
            for (let i = 0, l = set.length; i < l; i++) {
                if (ct.place.collide(copy, {
                    x: set[i].xui,
                    y: set[i].yui,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                })) {
                    return true;
                }
            }
            return false;
        },
        hovers(copy, id, rel) {
            return ct.mouse ?
                (ct.mouse.hovers(copy) || ct.touch.collide(copy, id, rel)) :
                ct.touch.collide(copy, id, rel);
        },
        hoversUi(copy, id, rel) {
            return ct.mouse ?
                (ct.mouse.hoversUi(copy) || ct.touch.collideUi(copy, id, rel)) :
                ct.touch.collideUi(copy, id, rel);
        },
        getById: findTouch,
        updateGestures: function () {
            let x = 0,
                y = 0;
            const rect = ct.pixiApp.view.getBoundingClientRect();
            for (const event of ct.touch.events) {
                x += (event.clientX - rect.left) / rect.width;
                y += (event.clientY - rect.top) / rect.height;
            }
            x /= ct.touch.events.length;
            y /= ct.touch.events.length;

            let angle = 0,
                distance = lastScaleDistance;
            if (ct.touch.events.length > 1) {
                const events = [
                    ct.touch.events[0],
                    ct.touch.events[1]
                ].sort((a, b) => a.id - b.id);
                angle = ct.u.pdn(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
                distance = ct.u.pdc(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
            }

            if (lastPanNum === ct.touch.events.length) {
                if (ct.touch.events.length > 1) {
                    setKey('DeltaRotation', (ct.u.degToRad(ct.u.deltaDir(lastAngle, angle))));
                    setKey('DeltaPinch', distance / lastScaleDistance - 1);
                } else {
                    setKey('DeltaPinch', 0);
                    setKey('DeltaRotation', 0);
                }
                if (!ct.touch.events.length) {
                    setKey('PanX', 0);
                    setKey('PanY', 0);
                } else {
                    setKey('PanX', x - lastPanX);
                    setKey('PanY', y - lastPanY);
                }
            } else {
                // skip gesture updates to avoid shaking on new presses
                lastPanNum = ct.touch.events.length;
                setKey('DeltaPinch', 0);
                setKey('DeltaRotation', 0);
                setKey('PanX', 0);
                setKey('PanY', 0);
            }
            lastPanX = x;
            lastPanY = y;
            lastAngle = angle;
            lastScaleDistance = distance;
        }
    };
})(ct);

/* eslint-disable no-cond-assign */
/* global bondage */
(function () {
    const characterLine = /^(?:([\S]+):)?\s*([\s\S]+)/;
    const soundCall = /^sound\("([\s\S]*)"\)$/;
    const roomCall = /^room\("([\s\S]*)"\)$/;
    const waitCall = /^wait\(([0-9]+)\)$/;
    const playSound = function(sound) {
        if (!(sound in ct.res.sounds)) {
            console.error(`Skipping an attempt to play a non-existent sound ${sound} in a YarnStory`);
            return;
        }
        ct.sound.spawn(sound);
    };
    const switchRoom = function(room) {
        if (!(room in ct.rooms.templates)) {
            throw new Error(`An attempt to switch to a non-existent room ${room} in a YarnStory`);
        }
        ct.rooms.switch(room);
    };

    // Maybe it won't be needed someday
    /**
     * Parses "magic" functions and executes them
     *
     * @param {String} command A trimmed command string
     * @param {YarnStory} story The story that runs this command
     * @returns {Boolean|String} Returns `false` if no command was executied,
     *      `true` if a synchronous function was executed, and `"async"`
     *      if an asynchronous function was called.
     */
    const ctCommandParser = function(command, story) {
        if (soundCall.test(command)) {
            playSound(soundCall.exec(command)[1]);
            return true;
        } else if (roomCall.test(command)) {
            switchRoom(roomCall.exec(command)[1]);
            return true;
        } else if (waitCall.test(command)) {
            const ms = parseInt(waitCall.exec(command)[1], 10);
            if (!ms && ms !== 0) {
                throw Error(`Invalid command ${command}: wrong number format.`);
            }
            ct.u.waitUi(ms)
            .then(() => story.next());
            return 'async';
        }
        return false;
    };
    const extendWithCtFunctions = function(bondage) {
        const fs = bondage.functions;
        fs.sound = playSound;
        fs.room = switchRoom;
    };
    class YarnStory extends PIXI.utils.EventEmitter {
        /**
         * Creates a new YarnStory
         * @param {Object} data The exported, inlined Yarn's .json file
         * @param {String} [first] The starting node's name from which to run the story. Defaults to "Start"
         * @returns {YarnStory} self
         */
        constructor(data, first) {
            super();
            this.bondage = new bondage.Runner();
            extendWithCtFunctions(this.bondage);
            this.bondage.load(data);

            this.nodes = this.bondage.yarnNodes;
            this.startingNode = first? this.nodes[first] : this.nodes.Start;
        }

        /**
         * Starts the story, essentially jumping to a starting node
         * @returns {void}
         */
        start() {
            this.jump(this.startingNode.title);
            this.emit('start', this.scene);
        }
        /**
         * "Says" the given option, advancing the story further on a taken branch, if this dialogue option exists.
         * @param {String} line The line to say
         * @returns {void}
         */
        say(line) {
            const ind = this.options.indexOf(line);
            if (ind === -1) {
                throw new Error(`There is no line "${line}". Is it a typo?`);
            }
            this.currentStep.select(ind);
            this.next();
        }
        /**
         * Manually moves the story to a node with a given title
         *
         * @param {String} title The title of the needed node
         * @returns {void}
         */
        jump(title) {
            if (!(title in this.nodes)) {
                throw new Error(`Could not find a node called "${title}".`);
            }
            this.position = 0;
            this.scene = this.bondage.run(title);
            this.next();
        }
        /**
         * Moves back to the previous node, but just once
         *
         * @returns {void}
         */
        back() {
            this.jump(this.previousNode.title);
        }
        /**
         * Naturally advances in the story, if no options are available
         * @returns {void}
         */
        next() {
            this.currentStep = this.scene.next().value;
            if (this.currentStep instanceof bondage.TextResult ||
                this.currentStep instanceof bondage.CommandResult) {
                if (this.raw !== this.currentStep.data) {
                    this.previousNode = this.raw;
                    this.raw = this.currentStep.data;
                    this.emit('newnode', this.currentStep);
                }
            }
            if (this.currentStep) {
                if (this.currentStep instanceof bondage.TextResult) {
                    // Optionally, skip empty lines
                    if ([true][0] && !this.text.trim()) {
                        this.next();
                        return;
                    }
                    this.emit('text', this.text);
                } else if (this.currentStep instanceof bondage.CommandResult) {
                    if ([true][0]) {
                        const commandStatus = ctCommandParser(this.command.trim(), this);
                        if (commandStatus && commandStatus !== 'async') {
                            this.next(); // Automatically advance the story after magic commands
                            // Async commands should call `this.next()` by themselves
                            return;
                        } else if (commandStatus === 'async') {
                            return;
                        }
                    }
                    this.emit('command', this.command.trim());
                } else if (this.currentStep instanceof bondage.OptionsResult) {
                    this.emit('options', this.options);
                }
                this.emit('next', this.currentStep);
            } else {
                this.emit('drained', this.currentStep);
            }
        }

        /**
         * Returns the current text line, including the character's name
         *
         * @returns {String|Boolean} Returns `false` if the current position is not a speech line,
         *      otherwise returns the current line.
         */
        get text() {
            if (this.currentStep instanceof bondage.TextResult) {
                return this.currentStep.text;
            }
            return false;
        }
        /**
         * Returns the character's name that says the current text line.
         * It is expected that your character's names will be in one word,
         * otherwise they will be detected as parts of the speech line.
         * E.g. `Cat: Hello!` will return `'Cat'`, but `Kitty cat: Hello!`
         * will return `undefined`.
         *
         * @return {Boolean|String|undefined} Returns `false` if the current position is not a speech line,
         *      `undefined` if the line does not have a character specified, and a string of your character
         *      if it was specified.
         */
        get character() {
            return this.text && characterLine.exec(this.text)[1];
        }

        /**
         * Returns the the current text line, without a character.
         * It is expected that your character's names will be in one word,
         * otherwise they will be detected as parts of the speech line.
         * E.g. `Cat: Hello!` will return `'Cat'`, but `Kitty cat: Hello!`
         * will return `undefined`.
         *
         * @return {String|Boolean} The speech line or `false` if the current position
         *      is not a speech line.
         */
        get body() {
            return this.text && characterLine.exec(this.text)[2];
        }
        /**
         * Returns the title of the current node
         *
         * @returns {String} The title of the current node
         */
        get title() {
            return this.raw.title;
        }
        /**
         * Returns the current command
         *
         * @returns {String|Boolean} The current command, or `false` if the current
         *      position is not a command.
         */
        get command() {
            if (this.currentStep instanceof bondage.CommandResult) {
                return this.currentStep.text;
            }
            return false;
        }
        /**
         * Returns the tags of the current node
         *
         * @returns {String} The tags of the current node.
         */
        get tags() {
            return this.raw.tags;
        }
        /**
         * Returns currently possible dialogue options, if there are any.
         * @returns {Array<String>|Boolean} An array of possible dialogue lines.
         */
        get options() {
            if (this.currentStep instanceof bondage.OptionsResult) {
                return this.currentStep.options;
            }
            return false;
        }
        /**
         * Current variables
         * @type {Object}
         */
        get variables() {
            return this.bondage.variables;
        }
        /**
         * Checks whether a given node was visited
         * @param {String} title The node's title to check against
         * @returns {Boolean} Returns `true` if the specified node was visited, `false` otherwise.
         */
        visited(title) {
            return (title in this.bondage.visited && this.bondage.visited[title]);
        }
    }

    ct.yarn = {
        /**
         * Opens the given JSON object and returns a YarnStory object, ready for playing.
         * @param {Object} data The JSON object of a Yarn story
         * @returns {YarnStory} The YarnStory object
         */
        openStory(data) {
            return new YarnStory(data);
        },
        /**
         * Opens the given JSON object and returns a promise that resolves into a YarnStory.
         * @param {String} url The link to the JSON file, relative or absolute. Use `myProject.json`
         * for stories stored in your `project/include` directory.
         * @returns {Promise<YarnStory>} A promise that resolves into a YarnStory object after downloading the story
         */
        openFromFile(url) {
            return fetch(url)
            .then(data => data.json())
            .then(json => new YarnStory(json));
        }
    };
})();


/* Based on https://github.com/luser/gamepadtest */

(function ctGamepad() {
    const standardMapping = {
        controllers: {},
        buttonsMapping: [
            'Button1',
            'Button2',
            'Button3',
            'Button4',
            'L1',
            'R1',
            'L2',
            'R2',
            'Select',
            'Start',
      // here, must have same name as in module.js
            'L3',
      //'LStickButton',
      // here, too...
            'R3',
      //'RStickButton',
      // up, down, left and right are all mapped as axes.
            'Up',
            'Down',
            'Left',
            'Right'

      // + a special button code `Any`, that requires special handling
        ],
        axesMapping: ['LStickX', 'LStickY', 'RStickX', 'RStickY']
    };

    const prefix = 'gamepad.';

    const setRegistry = function (key, value) {
        ct.inputs.registry[prefix + key] = value;
    };
    const getRegistry = function (key) {
        return ct.inputs.registry[prefix + key] || 0;
    };

    const getGamepads = function () {
        if (navigator.getGamepads) {
            return navigator.getGamepads();
        }
        return [];
    };

    const addGamepad = function (gamepad) {
        standardMapping.controllers[gamepad.index] = gamepad;
    };

    const scanGamepads = function () {
        const gamepads = getGamepads();
        for (let i = 0, len = gamepads.length; i < len; i++) {
            if (gamepads[i]) {
                const {controllers} = standardMapping;
                if (!(gamepads[i].index in controllers)) {
          // add new gamepad object
                    addGamepad(gamepads[i]);
                } else {
          // update gamepad object state
                    controllers[gamepads[i].index] = gamepads[i];
                }
            }
        }
    };

    const updateStatus = function () {
        scanGamepads();
        let j;
        const {controllers} = standardMapping;
        const {buttonsMapping} = standardMapping;
        const {axesMapping} = standardMapping;
        for (j in controllers) {
      /**
       * @type {Gamepad}
       */
            const controller = controllers[j];
            const buttonsLen = controller.buttons.length;

      // Reset the 'any button' input
            setRegistry('Any', 0);
      // loop through all the known button codes and update their state
            for (let i = 0; i < buttonsLen; i++) {
                setRegistry(buttonsMapping[i], controller.buttons[i].value);
        // update the 'any button', if needed
                setRegistry('Any', Math.max(getRegistry('Any'), controller.buttons[i].value));
                ct.gamepad.lastButton = buttonsMapping[i];
            }

      // loop through all the known axes and update their state
            const axesLen = controller.axes.length;
            for (let i = 0; i < axesLen; i++) {
                setRegistry(axesMapping[i], controller.axes[i]);
            }
        }
    };

    ct.gamepad = Object.assign(new PIXI.utils.EventEmitter(), {
        list: getGamepads(),
        connected(e) {
            ct.gamepad.emit('connected', e.gamepad, e);
            addGamepad(e.gamepad);
        },
        disconnected(e) {
            ct.gamepad.emit('disconnected', e.gamepad, e);
            delete standardMapping.controllers[e.gamepad.index];
        },
        getButton: code => {
            if (standardMapping.buttonsMapping.indexOf(code) === -1 && code !== 'Any') {
                throw new Error(`[ct.gamepad] Attempt to get the state of a non-existing button ${code}. A typo?`);
            }
            return getRegistry(code);
        },
        getAxis: code => {
            if (standardMapping.axesMapping.indexOf(code) === -1) {
                throw new Error(`[ct.gamepad] Attempt to get the state of a non-existing axis ${code}. A typo?`);
            }
            return getRegistry(code);
        },
        lastButton: null
    });

  // register events
    window.addEventListener('gamepadconnected', ct.gamepad.connected);
    window.addEventListener('gamepaddisconnected', ct.gamepad.disconnected);
  // register a ticker listener
    ct.pixiApp.ticker.add(updateStatus);
})();
/**
 * @typedef {ITextureOptions}
 * @property {} []
 */

(function resAddon(ct) {
    const loadingScreen = document.querySelector('.ct-aLoadingScreen'),
          loadingBar = loadingScreen.querySelector('.ct-aLoadingBar');
    const dbFactory = window.dragonBones ? dragonBones.PixiFactory.factory : null;
    /**
     * A utility object that manages and stores textures and other entities
     * @namespace
     */
    ct.res = {
        sounds: {},
        textures: {},
        skeletons: {},
        /**
         * Loads and executes a script by its URL
         * @param {string} url The URL of the script file, with its extension.
         * Can be relative or absolute.
         * @returns {Promise<void>}
         * @async
         */
        loadScript(url = ct.u.required('url', 'ct.res.loadScript')) {
            var script = document.createElement('script');
            script.src = url;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject();
                };
            });
            document.getElementsByTagName('head')[0].appendChild(script);
            return promise;
        },
        /**
         * Loads an individual image as a named ct.js texture.
         * @param {string} url The path to the source image.
         * @param {string} name The name of the resulting ct.js texture
         * as it will be used in your code.
         * @param {ITextureOptions} textureOptions Information about texture's axis
         * and collision shape.
         * @returns {Promise<Array<PIXI.Texture>>}
         */
        loadTexture(url = ct.u.required('url', 'ct.res.loadTexture'), name = ct.u.required('name', 'ct.res.loadTexture'), textureOptions = {}) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load image ${url}`));
                });
            })
            .then(resources => {
                const tex = [resources[url].texture];
                tex.shape = tex[0].shape = textureOptions.shape || {};
                tex[0].defaultAnchor = new PIXI.Point(
                    textureOptions.anchor.x || 0,
                    textureOptions.anchor.x || 0
                );
                ct.res.textures[name] = tex;
                return tex;
            });
        },
        /**
         * Loads a skeleton made in DragonBones into the game
         * @param {string} ske Path to the _ske.json file that contains
         * the armature and animations.
         * @param {string} tex Path to the _tex.json file that describes the atlas
         * with a skeleton's textures.
         * @param {string} png Path to the _tex.png atlas that contains
         * all the textures of the skeleton.
         * @param {string} name The name of the skeleton as it will be used in ct.js game
         */
        loadDragonBonesSkeleton(ske, tex, png, name = ct.u.required('name', 'ct.res.loadDragonBonesSkeleton')) {
            const dbf = dragonBones.PixiFactory.factory;
            const loader = new PIXI.Loader();
            loader
                .add(ske, ske)
                .add(tex, tex)
                .add(png, png);
            return new Promise((resolve, reject) => {
                loader.load(() => {
                    resolve();
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load skeleton with _ske.json: ${ske}, _tex.json: ${tex}, _tex.png: ${png}.`));
                });
            }).then(() => {
                dbf.parseDragonBonesData(loader.resources[ske].data);
                dbf.parseTextureAtlasData(
                    loader.resources[tex].data,
                    loader.resources[png].texture
                );
                // eslint-disable-next-line id-blacklist
                ct.res.skeletons[name] = loader.resources[ske].data;
            });
        },
        /**
         * Loads a Texture Packer compatible .json file with its source image,
         * adding ct.js textures to the game.
         * @param {string} url The path to the JSON file that describes the atlas' textures.
         * @returns {Promise<Array<string>>} A promise that resolves into an array
         * of all the loaded textures.
         */
        loadAtlas(url = ct.u.required('url', 'ct.res.loadAtlas')) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load atlas ${url}`));
                });
            })
            .then(resources => {
                const sheet = resources[url].spritesheet;
                for (const animation in sheet.animations) {
                    const tex = sheet.animations[animation];
                    const animData = sheet.data.animations;
                    for (let i = 0, l = animData[animation].length; i < l; i++) {
                        const a = animData[animation],
                              f = a[i];
                        tex[i].shape = sheet.data.frames[f].shape;
                    }
                    tex.shape = tex[0].shape || {};
                    ct.res.textures[animation] = tex;
                }
                return Object.keys(sheet.animations);
            });
        },
        /**
         * Loads a bitmap font by its XML file.
         * @param {string} url The path to the XML file that describes the bitmap fonts.
         * @param {string} name The name of the font.
         * @returns {Promise<string>} A promise that resolves into the font's name
         * (the one you've passed with `name`).
         */
        loadBitmapFont(url = ct.u.required('url', 'ct.res.loadBitmapFont'), name = ct.u.required('name', 'ct.res.loadBitmapFont')) {
            const loader = new PIXI.Loader();
            loader.add(name, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load bitmap font ${url}`));
                });
            });
        },
        loadGame() {
            // !! This method is intended to be filled by ct.IDE and be executed
            // exactly once at game startup. Don't put your code here.
            const changeProgress = percents => {
                loadingScreen.setAttribute('data-progress', percents);
                loadingBar.style.width = percents + '%';
            };

            const atlases = [["./img/a0.json","./img/a1.json","./img/a2.json","./img/a3.json","./img/a4.json","./img/a5.json","./img/a6.json","./img/a7.json"]][0];
            const tiledImages = [{"Bg":{"source":"./img/t0.png","shape":{"type":"rect","top":0,"bottom":512,"left":0,"right":512},"anchor":{"x":0,"y":0}},"Tela_Morte":{"source":"./img/t1.png","shape":{"type":"rect","top":0,"bottom":720,"left":0,"right":1280},"anchor":{"x":0,"y":0}}}][0];
            const sounds = [[{"name":"Tomo tiro1","wav":"./snd/hqJQ2BgJ4qLDC3.wav","mp3":false,"ogg":false,"poolSize":1,"isMusic":false},{"name":"test","wav":false,"mp3":false,"ogg":"./snd/TDhjMPj2jJLfc2.ogg","poolSize":1,"isMusic":false},{"name":"TERRA","wav":false,"mp3":false,"ogg":"./snd/d17bmW2LdbDrBw.ogg","poolSize":5,"isMusic":false},{"name":"exp","wav":"./snd/HD1FT6NJCpp4cg.wav","mp3":false,"ogg":false,"poolSize":5,"isMusic":false},{"name":"espada","wav":false,"mp3":false,"ogg":"./snd/D8DTb523wczQt5.ogg","poolSize":5,"isMusic":false}]][0];
            const bitmapFonts = [{}][0];
            const dbSkeletons = [[]][0]; // DB means DragonBones

            if (sounds.length && !ct.sound) {
                throw new Error('[ct.res] No sound system found. Make sure you enable one of the `sound` catmods. If you don\'t need sounds, remove them from your ct.js project.');
            }

            const totalAssets = atlases.length;
            let assetsLoaded = 0;
            const loadingPromises = [];

            loadingPromises.push(...atlases.map(atlas =>
                ct.res.loadAtlas(atlas)
                .then(texturesNames => {
                    assetsLoaded++;
                    changeProgress(assetsLoaded / totalAssets * 100);
                    return texturesNames;
                })));

            for (const name in tiledImages) {
                loadingPromises.push(ct.res.loadTexture(
                    tiledImages[name].source,
                    name,
                    {
                        anchor: tiledImages[name].anchor,
                        shape: tiledImages[name].shape
                    }
                ));
            }
            for (const font in bitmapFonts) {
                loadingPromises.push(ct.res.loadBitmapFont(bitmapFonts[font], font));
            }
            for (const skel of dbSkeletons) {
                ct.res.loadDragonBonesSkeleton(...skel);
            }

            for (const sound of sounds) {
                ct.sound.init(sound.name, {
                    wav: sound.wav || false,
                    mp3: sound.mp3 || false,
                    ogg: sound.ogg || false
                }, {
                    poolSize: sound.poolSize,
                    music: sound.isMusic
                });
            }

            /*@res@*/
            

            Promise.all(loadingPromises)
            .then(() => {
                Object.defineProperty(ct.templates.Copy.prototype, 'cgroup', {
    set: function (value) {
        this.$cgroup = value;
    },
    get: function () {
        return this.$cgroup;
    }
});
Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuous', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveAlong(this, this.direction, this.speed * ct.delta, cgroup, precision);
    }
});

Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuousByAxes', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveByAxes(
            this,
            this.hspeed * ct.delta,
            this.vspeed * ct.delta,
            cgroup,
            precision
        );
    }
});

Object.defineProperty(ct.templates.Tilemap.prototype, 'enableCollisions', {
    value: function (cgroup) {
        ct.place.enableTilemapCollisions(this, cgroup);
    }
});
ct.pointer.setupListeners();
ct.mouse.setupListeners();
ct.touch.setupListeners();
if ([true][0]) {
    ct.touch.setupMouseListeners();
}

                loadingScreen.classList.add('hidden');
                ct.pixiApp.ticker.add(ct.loop);
                ct.rooms.forceSwitch(ct.rooms.starting);
            })
            .catch(console.error);
        },
        /*
         * Gets a pixi.js texture from a ct.js' texture name,
         * so that it can be used in pixi.js objects.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty texture
         * @param {number} [frame] The frame to extract
         * @returns {PIXI.Texture|Array<PIXI.Texture>} If `frame` was specified,
         * returns a single PIXI.Texture. Otherwise, returns an array
         * with all the frames of this ct.js' texture.
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTexture(name, frame) {
            if (frame === null) {
                frame = void 0;
            }
            if (name === -1) {
                if (frame !== void 0) {
                    return PIXI.Texture.EMPTY;
                }
                return [PIXI.Texture.EMPTY];
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a non-existent texture ${name}`);
            }
            const tex = ct.res.textures[name];
            if (frame !== void 0) {
                return tex[frame];
            }
            return tex;
        },
        /*
         * Returns the collision shape of the given texture.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty collision shape
         * @returns {object}
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTextureShape(name) {
            if (name === -1) {
                return {};
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a shape of a non-existent texture ${name}`);
            }
            return ct.res.textures[name].shape;
        },
        /**
         * Creates a DragonBones skeleton, ready to be added to your copies.
         * @param {string} name The name of the skeleton asset
         * @param {string} [skin] Optional; allows you to specify the used skin
         * @returns {object} The created skeleton
         */
        makeSkeleton(name, skin) {
            const r = ct.res.skeletons[name],
                  skel = dbFactory.buildArmatureDisplay('Armature', r.name, skin);
            skel.ctName = name;
            skel.on(dragonBones.EventObject.SOUND_EVENT, function skeletonSound(event) {
                if (ct.sound.exists(event.name)) {
                    ct.sound.spawn(event.name);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Skeleton ${skel.ctName} tries to play a non-existing sound ${event.name} at animation ${skel.animation.lastAnimationName}`);
                }
            });
            return skel;
        }
    };

    ct.res.loadGame();
})(ct);

/**
 * A collection of content that was made inside ct.IDE.
 * @type {any}
 */
ct.content = JSON.parse(["{}"][0] || '{}');

// //Velocidade de recarga,quanto mais o Num mais lenta.10 = Rápido,15 = Comum, 20+ = Lenta

// //modelo

// if (ct.actions.Atirar.pressed && armanum == 1 && this.timerTiro>armanum.Recarga) { 
//     ct.templates.copy("Carrot",this.x+ this.add,this.y+ this.addy, {
//         hspeed: armanum.Vel  * this.dirAnterior,
//         vspeed: 0 + this.speedy,
//         gravity: 0 
//     });
//     var efeito = 'Nada'
//     this.dano = armanum.Dano
//     this.timerTiro = 0;

// var armanum;



// if (armanum = 1) { var Arma = {
//     name: 'Bolas de Energia',
//     description: 'Atira bolas de energia que causam dano comum e recarga comum.Nada demais.',
//     copy: 'Carrot',
//     Dano: 5,
//     Recarga:15,
//     Efeito: NaN,
//     Vel:5
// }
// }

// if (armanum = 2) { var Arma = {
//     name: 'Rajada mágica',
//     description: 'Atira 3 Tiros que causam dano alto,porém tem uma recarga lenta e baixa velocidade.',
//     Dano: 5,
//     Recarga: 22,
//     Efeito: NaN, //Vai 3 vezes
//     Vel:3
// }
// }

// if (armanum = 3) { var Arma = {
//     name: 'Magia Teleguiada',
//     description: 'Atira uma magia que automaticamente vai até o inimigo mais próximo.Tem uma recarga ligeiramente mais rápida mas causa dano reduzido.',
//     Dano: 2,
//     Recarga: 12,
//     Efeito: NaN, // Teleguiado
//     Vel:4.2
// }
// }

// if (armanum = 4) { var Arma = {
//     name: 'Magia Flamejante',
//     description: 'Com uma magia elemental,atira fogo nos inimigos.Dá um dano comum,porém com uma recarga mais lenta.Em compensação,queima os inimigos com o tempo',
//     Dano: 5,
//     Recarga: 19,
//     Efeito: fogo, // Fogo kkkk
//     Vel:5
// }
// }

// if (armanum = 5) { var Arma = {
//     name: 'Bolas de neve',
//     description: 'Com uma magia elemental,atira tiros de gelo nos inimigos.Causa dano reduzido,porém tem recarga mais alta e Causa lentidão acumulável.',
//     Dano: 2,
//     Recarga: 12,
//     Efeito: slow, // slow ue
//     Vel:4
// }
// }

// if (armanum = 6)  { var Arma = {
//     name: 'Penetração Mágica',
//     description: 'Com magia de alta classe,lança um tiro de pouca velocidade,porém penetra todos os inimigos(incluindo chefes),e tem alcance infinito..',
//     Dano: 7,
//     Recarga: 18,
//     Efeito: NaN, // Atravessa
//     Vel:3
// }
// }

// if (armanum = 7) { var Arma = {
//     name: 'Tiro de recarga',
//     description: 'Canalizando automaticamente com o tempo,o dano do tiro pode ser aumentado.é bem simples,assim como no Megaman IV..',
//     Dano: 3,  //ao inves de pressed vai usar released e so colocar a variável aqui,que vai contar com delta e etc.Maximo 12,
//     Recarga: 17,
//     Efeito: NaN, //
//     Vel:4
// }
// }

// if (armanum = 8) { var Arma = {
//     name: 'Metralhadora',
//     description: 'Lanças infinitamente e automaticamente projéteis mágicos numa cadência excepcional.Causam pouco dano,e tem uma velocidade de projétil alta.Ótima técnica pra quem gosta de afundar o botão.',
//     Dano: 1,
//     Recarga: 10, // Automático
//     Efeito: NaN,
//     Vel:6
// }
// }

// if (armanum = 9) { var Arma = {
//     name: 'Curto Alcance',
//     description: 'Com uma magia elemental,atira tiros de gelo nos inimigos.Causa dano reduzido,porém tem recarga mais alta e Causa lentidão acumulável.',
//     Dano: 2, // 20 projéteis
//     Recarga: 15,
//     Efeito: NaN,
//     Vel:3
// }
// }

// if (armanum = 10) { var Arma = {
//     name: 'Bumerangue Mágico',
//     description: 'Uma magia que vai e volta,penetrando e causando dano duas vezes em todos os inimigos a frente.Só pode o usar quando ele voltar!',
//     Dano: 10, //2 vezes
//     Recarga:15,  //Só quando o bumerangue voltar.
//     Efeito: NaN,
//     Vel:3
// }
// }
// }

// // // _________________________________________________________________________________

// // if (ct.place.meet(this,this.x,this.y,Tiro1)) {
// //     this.vida -= 5
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro2)) {
// //     this.vida -= 5
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro3)) {
// //     this.vida -= 2
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro4)) {
// //     this.vida -= 4
// //     this.efeito = 'fogo'
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro5)) {
// //     this.vida -= 2
// //     this.efeito = 'slow'
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro6)) {
// //   this.vida -= 7
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro7)) {
// //   this.vida -= 3 * this.recarga
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro8)) {
// //   this.vida -= 1
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro9)) {
// //   this.vida -= 2
// // }

// // if (ct.place.meet(this,this.x,this.y,Tiro6)) {
// //   this.vida -= 10
// // }

// // ___________________________________________________________________________
// // fazer os sistemas de status,mudar os types dos tiros ;



;
/* Usar scripts para definir funções frequentes e importar pequenas bibliotecas */

//Camera no player true/false;
/* Use scripts to define frequent functions and import small libraries */
var vida;
var mana;
var arma;
var pocao;
var elixir;
var fase;
var direcao;
var controlavel;
var parototal;
var tutorial;
var hudvisivel;
var camera;
var debug1;
var passiva;
var buffdano;
//matar inimgios
var matoupequeno;
var matoumedio;
var matougrande;
var menuskillaberto;

;
var xposmenuskill;
var yposmenuskill;
var xposmenuescolha;
var yposmenuescolha;
var bumeranguevoltando;
var golemexiste;
var morcegoexiste;
var dogexiste;
var tafazendotuto;
var viraofogo;;
// // /* Usar scripts para definir funções frequentes e importar pequenas bibliotecas */

// // const dano = function (arma,vida) {
// //     this.vida -= arma.dano
// //     if ()
// // }
//um script que copiei ae
// // const calculateDamage = function(ship, bullet) {
// //     ship.health -= bullet.damage;
// //     if (bullet.template === 'Laser_Bolt_Blue') { // Bolts may survive the collision do additional damage
// //         if (ship.health < 0) {
// //             bullet.damage += ship.health; // bring overkill damage back to the bullet
// //             if (bullet.damage <= 0) {
// //                 bullet.kill = true;
// //             }
// //         } else {
// //             bullet.kill = true;
// //         }
// //     } else {
// //         bullet.kill = true;
// //     }
// //     if (ship.health <= 0) {
// //         ship.kill = true;
// //     }
// // };
;
// /* Usar scripts para definir funções frequentes e importar pequenas bibliotecas */

// function colisao() {
//     if (ct.place.meet(this,this.x,this.y,'Tiro1')) {
//     this.vida -= 5 * buffdano
// }
// //rajada
// if (ct.place.meet(this,this.x,this.y,'Tiro2')) {
//     this.vida -= 5 * buffdano

// }//fogo
// if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
//     this.vida -= 3 * buffdano 
//     this.efeito = 'fogo'
// }
// //teleguiado
// if (ct.place.meet(this,this.x,this.y,'Tiro3')) {
//     this.vida -= 2 * buffdano
// }

// //gelo
// if (ct.place.meet(this,this.x,this.y,'Tiro5')) {
//     this.vida -= 2 * buffdano
//     this.efeito = 'slow'
// 	this.slow += 1	
// 	this.timerslow = 0
// }
// //penetraçao
// if (ct.place.meet(this,this.x,this.y,'Tiro6')) {
//   this.vida -= 7 * buffdano
// }
// //recarga
// if (ct.place.meet(this,this.x,this.y,'Tiro7')) {
//   this.vida -= 3 * this.recarga * buffdano
// }
// //metralhadora
// if (ct.place.meet(this,this.x,this.y,'Tiro8')) {
//   this.vida -= 1 * buffdano
// }
// //tiro de 12
// if (ct.place.meet(this,this.x,this.y,'Tiro9')) {
//   this.vida -= 2 * buffdano
// }


// if (ct.place.meet(this,this.x,this.y,'Skill1')) {
//     this.vida -= 20
// }
// };
var controle;

ct.gamepad.on('connected', () => {
    controle = true
})

// ct.gamepad.on('disconnected', () => {
//     controle = false
// })


;
// function rebater(fogo) {
//     console.log('sssss')
// fogo.direction *= -1
// };
