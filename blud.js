let TILE_SIZE = 16;
let editor = false;
let input;
let level;
let hud = loadImage('images/hud.png');
/*
    This will be true for the first frame only, and can be used for debug
    purposes to avoid printing debug messages at 60fps.
*/
let firstframe = true;
class coord {
}
function actorAt(x, y) {
    for (var a = 0, actor; actor = level.actors[a]; a++) {
        if (actor.isAt(x, y)) {
            return (actor);
        }
    }
    return (null);
}
function tick(ticks) {
    /* Paused? */
    if (input.getButton(input.PAUSE, true) & input.PRESSED) {
        MenuAction("pause");
    }
    if (input.getButton(input.A, true) & input.PRESSED) {
        var pos = player.lookingAt();
        var actor = actorAt(pos.x, pos.y);
        if (actor) {
            actor.talk();
        }
    }
    if (input.getButton(input.SELECT, true) & input.PRESSED) {
        player.damage(1000);
    }
    if (!level.tick()) {
        /* Nothing else is active while the level is sliding */
        return (false);
    }
}
function render(ctx) {
    level.render(ctx);
    if (!editor) {
        /* HUD */
        var dx = 8, dy = 8;
        drawBorder(ctx, dx, dy, 64 + 12, 8 + 12, 'black');
        dx += 6;
        dy += 6;
        /* Scale the player's health to a 64 pixel long bar */
        var health = player.health * 64 / 100;
        var w = 64 - health;
        if (health < 8) {
            w = health;
        }
        if (health > 0) {
            ctx.drawImage(hud, 0, 0, health, 8, dx, dy, health, 8);
        }
        if (w > 0) {
            w = Math.min(w, 8);
            ctx.drawImage(hud, 64, 0, w, 8, health > 8 ? dx + health - 8 : dx, dy, w, 8);
        }
    }
    else {
    }
}
function debug(msg) {
    var div;
    if (!(div = document.getElementById('debug'))) {
        div = document.createElement('div');
        div.id = 'debug';
        document.body.appendChild(div);
    }
    div.innerText = msg;
}
window.addEventListener('load', function () {
    var scale = 1;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var buffer = document.createElement('canvas');
    var bctx = buffer.getContext('2d');
    document.body.appendChild(canvas);
    input = new InputHandler(canvas);
    var w = 0;
    var h = 0;
    var resizeCanvas = function (force) {
        if (force || w != window.innerWidth || h != window.innerHeight) {
            w = window.innerWidth;
            h = window.innerHeight;
            for (var i = 1;; i++) {
                if ((i * TILE_SIZE * world.viewport.minwidth <= w) &&
                    (i * TILE_SIZE * world.viewport.minheight <= h)) {
                    scale = i;
                }
                else {
                    break;
                }
            }
            world.viewport.width = Math.floor(w / (scale * TILE_SIZE));
            world.viewport.height = Math.floor(h / (scale * TILE_SIZE));
            world.viewport.width = Math.min(world.viewport.width, world.viewport.maxwidth);
            world.viewport.height = Math.min(world.viewport.height, world.viewport.maxheight);
            console.log("Using viewport size:", world.viewport.width, world.viewport.height);
            w = Math.min(scale * TILE_SIZE * world.viewport.width, window.innerWidth);
            h = Math.min(scale * TILE_SIZE * world.viewport.height, window.innerHeight);
            ;
            // console.log(scale, w, h, window.innerWidth, window.innerHeight);
            canvas.setAttribute('width', '' + w);
            canvas.setAttribute('height', '' + h);
            buffer.setAttribute('width', '' + (world.viewport.width * TILE_SIZE));
            buffer.setAttribute('height', '' + (world.viewport.height * TILE_SIZE));
            /* Restore the initial saved state, and save it again */
            ctx.restore();
            ctx.save();
            bctx.restore();
            bctx.save();
            disableSmoothing(ctx);
            disableSmoothing(bctx);
            /* Store the current actual size so we can detect when it changes */
            w = window.innerWidth;
            h = window.innerHeight;
            level.resize(buffer.width, buffer.height);
        }
    };
    bctx.save();
    var ticksPerSec = 60;
    var tickWait = Math.floor(1000 / ticksPerSec);
    var lastFrame = 0;
    var frametime = 0;
    var ticks = 0;
    var area;
    var doAnimationFrame = function doAnimationFrame(time) {
        requestAnimationFrame(doAnimationFrame);
        /*
            Poll input devices (mainly gamepads) as frequently as possible
            regardless of the tick rate.
        */
        input.poll();
        if (frametime) {
            frametime += time - lastFrame;
        }
        else {
            frametime = time - lastFrame;
        }
        lastFrame = time;
        while (frametime >= tickWait) {
            if (dialog && !dialog.closed) {
                dialog.tick(ticks);
            }
            else {
                tick(ticks);
            }
            ticks++;
            frametime -= tickWait;
        }
        resizeCanvas();
        /* Clear the canvas */
        bctx.clearRect(0, 0, buffer.width, buffer.height);
        bctx.save();
        render(bctx);
        if (dialog && !dialog.closed) {
            dialog.render(bctx);
        }
        firstframe = false;
        bctx.restore();
        /* Draw (and scale) the image to the main canvas now */
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, buffer.width * scale, buffer.height * scale);
    };
    level = new Level(world, function () {
        /* Load the town center */
        level.loadArea("towncenter");
        level.resize(buffer.width, buffer.height);
        requestAnimationFrame(doAnimationFrame);
    });
});
/* pollyfill for requestAnimationFrame */
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0, vendor; (vendor = vendors[x]) && !window.requestAnimationFrame; x++) {
        window.requestAnimationFrame =
            window[vendor + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendor + 'CancelAnimationFrame'] ||
                window[vendor + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());
window.addEventListener('load', function () {
    /* Add a class to body if we are on a device that has a touchscreen */
    if ('ontouchstart' in window) {
        document.body.classList.add('touchscreen');
    }
});
function disableSmoothing(ctx) {
    ctx.mozImageSmoothingEnabled = false;
    // ctx.webkitImageSmoothingEnabled		= false; /* Chrome gives an annoying warning */
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
}
function loadImage(src, cb) {
    var img = new Image();
    disableSmoothing(img);
    if (cb) {
        img.onload = function () {
            cb(img);
        };
    }
    img.src = src;
    return (img);
}
let dialog = null;
let font = null;
let fontSizeX = 8;
let fontSizeY = 8;
let fontkeys = [
    " !\"#$%^'()*+,-./0123456789:;<=>?",
    "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_",
    "`abcdefghijklmnopqrstuvwxyz{|}~"
];
let fontOffsets = {
    pointer0: [256, 0],
    pointer1: [256, 0],
    pointer2: [264, 8],
    pointer3: [264, 8]
};
let kbkeys = [
    "ABCDEFGHIJK",
    "LMNOPQRSTUV",
    "WXYZ-.,~`&_",
    "0123456789 "
];
/* Build a table with offsets for each displayable character */
for (let y = 0, line; line = fontkeys[y]; y++) {
    for (let x = 0, key; (key = line.charAt(x)) && key.length == 1; x++) {
        fontOffsets[key] = [x * fontSizeX, y * fontSizeY];
    }
}
loadImage('images/text.png', function (img) {
    font = img;
});
function drawText(ctx, str, x, y, scale, noclear) {
    if (isNaN(scale)) {
        scale = 1;
    }
    for (let i = 0; i < str.length; i++) {
        let c;
        if ('string' === typeof str) {
            c = str.charAt(i);
        }
        else {
            c = "pointer" + str[i];
        }
        if (!noclear) {
            // ctx.fillStyle = '#666666';
            ctx.fillRect(x, y, fontSizeX * scale, fontSizeY * scale);
        }
        if (fontOffsets[c]) {
            ctx.drawImage(font, fontOffsets[c][0], fontOffsets[c][1], fontSizeX, fontSizeY, x, y, fontSizeX * scale, fontSizeY * scale);
        }
        x += fontSizeX * scale;
    }
}
/*
    Draw a border inside the specified square. The border itself is 6 pixels
    wide, but generally a 2 pixel padding is desired.
*/
function drawBorder(ctx, dx, dy, w, h, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    /*
        Borders are in the image at 272x0, in a 3x3 grid of images that are
        each 8x8 pixels.
    */
    for (let x = 0; x < w; x += fontSizeX) {
        for (let y = 0; y < h; y += fontSizeY) {
            let sx = 272;
            let sy = 0;
            if (x > 0) {
                sx += 8;
            }
            if (x + fontSizeX >= w) {
                x = w - fontSizeX;
                sx += 8;
            }
            if (y > 0) {
                sy += 8;
            }
            if (y + fontSizeY >= h) {
                y = h - fontSizeY;
                sy += 8;
            }
            ctx.drawImage(font, sx, sy, fontSizeX, fontSizeY, dx + x, dy + y, fontSizeX, fontSizeY);
        }
    }
    ctx.fillRect(dx + 6, dy + 6, w - 12, h - 12);
    ctx.restore();
}
function splitLines(msg, maxWidth) {
    let lines = [];
    let src = msg.split('\n');
    let line;
    while ((line = src.shift())) {
        if (line.length <= maxWidth || /^\s/.test(line)) {
            lines.push(line);
            continue;
        }
        let words = line.split(/\s+/);
        let word;
        line = '';
        while ((word = words.shift())) {
            if (line.length + word.length + 1 > maxWidth) {
                lines.push(line);
                line = '';
            }
            if (line.length > 0) {
                line += ' ';
            }
            line += word;
        }
        if (line.length > 0) {
            lines.push(line);
        }
    }
    return (lines);
}
;
;
function Ask(options) {
    return (new Promise((resolve, reject) => {
        let closecb = (value) => {
            resolve(value);
        };
        switch (Array.isArray(options) ? "array" : (typeof options)) {
            case "array":
                options[options.length - 1].closecb = closecb;
                break;
            case "string":
                let o = {
                    msg: options,
                    closecb: closecb
                };
                options = o;
                break;
            default:
                options.closecb = closecb;
                break;
        }
        let dialog = new Dialog(options);
    }));
}
class Dialog {
    constructor(options) {
        this.actor = null;
        this.keys = null;
        this.choices = null;
        this.drawn = 0;
        this.ticks = 0;
        this.steps = 8;
        this.modal = false;
        this.noinput = false;
        this.closecb = null;
        this.inputcb = null;
        this.spoken = false;
        this.msg = '';
        this.selected = 0;
        this.icon = null;
        this.kb = false;
        this.key = null;
        this.upper = 1;
        this.value = '';
        this.maxLength = 20;
        this.closed = false;
        this.closing = false;
        if (Array.isArray(options)) {
            this.next = options;
            options = this.next.shift();
        }
        if ("string" === typeof options) {
            options = { msg: options, spoken: true };
        }
        /*
            The number of steps that should be used to zoom the dialog in when
            opening it, and out again when closing it.
        */
        if (!isNaN(options.steps)) {
            this.steps = options.steps;
        }
        this.modal = options.modal;
        this.noinput = options.noinput;
        this.closecb = options.closecb;
        this.inputcb = options.inputcb;
        this.spoken = options.spoken;
        this.icon = options.icon;
        this.kb = options.kb;
        this.key = options.key;
        this.value = options.value || this.value;
        this.maxLength = options.maxLength || this.maxLength;
        this.msg = options.msg || this.msg;
        let lines = splitLines(this.msg, 30);
        this.msg = lines.join('\n');
        if (options.actor) {
            if (options.actor.actor) {
                this.actor = options.actor;
            }
            else {
                this.actor = {
                    actor: options.actor,
                    facing: "S",
                    action: options.actor.TALKING
                };
            }
            this.actor.width = this.actor.width || this.actor.actor.width;
            this.actor.height = this.actor.width || this.actor.actor.height;
        }
        if (options.choices) {
            if (Array.isArray(options.choices)) {
                this.choices = options.choices;
            }
            else {
                let keys = Object.keys(options.choices);
                if (keys && keys.length > 0) {
                    this.keys = keys;
                    this.choices = [];
                    for (let i = 0; i < keys.length; i++) {
                        this.choices.push(options.choices[keys[i]]);
                    }
                }
            }
        }
        this.lineCount = lines.length;
        this.height = lines.length;
        this.width = lines[0].length;
        for (let i = 1; i < lines.length; i++) {
            this.width = Math.max(this.width, lines[i].length);
        }
        if (this.spoken) {
            this.drawLimit = 1;
        }
        else {
            this.drawLimit = this.msg.length;
        }
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        disableSmoothing(this.ctx);
        if (this.kb) {
            /* Eat keyboard events while the keyboard is displayed */
            input.kbhandler = this.handleKBEvent.bind(this);
        }
        /* Pad box to fit the largest option */
        let longest = 0;
        if (this.choices) {
            for (let i = 0, o; o = this.choices[i]; i++) {
                longest = Math.max(longest, o.length);
            }
            longest += 1;
        }
        else if (this.kb) {
            longest = (kbkeys[0].length * 2) + 1;
        }
        this.width = Math.max(this.width, longest);
        if (this.icon) {
            this.iconWidth = Math.ceil(this.icon[3] / fontSizeX);
            this.width += this.iconWidth;
            this.height = Math.max(this.height, Math.ceil(this.icon[4] / fontSizeY));
        }
        else if (this.actor) {
            this.iconWidth = this.actor.width / fontSizeX;
            this.width += this.iconWidth;
            this.height = Math.max(this.height, this.actor.height / fontSizeY);
        }
        else {
            this.iconWidth = 0;
        }
        this.canvas.setAttribute('width', '' + ((this.width + 4) * fontSizeX));
        if (this.choices) {
            this.canvas.setAttribute('height', '' + ((this.height + 3 + this.choices.length) * fontSizeY));
        }
        else if (this.kb) {
            /* The keyboard takes up a lot of room... */
            this.canvas.setAttribute('height', '' + ((this.height + 6 + kbkeys.length) * fontSizeY));
        }
        else {
            this.canvas.setAttribute('height', '' + ((this.height + 2) * fontSizeY));
        }
        if (options.fill) {
            this.ctx.fillStyle = options.fill;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        else {
            this.ctx.fillStyle = '#666666';
            drawBorder(this.ctx, 0, 0, this.canvas.width, this.canvas.height, '#666666');
        }
        if (this.icon) {
            let y = 8 + ((this.height * fontSizeY) / 2) - (this.icon[4] / 2);
            this.ctx.drawImage(this.icon[0], this.icon[1], this.icon[2], this.icon[3], this.icon[4], 8, y, this.icon[3], this.icon[4]);
        }
        dialog = this;
        return (this);
    }
    close() {
        if (this.ticks < 0 || this.steps === 0) {
            this.closed = true;
            dialog = null;
            /* Clear the input kbhandler */
            input.kbhandler = null;
            if (this.next && this.next.length) {
                /* Open the next dialog */
                new Dialog(this.next);
            }
            if (this.closecb) {
                let o;
                let value;
                if (this.kb) {
                    value = this.value;
                }
                else if (this.keys) {
                    value = this.keys[this.selected];
                }
                else if (this.choices) {
                    value = this.selected;
                }
                else {
                    value = null;
                }
                if (this.key) {
                    o = {};
                    o[this.key] = value;
                }
                else {
                    o = value;
                }
                this.closecb(o);
            }
        }
        else if (!this.closing) {
            /* Reset ticks - Count down now that we're closing */
            this.ticks = this.steps;
            this.closing = true;
        }
    }
    handleKBEvent(name, key, upper) {
        name = name.replace(/^Key/, '');
        console.log(name, key);
        switch (name.toLowerCase()) {
            /* Ignore enter; The arrows and enter can still be used */
            case "backspace":
                if (this.value.length > 0) {
                    this.value = this.value.slice(0, this.value.length - 1);
                }
                break;
            case "escape":
                this.value = null;
                this.selected = -1;
                this.close();
                break;
            default:
                if (!key) {
                    /* Support older browsers as much as possible */
                    key = name;
                }
                if (-1 != kbkeys.join('').indexOf(key.toUpperCase()) &&
                    this.value.length < this.maxLength) {
                    if (upper) {
                        this.value += key.toUpperCase();
                    }
                    else {
                        this.value += key.toLowerCase();
                    }
                    /* Move selector to "End" so that enter will finish */
                    this.selected = kbkeys.join("").length + 3;
                }
                else {
                    return (false);
                }
                break;
        }
        return (true);
    }
    tick() {
        if (this.inputcb) {
            /* Let the consumer handle input */
            this.inputcb(this);
        }
        else {
            if (!this.noinput && !this.modal &&
                input.getButton(input.BACK, true) & input.PRESSED) {
                this.value = null;
                this.selected = -1;
                this.close();
            }
            if (!this.noinput) {
                if (input.getButton(input.CONTINUE, true) & input.PRESSED) {
                    if (this.kb) {
                        if (this.value.length < this.maxLength) {
                            let keys = kbkeys.join('');
                            switch (this.selected - keys.length) {
                                case 0:
                                    if (this.upper) {
                                        this.upper = 0;
                                    }
                                    else {
                                        /* Sticky upper */
                                        this.upper = 2;
                                    }
                                    break;
                                case 1:
                                    if (this.value.length > 0) {
                                        this.value = this.value.slice(0, this.value.length - 1);
                                    }
                                    break;
                                case 2:
                                    this.close();
                                    break;
                                default:
                                    if (this.upper) {
                                        this.value += keys.charAt(this.selected);
                                        if (this.upper === 1) {
                                            this.upper = 0;
                                        }
                                    }
                                    else {
                                        this.value += keys.charAt(this.selected).toLowerCase();
                                    }
                                    break;
                            }
                        }
                    }
                    else if (this.drawLimit < this.msg.length) {
                        this.drawLimit = this.msg.length;
                    }
                    else {
                        this.close();
                    }
                }
                let dirs = input.getDirection(true);
                if (!this.closing && this.drawLimit >= this.msg.length) {
                    let total;
                    if (this.choices) {
                        total = this.choices.length;
                        if ((dirs[input.N] | dirs[input.E]) & input.PRESSED) {
                            this.selected--;
                        }
                        else if ((dirs[input.S] | dirs[input.W]) & input.PRESSED) {
                            this.selected++;
                        }
                    }
                    else if (this.kb) {
                        /*
                            The keyboard is 4 rows of 11 (currently) and has 2 extra
                            for actions (shift, back and end).
                        */
                        let kblen = kbkeys.join("").length;
                        /* There are currently 3 buttons (Shift, Del, End) */
                        total = kblen + 3;
                        if (dirs[input.N] & input.PRESSED) {
                            if (this.selected >= kblen) {
                                let i = this.selected - kblen;
                                /* Try to line up with the key above */
                                switch (i) {
                                    case 0:
                                        this.selected += 3;
                                        break;
                                    case 1:
                                        this.selected += 6;
                                        break;
                                    case 2:
                                        this.selected += 7;
                                        break;
                                }
                            }
                            this.selected -= kbkeys[0].length;
                        }
                        if (dirs[input.E] & input.PRESSED) {
                            this.selected++;
                        }
                        if (dirs[input.S] & input.PRESSED) {
                            this.selected += kbkeys[0].length;
                            /* Select the right action button... */
                            if (this.selected > kblen) {
                                let i = this.selected - kblen;
                                this.selected -= i;
                                if (i >= 6) {
                                    this.selected++;
                                }
                                if (i >= 9) {
                                    this.selected++;
                                }
                            }
                        }
                        if (dirs[input.W] & input.PRESSED) {
                            this.selected--;
                        }
                    }
                    if (this.selected < 0) {
                        this.selected = 0;
                    }
                    if (this.selected >= total) {
                        this.selected = total - 1;
                    }
                }
            }
        }
        if (this.closing) {
            this.ticks--;
            if (this.ticks < 0) {
                this.close();
            }
            return;
        }
        this.ticks++;
        if (!font) {
            /* Not ready */
            return;
        }
        if (this.drawLimit < this.msg.length && this.ticks > this.steps) {
            /* Adjust this increment to change the speed text is "spoken" */
            // TODO Play a noise with this?
            this.drawLimit += 1;
        }
        if (this.drawn >= this.drawLimit) {
            let longest = 0;
            if (this.choices) {
                for (let i = 0, o; o = this.choices[i]; i++) {
                    longest = Math.max(longest, o.length);
                }
                for (let i = 0, o; o = this.choices[i]; i++) {
                    while (o.length < longest) {
                        o += " ";
                    }
                    drawText(this.ctx, i === this.selected ? [0] : " ", fontSizeX * (1 + this.width - longest), fontSizeY * (this.height + 2 + i));
                    drawText(this.ctx, o, fontSizeX * (2 + this.width - longest), fontSizeY * (this.height + 2 + i));
                }
            }
            else if (this.kb) {
                let i = 0;
                for (let x = 0; x < this.maxLength; x++) {
                    drawText(this.ctx, this.value.charAt(x) || ' ', (x + 3) * fontSizeX, (this.lineCount + 2) * fontSizeY);
                }
                for (let y = 0; y < kbkeys.length; y++) {
                    for (let x = 0; x < kbkeys[y].length; x++) {
                        drawText(this.ctx, i === this.selected ? [0] : " ", ((x * 2) + 2) * fontSizeX, (fontSizeY * (y + this.lineCount + 4)));
                        drawText(this.ctx, this.upper ?
                            kbkeys[y].charAt(x) : kbkeys[y].charAt(x).toLowerCase(), ((x * 2) + 3) * fontSizeX, (fontSizeY * (y + this.lineCount + 4)));
                        i++;
                    }
                }
                let choices = ["Shift", "Del", "End"];
                let x = 8;
                for (let o = 0; o < choices.length; o++) {
                    drawText(this.ctx, i === this.selected ? [0] : " ", (x++) * fontSizeX, (fontSizeY * (kbkeys.length + this.lineCount + 4)));
                    drawText(this.ctx, choices[o], (x) * fontSizeX, (fontSizeY * (kbkeys.length + this.lineCount + 4)));
                    i++;
                    x += choices[o].length + 1;
                }
            }
            return;
        }
        let x = 0;
        let y = 0;
        for (let i = 0; i < this.drawLimit; i++) {
            let c = this.msg.charAt(i);
            let oy = 0;
            if (c === '\n') {
                x = 0;
                y++;
            }
            else {
                x++;
            }
            if (i < this.drawn) {
                continue;
            }
            if (1 === this.lineCount && (this.icon || this.actor) && !this.choices && !this.kb) {
                oy = (this.height - 1) * fontSizeY / 2;
            }
            drawText(this.ctx, c, fontSizeX * (x + 1 + this.iconWidth), (fontSizeY * (y + 1)) + oy);
            this.drawn++;
        }
    }
    render(ctx) {
        let img = this.canvas;
        let perx = Math.min(this.ticks / this.steps, 1);
        let pery = Math.min(this.ticks / this.steps, 1);
        if (!img || !ctx || this.closed) {
            return;
        }
        let w = Math.floor(perx * img.width);
        let h = Math.floor(pery * img.height);
        let x = Math.floor(ctx.canvas.width / 2);
        let y;
        x -= Math.floor(w / 2);
        if (this.spoken) {
            y = (ctx.canvas.height - 15) - h;
        }
        else {
            y = Math.floor(ctx.canvas.height / 2);
            y -= Math.floor(h / 2);
        }
        if (this.actor) {
            let rate = this.actor.rate;
            let delay = this.actor.delay || 0;
            let ticks;
            if (isNaN(rate)) {
                rate = 1.0;
            }
            ticks = Math.floor(this.ticks * rate);
            ticks -= delay;
            if (ticks < 0) {
                ticks = 0;
            }
            let ay = 8 + ((this.height * fontSizeY) / 2) - (this.actor.actor.height / 2);
            this.ctx.fillRect(8, ay, this.actor.actor.width, this.actor.actor.height);
            this.actor.actor.renderState(this.ctx, this.actor.action, this.actor.facing, ticks, 8, ay);
        }
        ctx.drawImage(img, 0, 0, img.width, img.height, x, y, perx * img.width, pery * img.height);
    }
}
let player = null;
let actornum = 0;
class Actor {
    // TODO Set the right type for level
    constructor(id, definition, level, area, x, y) {
        // TODO Turn these into an enum and use numbers instead of strings so we can
        //		have the state be defined as the actor state type.
        this.STANDING = "standing";
        this.BLINKING = "blinking";
        this.STUCK = "stuck";
        this.TURNING = "turning";
        this.MOVING = "moving";
        this.TALKING = "talking";
        this.DEAD = "dead";
        this.player = false;
        if (!id || !definition) {
            console.log("Could not find definition for actor:" + id);
            return (null);
        }
        if (id === "blud" && player) {
            /* There is only one player */
            return (player);
        }
        this.num = ++actornum;
        this.id = id;
        this.level = level;
        this.ticks = 0;
        this.frame = 0;
        this.definition = definition;
        this.width = this.definition.width || TILE_SIZE;
        this.height = this.definition.height || TILE_SIZE;
        /* Set defaults from the definition */
        this.facing = this.definition.facing;
        this.x = x || this.definition.x;
        this.y = y || this.definition.y;
        this.health = 100;
        this.newpos = {
            x: this.x,
            y: this.y
        };
        this._lookingAt = {
            x: 0,
            y: 0
        };
        this.renderOff = {
            x: 0,
            y: 0
        };
        this.area = area || this.definition.area;
        this.setState(this.STANDING);
        switch (id) {
            case "blud":
                this.player = true;
                this.name = "Sue"; /* Default name for the player */
                this.level.scrollTo(true, this.x * TILE_SIZE, this.y * TILE_SIZE);
                this.controls = new PlayerControls(this);
                break;
            case "eyeball":
                this.controls = new EyeballControls(this);
                break;
            case "rotavirus":
                this.controls = new RotaVirusControls(this);
                break;
        }
        this.children = [];
    }
    getDefinition(state, direction) {
        let def = null;
        state = state || this.state;
        direction = direction || this.facing;
        if (this.definition[state]) {
            def = this.definition[state][direction] || this.definition[state]['S'];
        }
        if (!def) {
            switch (state) {
                case this.STUCK:
                    def = this.getDefinition(this.MOVING, direction);
                    break;
                default:
                case this.BLINKING:
                    def = this.getDefinition(this.STANDING, direction);
                    break;
                case this.STANDING:
                    /* This is the default; so it can't fall back to anything else */
                    break;
            }
        }
        /* Fill out some sane defaults */
        if (isNaN(def.ox)) {
            def.ox = 0;
        }
        if (isNaN(def.oy)) {
            def.oy = 0;
        }
        return (def);
    }
    isAt(x, y) {
        if (x === this.x && y === this.y) {
            return (true);
        }
        if (x === this.newpos.x && y === this.newpos.y) {
            return (true);
        }
        return (false);
    }
    /*
        Return the distance between this actor and the one specified in pixels
        taking into account the rendering offset.
    */
    distance(actor) {
        let x1 = (this.x * TILE_SIZE) + this.renderOff.x;
        let y1 = (this.y * TILE_SIZE) + this.renderOff.y;
        let x2 = (actor.x * TILE_SIZE) + actor.renderOff.x;
        let y2 = (actor.y * TILE_SIZE) + actor.renderOff.y;
        // console.log(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
        return (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    }
    setState(state, dest) {
        if (state && this.state !== state) {
            this.state = state;
            this.frame = 0;
        }
        if (dest) {
            this.newpos.x = dest.x;
            this.newpos.y = dest.y;
        }
        else {
            this.newpos.x = this.x;
            this.newpos.y = this.y;
        }
    }
    // TODO Add a direction arg
    // TODO Knock back?
    damage(ammount) {
        /* Invinsibility frames */
        if (this.ticks - this.lastDamage < 30) {
            return;
        }
        this.lastDamage = this.ticks;
        this.health -= ammount;
        if (this.health < 0) {
            this.health = 0;
        }
        else if (this.health > 100) {
            this.health = 100;
        }
        if (this.health <= 0) {
            this.setState(this.DEAD);
            if (this.player) {
                this.children = [
                    new Actor("eyeball", this.level.def.items["eyeball"], this.level, this.area, this.x, this.y),
                    new Actor("eyeball", this.level.def.items["eyeball"], this.level, this.area, this.x, this.y)
                ];
                this.children[0].renderOff.x -= 4;
                this.children[1].renderOff.x += 4;
                setTimeout(function () {
                    MenuAction("respawn");
                }.bind(this), 3000);
            }
        }
    }
    talk() {
        // TODO Add actual logic to control what the actor can say
        if (!this.definition.dialog) {
            return;
        }
        let def = this.getDefinition(this.STANDING, "S");
        let msg = this.definition.dialog[this.frame % this.definition.dialog.length];
        let src = def.src || this.definition.src;
        let img;
        if (!(img = this.level.images[src])) {
            img = this.level.images[src] = loadImage(src);
        }
        Ask({
            actor: this,
            msg: msg,
            spoken: true
        });
    }
    canMove(direction, mindistance) {
        let tile;
        let x = this.x;
        let y = this.y;
        let ax;
        let ay;
        if (editor) {
            /* Allow moving anywhere when in editor mode */
            return (true);
        }
        direction = direction || this.facing;
        switch (direction) {
            case 'N':
                y--;
                break;
            case 'E':
                x++;
                break;
            case 'S':
                y++;
                break;
            case 'W':
                x--;
                break;
        }
        for (let a = 0, actor; actor = level.actors[a]; a++) {
            if (actor === this || actor.area !== this.area || actor.state === actor.DEAD) {
                continue;
            }
            switch (actor.state) {
                case actor.MOVING:
                    ax = actor.newpos.x;
                    ay = actor.newpos.y;
                    break;
                default:
                    ax = actor.x;
                    ay = actor.y;
                    break;
            }
            if (ax === x && ay === y) {
                /*
                    Regardless of mindistance you can never take the exact same
                    spot that another actor is moving to.
                */
                return (false);
            }
            if (isNaN(mindistance)) {
                if (actor.x === x && actor.y === y) {
                    return (false);
                }
            }
            else {
                if (actor.distance(this) < mindistance) {
                    return (false);
                }
            }
        }
        tile = this.level.tileAt(x, y);
        if (!tile || !this.level.tiles[tile]) {
            return (false);
        }
        return (!this.level.tiles[tile].solid);
    }
    tick() {
        /* this.frames resets when the state changes, this.ticks does not */
        this.ticks++;
        this.frame++;
        if (this.controls && this.controls.tick) {
            this.controls.tick();
        }
        /* Grab the definition for this character's current action and direction */
        let def = this.getDefinition(this.state, this.facing);
        switch (this.state) {
            case this.BLINKING:
            case this.STANDING:
                if (0 === (this.ticks % 3)) {
                    switch (this.state) {
                        case this.STANDING:
                            if (0 === (WRand() % 40)) {
                                this.setState(this.BLINKING);
                            }
                            break;
                        case this.BLINKING:
                            this.setState(this.STANDING);
                            break;
                    }
                }
                break;
        }
        for (let c = 0, child; child = this.children[c]; c++) {
            child.tick();
        }
    }
    /* Return true if this actor should be rendered on the specified row */
    renderRow(y) {
        if ('S' === this.facing && this.MOVING === this.state) {
            return (y === this.y + 1);
        }
        else {
            return (y === this.y);
        }
    }
    ;
    lookingAt() {
        this._lookingAt.x = this.x;
        this._lookingAt.y = this.y;
        switch (this.facing) {
            case 'N':
                this._lookingAt.y--;
                break;
            case 'E':
                this._lookingAt.x++;
                break;
            case 'S':
                this._lookingAt.y++;
                break;
            case 'W':
                this._lookingAt.x--;
                break;
        }
        return (this._lookingAt);
    }
    render(ctx, wx, wy) {
        /* Which tile (relative to the viewport) is the actor on */
        let x = (this.x * TILE_SIZE) - wx;
        let y = (this.y * TILE_SIZE) - wy;
        /* Add the offset if the character is moving between tiles */
        x += this.renderOff.x;
        y += this.renderOff.y;
        this.renderState(ctx, this.state, this.facing, this.frame, x, y);
        for (let c = 0, child; child = this.children[c]; c++) {
            child.render(ctx, wx, wy);
        }
    }
    ;
    renderState(ctx, state, facing, ticks, x, y) {
        /* Grab the definition for this character's current action and direction */
        let def = this.getDefinition(state, facing);
        let src = def.src || this.definition.src;
        let img;
        if (!src) {
            return;
        }
        if (!(img = this.level.images[src])) {
            img = this.level.images[src] = loadImage(src);
        }
        /* How many frames are there for this state? */
        let frames = 1;
        let rate = 1;
        let frame;
        if (def && !isNaN(def.frames)) {
            frames = def.frames;
        }
        if (def && !isNaN(def.rate)) {
            rate = def.rate;
        }
        /* Determine which frame to use */
        let sx = def.x;
        let sy = def.y;
        frame = Math.floor(ticks * rate);
        if (def.repeat !== undefined && !def.repeat && frame >= frames) {
            frame = frames - 1;
        }
        sx += (frame % frames) * (def.ox || 0);
        sy += (frame % frames) * (def.oy || 0);
        ctx.drawImage(img, sx * this.width, sy * this.height, this.width, this.height, x, y, this.width, this.height);
    }
} /* End of Actor class */
function RotaVirusControls(actor) {
    this.actor = actor;
    this.maxSpeed = 3;
    this.minSpeed = -1.5;
    this.accelRate = 0.075;
    this.decelRate = 0.075;
    this.speed = this.minSpeed;
}
RotaVirusControls.prototype.isActive = function isActive(state) {
    switch (state || this.actor.state) {
        case this.actor.MOVING:
        case this.actor.STUCK:
            return (true);
        default:
            return (false);
    }
};
RotaVirusControls.prototype.accel = function accel() {
    this.speed += this.accelRate;
    if (this.speed > this.maxSpeed) {
        this.speed = this.maxSpeed;
    }
};
RotaVirusControls.prototype.decel = function decel() {
    this.speed -= this.decelRate;
    if (this.speed <= 0) {
        this.speed = this.minSpeed;
    }
};
RotaVirusControls.prototype.tick = function tick() {
    /*
        This simple enemy has very basic logic. If it is lined up either
        vertically or horizontally with the player then it will attempt to move
        towards them.
    */
    var actor = this.actor;
    var found = true;
    if (actor.state === actor.DEAD) {
        return;
    }
    if (!player || player.area !== actor.area) {
        return;
    }
    var facing = actor.facing;
    if (player.state === player.DEAD) {
        found = false;
    }
    else if (player.x === actor.x) {
        if (player.y > actor.y) {
            facing = "S";
        }
        else if (player.y < actor.y) {
            facing = "N";
        }
    }
    else if (player.y === actor.y) {
        if (player.x > actor.x) {
            facing = "E";
        }
        else if (player.x < actor.x) {
            facing = "W";
        }
    }
    else {
        found = false;
    }
    if (actor.state !== actor.MOVING) {
        actor.facing = facing;
    }
    if (found && facing === actor.facing) {
        if (actor.canMove(actor.facing, TILE_SIZE * 0.75)) {
            actor.setState(actor.MOVING, actor.lookingAt());
        }
        else {
            actor.setState(actor.MOVING);
        }
        this.accel();
    }
    else {
        this.decel();
        if (this.speed <= 0) {
            actor.setState(actor.STANDING);
        }
    }
    if (this.speed > 0 && actor.state === actor.MOVING) {
        var x = 0;
        var y = 0;
        switch (actor.facing) {
            case 'N':
                y--;
                break;
            case 'E':
                x++;
                break;
            case 'S':
                y++;
                break;
            case 'W':
                x--;
                break;
        }
        var rx = x ? actor.renderOff.x + Math.floor(x * this.speed) : 0;
        var ry = y ? actor.renderOff.y + Math.floor(y * this.speed) : 0;
        if (Math.abs(rx) >= (TILE_SIZE * 0.5) ||
            Math.abs(ry) >= (TILE_SIZE * 0.5)) {
            /* The character has moved far enough to reach another square */
            if (actor.canMove(actor.facing, TILE_SIZE * 0.5)) {
                actor.x = actor.newpos.x;
                actor.y = actor.newpos.y;
                actor.renderOff.x = rx - (x * TILE_SIZE);
                actor.renderOff.y = ry - (y * TILE_SIZE);
                if (actor.canMove(actor.facing, TILE_SIZE * 0.5)) {
                    actor.setState(actor.MOVING, actor.lookingAt());
                }
                else {
                    actor.setState(actor.MOVING);
                }
            }
            else {
                /*
                    Simply skip moving the character this turn because something
                    was in the way.
                */
                ;
            }
        }
        else {
            actor.renderOff.x = rx;
            actor.renderOff.y = ry;
        }
    }
    if (actor.state === actor.MOVING && (Math.abs(actor.renderOff.x) > 2 ||
        Math.abs(actor.renderOff.y) > 2)) {
        for (var i = 0, a; a = level.actors[i]; i++) {
            if (a === actor || a.area !== actor.area || a.state === a.DEAD) {
                continue;
            }
            if (actor.distance(a) < (TILE_SIZE)) {
                a.damage(5);
                this.speed = 0;
            }
        }
    }
    if (this.speed <= 0) {
        if (actor.renderOff.x > 0) {
            actor.renderOff.x--;
        }
        if (actor.renderOff.x < 0) {
            actor.renderOff.x++;
        }
        if (actor.renderOff.y > 0) {
            actor.renderOff.y--;
        }
        if (actor.renderOff.y < 0) {
            actor.renderOff.y++;
        }
    }
};
class InputHandler {
    constructor(canvas) {
        /* Constants */
        this.PRESSED = 0x1; /* The button has been pressed and not acted on */
        this.HELD = 0x2; /* The button is still being held */
        this.NORTH = 'N';
        this.EAST = 'E';
        this.SOUTH = 'S';
        this.WEST = 'W';
        this.N = this.NORTH;
        this.E = this.EAST;
        this.S = this.SOUTH;
        this.W = this.WEST;
        this.PAUSE = 'pause';
        this.CONTINUE = 'continue';
        this.BACK = 'back';
        this.START = 'start';
        this.SELECT = 'select';
        this.A = 'A';
        this.B = 'B';
        this.X = 'X';
        this.Y = 'Y';
        this.LB = 'LB';
        this.RB = 'RB';
        this.directions = [this.N, this.E, this.S, this.W];
        this.axisThreshold = 0.5;
        this._direction = { N: 0, E: 0, S: 0, W: 0 };
        /* The status of each device. The details may vary from device to device. */
        this.devices = {
            js: [],
            kb: {},
            other: {}
        };
        /* Timestamps of the last time each button was pressed. */
        this.timestamps = {
            js: [],
            kb: {},
            other: {}
        };
        this.bindings = {
            js: [
                /* Left stick (usually) */
                {
                    action: this.N,
                    key: "axis1-"
                }, {
                    action: this.E,
                    key: "axis0+"
                }, {
                    action: this.S,
                    key: "axis1+"
                }, {
                    action: this.W,
                    key: "axis0-"
                },
                /* dpad (usually) */
                {
                    action: this.N,
                    key: "axis7-"
                }, {
                    action: this.E,
                    key: "axis6+"
                }, {
                    action: this.S,
                    key: "axis7+"
                }, {
                    action: this.W,
                    key: "axis6-"
                },
                /* Buttons */
                {
                    action: this.CONTINUE,
                    key: "button0"
                }, {
                    action: this.BACK,
                    key: "button1"
                },
                {
                    action: this.A,
                    key: "button0"
                }, {
                    action: this.B,
                    key: "button1"
                }, {
                    action: this.X,
                    key: "button2"
                }, {
                    action: this.Y,
                    key: "button3"
                },
                {
                    action: this.PAUSE,
                    key: "button7"
                },
                {
                    action: this.START,
                    key: "button7"
                },
                {
                    action: this.CONTINUE,
                    key: "button7"
                },
                {
                    action: this.SELECT,
                    key: "button6"
                }
            ],
            kb: [
                /* WASD */
                {
                    action: this.N,
                    key: "keyw"
                }, {
                    action: this.E,
                    key: "keyd"
                }, {
                    action: this.S,
                    key: "keys"
                }, {
                    action: this.W,
                    key: "keya"
                },
                /* Arrows */
                {
                    action: this.N,
                    key: "arrowup"
                }, {
                    action: this.E,
                    key: "arrowright"
                }, {
                    action: this.S,
                    key: "arrowdown"
                }, {
                    action: this.W,
                    key: "arrowleft"
                },
                /* Enter and escape for dialogs */
                {
                    action: this.CONTINUE,
                    key: "enter"
                }, {
                    action: this.CONTINUE,
                    key: "space"
                }, {
                    action: this.BACK,
                    key: "escape"
                }, {
                    action: this.A,
                    key: "space"
                },
                {
                    action: this.START,
                    key: "escape"
                }, {
                    action: this.PAUSE,
                    key: "escape"
                }, {
                    action: this.SELECT,
                    key: "tab"
                }
            ]
        };
        this.deviceBindings = {
            "8Bitdo": [
                { action: "N", key: "axis1-" },
                { action: "E", key: "axis0+" },
                { action: "S", key: "axis1+" },
                { action: "W", key: "axis0-" },
                { action: "A", key: "button1" },
                { action: "continue", key: "button1" },
                { action: "B", key: "button0" },
                { action: "back", key: "button0" },
                { action: "X", key: "button4" },
                { action: "Y", key: "button3" },
                { action: "start", key: "button11" },
                { action: "continue", key: "button11" },
                { action: "pause", key: "button11" },
                { action: "select", key: "button10" },
                { action: "RB", key: "button7" },
                { action: "LB", key: "button6" }
            ],
            "X-Box 360": [
                /* Left stick (usually) */
                { action: this.N, key: "axis1-" },
                { action: this.E, key: "axis0+" },
                { action: this.S, key: "axis1+" },
                { action: this.W, key: "axis0-" },
                /* dpad (usually) */
                { action: this.N, key: "axis7-" },
                { action: this.E, key: "axis6+" },
                { action: this.S, key: "axis7+" },
                { action: this.W, key: "axis6-" },
                /* Buttons */
                { action: this.CONTINUE, key: "button0" },
                { action: this.BACK, key: "button1" },
                { action: this.A, key: "button0" },
                { action: this.B, key: "button1" },
                { action: this.X, key: "button2" },
                { action: this.Y, key: "button3" },
                { action: this.PAUSE, key: "button7" },
                { action: this.START, key: "button7" },
                { action: this.CONTINUE, key: "button7" },
                { action: this.SELECT, key: "button6" }
            ]
        };
        if (InputHandler._instance) {
            throw new Error("Error: InputHandler may only be created once");
        }
        InputHandler._instance = this;
        window.addEventListener('keydown', function (e) {
            if (!e.altKey && !e.ctrlKey && !e.code.match(/F[0-9]+$/)) {
                if (this.kbhandler && this.kbhandler(e.code, e.key, e.shiftKey)) {
                    /*
                        The current registered handler ate the keypress, so don't
                        bother setting that state. We still track held though.
                    */
                    this.devices.kb[e.code.toLowerCase()] = this.HELD;
                }
                else {
                    this.devices.kb[e.code.toLowerCase()] = this.PRESSED | this.HELD;
                    this.timestamps.kb[e.code.toLowerCase()] = new Date();
                    WRandUpdate(e.keyCode);
                }
                e.preventDefault();
            }
        }.bind(this));
        window.addEventListener('keyup', function (e) {
            if (!e.altKey && !e.ctrlKey) {
                this.devices.kb[e.code.toLowerCase()] &= ~this.HELD;
                e.preventDefault();
            }
        }.bind(this));
        window.addEventListener("gamepadconnected", function (e) {
            console.log(e.gamepad);
            if (!this.loadJSBindings(e.gamepad.id)) {
                this.remapjs("An unrecognized controller has been connected");
            }
        }.bind(this));
        if (this.getGamepads().length > 0) {
            if (!this.loadJSBindings()) {
                this.remapjs("An unrecognized controller has been connected");
            }
        }
        window.onpagehide = window.onblur = function (e) {
            this.devices.other[this.PAUSE] = this.PRESSED;
            this.timestamps.other[this.PAUSE] = new Date();
        }.bind(this);
        return (this);
    }
    /*
        Return an object with the current state of all directions.
    
        This call will clear the PRESSED status from all inputs, so it should only
        be called once per tick.
    */
    getDirection(clear) {
        this._direction.N = 0;
        this._direction.E = 0;
        this._direction.S = 0;
        this._direction.W = 0;
        /* Merge results from the keyboard */
        for (let i = 0, b; b = this.bindings.kb[i]; i++) {
            if (!b || !b.key) {
                continue;
            }
            if (-1 != this.directions.indexOf(b.action)) {
                this._direction[b.action] |= this.devices.kb[b.key];
                if (clear) {
                    this.devices.kb[b.key] &= ~this.PRESSED;
                }
            }
        }
        /* Merge results from gamepads */
        this.poll();
        for (let i = 0, b; b = this.bindings.js[i]; i++) {
            if (!b || !b.key) {
                continue;
            }
            if (-1 != this.directions.indexOf(b.action)) {
                for (let p = 0; p < this.devices.js.length; p++) {
                    this._direction[b.action] |= this.devices.js[p][b.key];
                    if (clear) {
                        this.devices.js[p][b.key] &= ~this.PRESSED;
                    }
                }
            }
        }
        return (this._direction);
    }
    ;
    getButton(name, clear) {
        let btn = 0;
        if (this.devices.other[name]) {
            btn |= this.devices.other[name];
            if (clear) {
                this.devices.other[name] &= ~this.PRESSED;
            }
        }
        /* Merge results from the keyboard */
        for (let i = 0, b; b = this.bindings.kb[i]; i++) {
            if (!b || !b.key || name !== b.action) {
                continue;
            }
            btn |= this.devices.kb[b.key];
            if (clear) {
                this.devices.kb[b.key] &= ~this.PRESSED;
            }
        }
        /* Merge results from gamepads */
        this.poll();
        for (let i = 0, b; b = this.bindings.js[i]; i++) {
            if (!b || !b.key || name !== b.action) {
                continue;
            }
            for (let p = 0; p < this.devices.js.length; p++) {
                btn |= this.devices.js[p][b.key];
                if (clear) {
                    this.devices.js[p][b.key] &= ~this.PRESSED;
                }
            }
        }
        return (btn);
    }
    ;
    clearPressed(device) {
        let keys = Object.keys(device);
        for (let i = 0, key; key = keys[i]; i++) {
            if (!isNaN(device[key])) {
                device[key] &= ~this.PRESSED;
            }
        }
    }
    ;
    getGamepads() {
        let gamepads;
        if (navigator.getGamepads) {
            gamepads = navigator.getGamepads();
        }
        else if (navigator.webkitGetGamepads) {
            gamepads = navigator.webkitGetGamepads();
        }
        else {
            gamepads = [];
        }
        if (!gamepads[0]) {
            gamepads = [];
        }
        return (gamepads);
    }
    ;
    /*
        Some devices (gamepads with the current js API for example) require polling
        instead of acting on events. Calling this function as frequently as possible
        is required to avoid missing button presses on these devices.
    */
    poll() {
        let gamepads = this.getGamepads();
        if (!gamepads[0]) {
            return [];
        }
        for (let i = 0, pad; pad = gamepads[i]; i++) {
            if (!this.devices.js[i]) {
                this.devices.js[i] = {};
                this.devices.js[i].id = pad.id;
            }
            if (!this.timestamps.js[i]) {
                this.timestamps.js[i] = {};
            }
            for (let a = 0; a < pad.axes.length; a++) {
                let axis = pad.axes[a];
                let key = "axis" + a;
                let on = false;
                if (axis > this.axisThreshold) {
                    key += '+';
                    on = true;
                }
                if (axis < -this.axisThreshold) {
                    key += '-';
                    on = true;
                }
                if (on) {
                    if (!this.devices.js[i][key]) {
                        this.devices.js[i][key] = this.PRESSED;
                        this.timestamps.js[i][key] = new Date();
                        WRandUpdate(200 + a);
                    }
                    this.devices.js[i][key] |= this.HELD;
                }
                else {
                    this.devices.js[i][(key + '+')] &= ~this.HELD;
                    this.devices.js[i][(key + '-')] &= ~this.HELD;
                }
            }
            for (let b = 0; b < pad.buttons.length; b++) {
                let btn = pad.buttons[b];
                let key = "button" + b;
                let on;
                if ("object" === typeof btn) {
                    on = btn.pressed;
                }
                else {
                    on = btn;
                }
                if (on) {
                    if (!this.devices.js[i][key]) {
                        this.devices.js[i][key] = this.PRESSED;
                        this.timestamps.js[i][key] = new Date();
                        WRandUpdate(b);
                    }
                    this.devices.js[i][key] |= this.HELD;
                }
                else {
                    this.devices.js[i][key] &= ~this.HELD;
                }
            }
        }
        // debug(JSON.stringify(this.devices.js));
    }
    ;
    loadJSBindings(device) {
        let gamepads = this.getGamepads();
        if (!gamepads[0]) {
            return (false);
        }
        if (!device) {
            device = gamepads[0].id;
        }
        let keys = Object.keys(this.deviceBindings);
        for (let i = 0, key; key = keys[i]; i++) {
            if (-1 != device.indexOf(key)) {
                this.bindings.js = this.deviceBindings[key];
                return (true);
            }
        }
        return (false);
    }
    ;
    remapjs(msg) {
        if (msg) {
            let d = new Dialog({
                msg: msg,
                noinput: true
            });
            setTimeout(function () {
                d.close();
                this.remapjs();
            }.bind(this), 3000);
            return;
        }
        for (let p = 0; p < this.devices.js.length; p++) {
            this.clearPressed(this.devices.js[p]);
        }
        loadImage('images/blud.png', function (img) {
            let map = [];
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let original = this.bindings.js;
            this.bindings.js = [];
            let todo = {};
            /* Left image, Right Image, Name */
            todo[input.N] = [1, 0, "Up"];
            todo[input.E] = [2, 0, "Right"];
            todo[input.S] = [3, 0, "Down"];
            todo[input.W] = [4, 0, "left"];
            todo[input.A] = [0, 3, "A"];
            todo[input.B] = [0, 2, "B"];
            todo[input.X] = [0, 4, "X"];
            todo[input.Y] = [0, 1, "Y"];
            todo[input.START] = [0, 5, "START"];
            todo[input.SELECT] = [5, 0, "SELECT"];
            todo[input.RB] = [0, 6, "Right Shoulder"];
            todo[input.LB] = [6, 0, "Left Shoulder"];
            canvas.setAttribute('width', '' + 32);
            canvas.setAttribute('height', '' + 16);
            /* Base image */
            ctx.drawImage(img, 12 * 16, 0, 32, 16, 0, 0, 32, 16);
            let keys = Object.keys(todo);
            let key;
            let addToMap = function addToMap(action, key, device) {
                /* We found a new button */
                map.push({
                    action: action,
                    key: key
                });
                /* Add alternate button names as well */
                if (action === this.A || action === this.START) {
                    map.push({
                        action: this.CONTINUE,
                        key: key
                    });
                }
                if (action === this.B) {
                    map.push({
                        action: this.BACK,
                        key: key
                    });
                }
                if (action === this.START) {
                    map.push({
                        action: this.PAUSE,
                        key: key
                    });
                }
            }.bind(this);
            let current = null;
            let readInput = function readInput() {
                this.poll();
                for (let p = 0; p < this.devices.js.length; p++) {
                    let pkeys = Object.keys(this.devices.js[p]);
                    for (let i = 0; i < pkeys.length; i++) {
                        let duration;
                        if (this.devices.js[p][pkeys[i]] & this.HELD) {
                            duration = (new Date().getTime()) - this.timestamps.js[p][pkeys[i]];
                        }
                        if (duration > 700 && duration < 3000) {
                            this.timestamps.js[p][pkeys[i]] = -1;
                            addToMap(key, pkeys[i], this.devices.js[p].id);
                            nextInput();
                            return;
                        }
                    }
                }
                if (this.getButton(this.BACK, true) & this.PRESSED) {
                    map = null;
                    this.bindings.js = original;
                    dialog.close();
                }
            }.bind(this);
            let nextInput = function nextInput() {
                if (!map) {
                    return;
                }
                this.poll();
                for (let p = 0; p < this.devices.js.length; p++) {
                    this.clearPressed(this.devices.js[p]);
                }
                if (!(key = keys.shift())) {
                    // TODO Save locally and then load again at startup
                    console.log(JSON.stringify(map));
                    this.bindings.js = map;
                    let t = null;
                    let d = new Dialog({
                        msg: [
                            "Success",
                            "",
                            "Press start to save or wait",
                            "5 seconds to restart mapping"
                        ].join('\n'),
                        closecb: function (value) {
                            clearTimeout(t);
                            if (-1 != value && map) {
                                this.bindings.js = map;
                            }
                            else {
                                this.bindings.js = original;
                            }
                        }.bind(this)
                    });
                    t = setTimeout(function () {
                        d.close();
                        this.remapjs();
                    }.bind(this), 5000);
                    return;
                }
                let offsets = todo[key];
                /* Draw left and right sides of image */
                ctx.drawImage(img, 12 * 16, offsets[0] * 16, 16, 16, 0, 0, 16, 16);
                ctx.drawImage(img, 13 * 16, offsets[1] * 16, 16, 16, 16, 0, 16, 16);
                dialog = new Dialog({
                    steps: 0,
                    msg: [
                        "Press and hold the highlighted",
                        "button on your controller."
                    ].join('\n'),
                    icon: [canvas, 0, 0, 32, 16],
                    closecb: nextInput.bind(this),
                    inputcb: readInput.bind(this)
                });
                dialog.tick();
            }.bind(this);
            nextInput.bind(this)();
        }.bind(this));
    }
    ;
} /* End InputHandler class */
InputHandler._instance = null;
class Level {
    constructor(definition, loadedcb) {
        this.images = {};
        this.slideFrames = 30;
        this.marginX = TILE_SIZE * 10;
        this.marginY = TILE_SIZE * 6;
        this.viewport = { x: 0, y: 0, w: 100, h: 100 };
        this.playerpos = { x: 0, y: 0 };
        this.children = [];
        this.actors = [];
        this.def = definition;
        let tilenames = Object.keys(this.def.tiles);
        let loadCount = 1;
        let src;
        let imageLoaded = function () {
            loadCount--;
            if (0 === loadCount) {
                /* All images have now been loaded */
                this.prepareLevelData();
                if (loadedcb) {
                    loadedcb();
                }
            }
        }.bind(this);
        /* Preload all images for tiles */
        for (let i = 0, tile; tile = tilenames[i]; i++) {
            if ((src = this.def.tiles[tile].src)) {
                loadCount++;
                this.images[src] = loadImage(src, imageLoaded);
            }
        }
        /* Preload all images for actors */
        for (let i = 0, actor; actor = this.def.actors[i]; i++) {
            if ((src = actor.definition.src)) {
                loadCount++;
                this.images[src] = loadImage(src, imageLoaded);
            }
        }
        /* Final time to account for the extra item in count */
        imageLoaded();
    }
    addChild(child) {
        if (!child.area) {
            child.area = this.area;
        }
        this.children.push(child);
    }
    resize(w, h) {
        this.viewport.w = w;
        this.viewport.h = h;
        this.scrollTo(true);
    }
    tileAt(x, y, deftile, ignoreVariants, rows, tiles) {
        let tile;
        rows = rows || this.rows;
        tiles = tiles || this.tiles;
        /*
            this.rows has a border of tiles from the surrounding areas, so the
            coords are off by one.
        */
        x++;
        y++;
        if (!rows[y] || !rows[y][x] || !(tile = rows[y][x][0])) {
            return (deftile);
        }
        if (!ignoreVariants && tiles[tile].variantOf) {
            tile = tiles[tile].variantOf;
        }
        return (tile);
    }
    squareAt(x, y, rows) {
        rows = rows || this.rows;
        /*
            this.rows has a border of tiles from the surrounding areas, so the
            coords are off by one.
        */
        x++;
        y++;
        if (rows[y]) {
            return (rows[y][x]);
        }
        return (null);
    }
    loadAreaData(name) {
        let rows = [];
        let c = this.def.areas[name];
        if (!c) {
            return;
        }
        let n = this.def.areas[this.findNearbyArea(0, -1, name)];
        let e = this.def.areas[this.findNearbyArea(1, 0, name)];
        let s = this.def.areas[this.findNearbyArea(0, 1, name)];
        let w = this.def.areas[this.findNearbyArea(-1, 0, name)];
        let row;
        /*
            Build the rows for the current area with a border filled out from the
            surrounding areas.
        */
        row = [];
        for (let x = -1; x <= c[0].length; x++) {
            let tmp;
            if (n && (tmp = n[n.length - 1].charAt(x))) {
                row.push(tmp);
            }
            else {
                row.push('-');
            }
        }
        rows.push(row);
        for (let y = 0; y < c.length; y++) {
            row = [];
            row.push(w ? w[y].charAt(w[y].length - 1) : '-');
            for (let x = 0; x < c[y].length; x++) {
                row.push(c[y].charAt(x));
            }
            row.push(e ? e[y].charAt(0) : '-');
            rows.push(row);
        }
        row = [];
        for (let x = -1; x <= c[0].length; x++) {
            let tmp;
            if (s && (tmp = s[0].charAt(x))) {
                row.push(tmp);
            }
            else {
                row.push('-');
            }
        }
        rows.push(row);
        return (rows);
    }
    /*
        The level definition defines each area as an array of strings to make
        them easier to edit by hand, but that isn't very efficent to reference
        while rendering.

        Convert the areas into arrays of arrays of numbers instead, and convert
        the tiles to an indexed array.

        This also gives us a chance to load a border around each area 1 tile
        wide based on the edges of the surrounding areas. This border will not
        be rendered but can be used for collision checking.
    */
    prepareLevelData() {
        /*
            Insert a dummy value in the tiles array because it is easier to
            check the validity of a tile value with 'if (tile)' than
            'if (!isNaN(tile))'
        */
        let newtiles = [{}];
        let newareas = {};
        let tilenames = Object.keys(this.def.tiles);
        let areanames = Object.keys(this.def.areas);
        let tilemap = {};
        /* Move the tiles into an indexed array */
        for (let i = 0, tile; tile = tilenames[i]; i++) {
            tilemap[tile] = newtiles.length;
            newtiles.push(this.def.tiles[tile]);
        }
        /* Adjust the variantOf values */
        for (let i = 0; i < newtiles.length; i++) {
            let v;
            if ((v = newtiles[i].variantOf)) {
                newtiles[i].variantOf = tilemap[v];
            }
        }
        for (let a = 0, name; name = areanames[a]; a++) {
            /*
                Convert the area into an array of arrays (from an array of
                strings) and load the border (from surrounding areas).
            */
            let data = this.loadAreaData(name);
            /* Replace the tile names with an index */
            for (let y = 0; y < data.length; y++) {
                for (let x = 0; x < data[y].length; x++) {
                    data[y][x] = [tilemap[data[y][x]]];
                }
            }
            /*
                Calculate the appropriate variant of a tile to used based on the
                tiles surrounding it. This is used for things like edges on
                water/walls etc.
            */
            let key, edges = [], vedges, options, tile, offsets;
            newareas[name] = [];
            for (let y = 0; y < data.length; y++) {
                newareas[name][y] = [];
                for (let x = 0; x < data[y].length; x++) {
                    tile = data[y][x][0];
                    /*
                        Is this a variant of another tile?

                        If so swap it out for that tile, but grab the edges
                        string from the variant first.
                    */
                    if (newtiles[tile].variantOf) {
                        vedges = newtiles[tile].edges;
                        tile = newtiles[tile].variantOf;
                    }
                    else {
                        vedges = null;
                    }
                    options = null;
                    if (newtiles[tile].edges) {
                        /*
                            Pick an appropriate portion of the tile depending on
                            what the tiles surrounding this one are.

                            Build a string to represent the edges, in the order:
                                N,E,S,W,NW,NE,SW,SE

                            Look for edges on the tile with all 8 characters,
                            then 6, then 4 since the kitty corner values may not
                            matter in most cases.
                        */
                        key = "";
                        /* Coords are off by one due to the border */
                        edges[0] = this.tileAt(x + 0 - 1, y - 1 - 1, tile, false, data, newtiles);
                        edges[1] = this.tileAt(x + 1 - 1, y + 0 - 1, tile, false, data, newtiles);
                        edges[2] = this.tileAt(x + 0 - 1, y + 1 - 1, tile, false, data, newtiles);
                        edges[3] = this.tileAt(x - 1 - 1, y + 0 - 1, tile, false, data, newtiles);
                        edges[4] = this.tileAt(x - 1 - 1, y - 1 - 1, tile, false, data, newtiles);
                        edges[5] = this.tileAt(x + 1 - 1, y - 1 - 1, tile, false, data, newtiles);
                        edges[6] = this.tileAt(x - 1 - 1, y + 1 - 1, tile, false, data, newtiles);
                        edges[7] = this.tileAt(x + 1 - 1, y + 1 - 1, tile, false, data, newtiles);
                        for (let i = 0; i < edges.length; i++) {
                            if (vedges && "1" === vedges.charAt(i)) {
                                key += "1";
                            }
                            else {
                                key += (edges[i] !== tile) ? "1" : "0";
                            }
                        }
                        options = newtiles[tile].edges[key] ||
                            newtiles[tile].edges[key.slice(0, 6)] ||
                            newtiles[tile].edges[key.slice(0, 4)] ||
                            newtiles[tile].edges["0000"];
                    }
                    if ((!options || !options.length) && newtiles[tile].options) {
                        options = newtiles[tile].options;
                    }
                    if (options && options.length > 0) {
                        /* Pick any one of the available options */
                        offsets = options[WRand() % options.length];
                    }
                    else {
                        /* Pick any tile in the image */
                        let src = newtiles[tile].src;
                        let img = src ? this.images[src] : null;
                        offsets = [
                            WRand() % ((img ? img.width : 0) / TILE_SIZE),
                            WRand() % ((img ? img.height : 0) / TILE_SIZE)
                        ];
                    }
                    if (newtiles[tile].baseOffset) {
                        offsets = [
                            offsets[0] + newtiles[tile].baseOffset[0],
                            offsets[1] + newtiles[tile].baseOffset[1]
                        ];
                    }
                    /*
                        Final value we keep for each tile is the tile index, and
                        the x and y offset in that tile's image.
                    */
                    newareas[name][y][x] = [data[y][x][0], offsets[0], offsets[1]];
                }
            }
        }
        for (let i = 0; i < newtiles.length; i++) {
            if (newtiles[i].src) {
                newtiles[i].img = this.images[newtiles[i].src];
            }
        }
        this.areas = newareas;
        this.tiles = newtiles;
    }
    findNearbyArea(ox, oy, area) {
        let name = null;
        area = area || this.area;
        for (let y = 0; y < this.def.layout.length; y++) {
            for (let x = 0; x < this.def.layout[y].length; x++) {
                if (this.def.layout[y][x] === area) {
                    if (this.def.layout[y + oy] &&
                        this.def.layout[y + oy][x + ox]) {
                        name = this.def.layout[y + oy][x + ox];
                    }
                    return (name);
                }
            }
        }
        return (null);
    }
    /*
        Determine which area the specified coords are linked to and then switch
        to that area if one is found.

        Keep in mind that this.rows includes a 1 tile border all the way arround
        from the edges of the surrounding areas. Stepping onto that border means
        the player is in the new area.

        The player coords are relative to this area though, not the border, so
        the top left corner is actually -1, -1.
    */
    switchArea(x, y, player) {
        let name;
        let ox = 0;
        let oy = 0;
        switch (typeof x) {
            case 'number':
                if (y < 0) {
                    /* Top edge of area */
                    oy = -1;
                }
                else if (y >= this.rows.length - 2) {
                    /* Bottom edge of area */
                    oy = 1;
                }
                if (x < 0) {
                    /* Left edge of area */
                    ox = -1;
                }
                else if (x >= this.rows[0].length - 2) {
                    /* Right edge of area */
                    ox = 1;
                }
                if (0 === ox && 0 === oy) {
                    return (false);
                }
                name = this.findNearbyArea(ox, oy);
                break;
            case 'string':
                name = x;
                break;
        }
        if (!name || !this.areas[name]) {
            return (false);
        }
        /*
            Prepare an image to display containing both the old and new area to
            allow sliding from one to the other.
        */
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.setAttribute('width', '' + (this.viewport.w * (ox === 0 ? 1 : 2)));
        canvas.setAttribute('height', '' + (this.viewport.h * (oy === 0 ? 1 : 2)));
        disableSmoothing(ctx);
        ctx.save();
        ctx.translate(ox < 0 ? this.viewport.w : 0, oy < 0 ? this.viewport.h : 0);
        this.render(ctx);
        ctx.restore();
        /* Now actually load the new area */
        if (!this.loadArea(name)) {
            return (false);
        }
        /* And position everything properly */
        if (player) {
            if (oy < 0) {
                /* Move player to bottom of new area */
                player.newpos.y = player.y = this.height - 1;
            }
            else if (oy > 0) {
                /* Move player to top of new area */
                player.newpos.y = player.y = 0;
            }
            if (ox < 0) {
                /* Move player to right edge of new area */
                player.newpos.x = player.x = this.width - 1;
            }
            else if (ox > 0) {
                /* Move player to left edge of new area */
                player.newpos.x = player.x = 0;
            }
            player.tick();
            this.scrollTo(true, (player.x * TILE_SIZE) + player.renderOff.x, (player.y * TILE_SIZE) + player.renderOff.y);
            /* The player has moved to the new area */
            player.area = name;
        }
        /* and render the new area to the temporary image */
        ctx.save();
        ctx.translate(ox > 0 ? this.viewport.w : 0, oy > 0 ? this.viewport.h : 0);
        this.render(ctx);
        ctx.restore();
        this.slide = {
            cake: canvas,
            area: name,
            player: player,
            // x:			ox > 0 ? 0 : this.viewport.w,
            // y:			oy > 0 ? 0 : this.viewport.h,
            x: 0,
            y: 0,
            ox: ox,
            oy: oy,
            viewport: {
                x: this.viewport.x,
                y: this.viewport.y
            }
        };
        /*
            Ensure we have done at least one tick or the slide will not be setup
            properly. Since switchArea is usually called from an actor it is often
            after the level's normal tick.
        */
        this.tick();
        return (true);
    }
    loadArea(name) {
        if (!name || !this.areas[name]) {
            return (false);
        }
        this.rows = this.areas[name];
        this.area = name;
        /* Do not include the border in the width/height */
        this.width = this.rows[0].length - 2;
        this.height = this.rows.length - 2;
        this.bake();
        /* Load the new set of actors */
        this.actors = [];
        if (!player) {
            player = new Actor("blud", this.def.actors["blud"], this, name);
        }
        player.area = name;
        this.actors.push(player);
        let ids = Object.keys(this.def.actors);
        for (let i = 0, id; id = ids[i]; i++) {
            let def = this.def.actors[id];
            if (id === "blud") {
                /* The player was added above */
                continue;
            }
            if (def.area && def.area !== name) {
                continue;
            }
            if (def.area && !isNaN(def.x) && !isNaN(def.y)) {
                this.actors.push(new Actor(id, def, this, name));
            }
            if (def.at) {
                for (let x = 0; x < def.at.length; x++) {
                    if (def.at[x].area !== name) {
                        continue;
                    }
                    this.actors.push(new Actor(id, def, this, name, def.at[x].x, def.at[x].y));
                }
            }
        }
        return (true);
    }
    /*
        Adjust the offset to ensure that the specified position (usually the
        player) is visible when the level is rendered.

        coords are in pixels, not tiles.
    */
    scrollTo(instant, x, y) {
        if (this.slide) {
            /* Don't attempt to scroll while the level is sliding a new area in */
            return;
        }
        if (!isNaN(x) && !isNaN(y)) {
            this.playerpos.x = x;
            this.playerpos.y = y;
            /* This will be moved during tick() */
            if (!instant) {
                return;
            }
        }
        else {
            x = this.playerpos.x;
            y = this.playerpos.y;
        }
        let minX = this.viewport.x + this.marginX;
        let maxX = this.viewport.x + this.viewport.w - this.marginX;
        let minY = this.viewport.y + this.marginY;
        let maxY = this.viewport.y + this.viewport.h - this.marginY;
        // console.log("x:", x, minX, maxX);
        // console.log("y:", y, minY, maxY);
        if (minX < maxX) {
            if (x < minX) {
                if (instant) {
                    this.viewport.x -= minX - x;
                }
                else {
                    this.viewport.x--;
                }
            }
            if (x >= maxX) {
                if (instant) {
                    this.viewport.x += x - maxX;
                }
                else {
                    this.viewport.x++;
                }
            }
        }
        if (minY < maxY) {
            if (y < minY) {
                if (instant) {
                    this.viewport.y -= minY - y;
                }
                else {
                    this.viewport.y--;
                }
            }
            if (y >= maxY) {
                if (instant) {
                    this.viewport.y += y - maxY;
                }
                else {
                    this.viewport.y++;
                }
            }
        }
        // console.log('now at:', this.viewport.x, this.viewport.y);
        if (this.viewport.x < 0) {
            this.viewport.x = 0;
        }
        if (this.viewport.x >= (this.width * TILE_SIZE) - this.viewport.w) {
            this.viewport.x = (this.width * TILE_SIZE) - this.viewport.w;
        }
        if (this.viewport.y < 0) {
            this.viewport.y = 0;
        }
        if (this.viewport.y >= (this.height * TILE_SIZE) - this.viewport.h) {
            this.viewport.y = (this.height * TILE_SIZE) - this.viewport.h;
        }
    }
    /* Build an image containing the entire loaded area */
    bake() {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.setAttribute('width', '' + (this.width * TILE_SIZE));
        canvas.setAttribute('height', '' + (this.height * TILE_SIZE));
        disableSmoothing(ctx);
        ctx.fillStyle = 'black';
        let square, img;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!(square = this.squareAt(x, y))) {
                    continue;
                }
                /*
                    Use this.tileAt instead of this.squareAt here because it will
                    load the variant if needed.
                */
                img = this.tiles[this.tileAt(x, y)].img;
                if (img) {
                    ctx.drawImage(img, square[1] * TILE_SIZE, square[2] * TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE * x, TILE_SIZE * y, TILE_SIZE, TILE_SIZE);
                }
                else {
                    ctx.fillRect(TILE_SIZE * x, TILE_SIZE * y, TILE_SIZE, TILE_SIZE);
                }
            }
        }
        this.cake = canvas;
    }
    tick() {
        if (this.slide) {
            this.slide.x += this.slide.ox * (this.viewport.w / this.slideFrames);
            this.slide.y += this.slide.oy * (this.viewport.h / this.slideFrames);
            /*
                The viewport is used for rendering the actors at the correct
                position, so it needs to be updated during the slide.
            */
            this.viewport.x = this.slide.viewport.x + this.slide.x;
            this.viewport.y = this.slide.viewport.y + this.slide.y;
            if (Math.abs(this.slide.x) >= this.viewport.w ||
                Math.abs(this.slide.y) >= this.viewport.h) {
                /* done */
                let player = this.slide.player;
                this.area = this.slide.area;
                this.slide = null;
                if (player) {
                    this.scrollTo(true, (player.x * TILE_SIZE) + player.renderOff.x, (player.y * TILE_SIZE) + player.renderOff.y);
                }
            }
            else {
                /* Nothing else should be active while the slide is in progress */
                return (false);
            }
        }
        this.scrollTo(false);
        /* Update the children (NPCs, other non-static objects) */
        for (let c = 0, child; child = this.children[c]; c++) {
            if (child.player || !child.area || child.area === this.area) {
                child.tick();
            }
        }
        for (let c = 0, child; child = this.actors[c]; c++) {
            if (child.player || !child.area || child.area === this.area) {
                if (!editor || child === player) {
                    child.tick();
                }
            }
        }
        return (true);
    }
    render(ctx) {
        if (this.slide) {
            /* Sliding from one area to another */
            let x = Math.abs(this.slide.ox) * Math.floor(this.slide.x);
            let y = Math.abs(this.slide.oy) * Math.floor(this.slide.y);
            if (x < 0) {
                x += this.viewport.w;
            }
            if (y < 0) {
                y += this.viewport.h;
            }
            ctx.drawImage(this.slide.cake, x, y, this.viewport.w, this.viewport.h, 0, 0, this.viewport.w, this.viewport.h);
        }
        else if (this.cake) {
            /* Here is one I prepared earlier... */
            ctx.drawImage(this.cake, this.viewport.x, this.viewport.y, this.viewport.w, this.viewport.h, 0, 0, this.viewport.w, this.viewport.h);
            /* Draw the children (NPCs, other non-static objects) */
            for (let c = 0, child; child = this.children[c]; c++) {
                if (!child.area || child.area === this.area) {
                    child.render(ctx, this.viewport.x, this.viewport.y);
                }
            }
            for (let c = 0, child; child = this.actors[c]; c++) {
                if (!child.area || child.area === this.area) {
                    if (!editor || child === player) {
                        child.render(ctx, this.viewport.x, this.viewport.y);
                    }
                }
            }
        }
    }
}
class Controls {
    constructor(actor) {
        this.actor = actor;
    }
    tick() {
    }
}
class PlayerControls extends Controls {
    constructor() {
        super(...arguments);
        this.moveFrames = 0;
    }
    isActive(state) {
        switch (state || this.actor.state) {
            case this.actor.MOVING:
            case this.actor.STUCK:
                return (true);
            default:
                return (false);
        }
    }
    tick() {
        /*
            Keep some information about the current state that may be referenced
            below after the state has changed.
        */
        let actor = this.actor;
        let orgfacing = actor.facing;
        let orgstate = actor.state;
        /* Grab the definition for this character's current action and direction */
        let def = actor.getDefinition();
        let dirs;
        if (actor.STUCK === actor.state || actor.MOVING === actor.state) {
            this.moveFrames++;
        }
        else {
            this.moveFrames = 0;
        }
        switch (actor.state) {
            case actor.STUCK:
            case actor.MOVING:
                /*
                    How many frames does it take to move this character (in this
                    state) one tile?

                    In most cases the number of frames will match the number of
                    steps, but it is also possible for the animation to repeat.
                */
                let frames = 8;
                let rate = 1;
                if (def && !isNaN(def.steps)) {
                    frames = def.steps;
                }
                else if (def && !isNaN(def.frames)) {
                    frames = def.frames;
                }
                if (def && !isNaN(def.rate)) {
                    rate = def.rate;
                }
                /* Calculate the destination coordinates */
                let movingto = null;
                if (actor.MOVING === orgstate) {
                    movingto = actor.lookingAt();
                }
                if (Math.floor(actor.frame * rate) <= frames) {
                    if (orgstate !== actor.STUCK) {
                        /*
                            If this.moveFrames < frames then the player likely
                            just tapped a direction, in which case we want to
                            allow moving one space.

                            Otherwise if a player releases the button with less
                            than half of the animation completed we want to
                            cancel early because it feels more natural.
                        */
                        dirs = input.getDirection(false);
                        if (!dirs[actor.facing] && actor.frame < 5 && this.moveFrames >= frames) {
                            /* Button was released early */
                            actor.setState(actor.STANDING);
                        }
                        else {
                            /* Animation still in progress */
                            break;
                        }
                    }
                    else {
                    }
                }
                else {
                    /* The animation has completed */
                    actor.setState(actor.STANDING);
                }
            case actor.BLINKING:
            case actor.STANDING:
                let nesw = "NESW";
                let order = "";
                let others = "";
                /*
                    Adjust the order we try each direction so that directions
                    that the actor can move to are preferred, and the last
                    direction that the actor travelled in is not preferred.

                    This should ensure that a player holding multiple directions
                    will see the expected behavior.
                        1) Holding 2 directions will cause the actor to slide
                        along a wall that is blocking movement in one of those
                        directions.

                        2) A character will zigzag when holding 2 directions
                        with nothing blocking the path.
                */
                for (let i = 0, d; (d = nesw.charAt(i)) && d.length === 1; i++) {
                    if (actor.canMove(d)) {
                        if (d !== actor.facing) {
                            order = d + order;
                        }
                        else {
                            order = order + d;
                        }
                    }
                    else {
                        others = others + d;
                    }
                }
                order = order + others;
                // debug(order);
                dirs = input.getDirection(true);
                for (let i = 0, d; (d = order.charAt(i)) && d.length > 0; i++) {
                    if (dirs[d]) {
                        actor.facing = d;
                        if (!actor.canMove(d)) {
                            /*
                                Change to the stuck state (pushing against a
                                solid block) right away. There is no need to
                                change to turning since the actor can't move so
                                no need to let the turn be cancelled.
                            */
                            actor.setState(actor.STUCK);
                        }
                        else if (orgfacing !== d && !this.isActive(orgstate)) {
                            /*
                                The character was not moving and is now turning
                                to a new direction. This state exists to provide
                                a small delay before moving so that the player
                                can turn the character in place without moving
                                by tapping a directional input.
                            */
                            actor.setState(actor.TURNING);
                            break;
                        }
                        else {
                            /* Start moving */
                            actor.setState(actor.MOVING, actor.lookingAt());
                            break;
                        }
                    }
                }
                break;
            case actor.TURNING:
                dirs = input.getDirection(false);
                if (actor.facing && !(dirs[actor.facing] & input.HELD)) {
                    /*
                        The direction input was released before the actor
                        started moving. Leave the actor on the same spot but
                        facing the new
                        direction.
                    */
                    actor.setState(actor.STANDING);
                    break;
                }
                if (actor.frame > 4) {
                    /*
                        The directional input was held long enough to complete
                        the turn and start moving in the new direction.
                    */
                    actor.setState(actor.MOVING, actor.lookingAt());
                    break;
                }
                break;
        }
        /*
            Calculate the rendering offset to use if the character is currently
            moving from one tile to another.
        */
        actor.renderOff.x = 0;
        actor.renderOff.y = 0;
        /* Grab the definition for this character's current action and direction */
        def = actor.getDefinition();
        let frames = 1;
        let rate = 1;
        if (def && !isNaN(def.steps)) {
            frames = def.steps;
        }
        else if (def && !isNaN(def.frames)) {
            frames = def.frames;
        }
        if (def && !isNaN(def.rate)) {
            rate = def.rate;
        }
        switch (actor.state) {
            default:
                break;
            case actor.MOVING:
                let steps = TILE_SIZE / frames;
                switch (actor.facing) {
                    case 'N':
                        actor.renderOff.y -= Math.floor(actor.frame * steps * rate);
                        break;
                    case 'E':
                        actor.renderOff.x += Math.floor(actor.frame * steps * rate);
                        break;
                    case 'S':
                        actor.renderOff.y += Math.floor(actor.frame * steps * rate);
                        break;
                    case 'W':
                        actor.renderOff.x -= Math.floor(actor.frame * steps * rate);
                        break;
                }
                if (Math.abs(actor.renderOff.x) >= (TILE_SIZE * 0.5) ||
                    Math.abs(actor.renderOff.y) >= (TILE_SIZE * 0.5)) {
                    switch (actor.facing) {
                        case 'N':
                            actor.renderOff.y += TILE_SIZE;
                            break;
                        case 'E':
                            actor.renderOff.x -= TILE_SIZE;
                            break;
                        case 'S':
                            actor.renderOff.y -= TILE_SIZE;
                            break;
                        case 'W':
                            actor.renderOff.x += TILE_SIZE;
                            break;
                    }
                    actor.x = actor.newpos.x;
                    actor.y = actor.newpos.y;
                    /* Did that movement take us to a different area? */
                    actor.level.switchArea(actor.x, actor.y, actor);
                }
                actor.level.scrollTo(false, (actor.x * TILE_SIZE) + actor.renderOff.x, (actor.y * TILE_SIZE) + actor.renderOff.y);
                break;
        }
    }
}
class EyeballControls extends Controls {
    constructor(actor) {
        super(actor);
        for (;;) {
            this.speedX = ((WRand() / 10) % 6) - 3;
            this.speedY = ((WRand() / 10) % 6) - 3;
            /*
                Keep grabbing random values for speed until the eyeball is
                moving in one clear main direction.

                The intent is for the eyeballs to appear to move in any
                direction but to avoid things close to a 45 degree angle because
                we don't have an appropriate animation for that case.
            */
            if (Math.abs(Math.abs(this.speedX) - Math.abs(this.speedY)) > 1.5) {
                break;
            }
        }
        // console.log(this.speedX, this.speedY);
        this.x = actor.x;
        this.y = actor.y;
        this.renderOff = {
            x: actor.renderOff.x,
            y: actor.renderOff.y
        };
        if (Math.abs(this.speedX) > Math.abs(this.speedY)) {
            if (this.speedX > 0) {
                actor.facing = "E";
            }
            else {
                actor.facing = "W";
            }
        }
        else {
            if (this.speedY < 0) {
                actor.facing = "N";
            }
            else {
                actor.facing = "S";
            }
        }
        actor.setState(actor.MOVING);
        this.frame = 0;
    }
    updateLocation() {
        let actor = this.actor;
        let x = this.renderOff.x;
        let y = this.renderOff.y;
        let mx = x > 0 ? 1 : -1;
        let my = y > 0 ? 1 : -1;
        actor.x = this.x;
        actor.y = this.y;
        while (Math.abs(x) > (TILE_SIZE / 2)) {
            actor.x += mx;
            x -= mx * TILE_SIZE;
        }
        actor.renderOff.x = x;
        while (Math.abs(y) > (TILE_SIZE / 2)) {
            actor.y += my;
            y -= my * TILE_SIZE;
        }
        actor.renderOff.y = y;
    }
    tick() {
        let actor = this.actor;
        /*
            Overwrite the frame on the actor with our own frame counter so we
            can adjust the animation speed based on the movement speed.
        */
        let fc = (Math.abs(this.speedX) + Math.abs(this.speedY)) * 1;
        if (fc < 0.01) {
        }
        this.frame += Math.min(1, fc);
        actor.frame = Math.floor(this.frame);
        if (actor.state !== actor.MOVING) {
            /* This does nothing onces it stops */
            return;
        }
        this.renderOff.x += this.speedX;
        this.renderOff.y += this.speedY;
        this.updateLocation();
        if (!actor.canMove("-") || (Math.abs(this.speedX) < 0.1 && Math.abs(this.speedY) < 0.1)) {
            this.renderOff.x -= this.speedX;
            this.renderOff.y -= this.speedY;
            this.updateLocation();
            this.speedX = this.speedY = 0;
        }
        this.speedX = this.speedX * 0.92;
        this.speedY = this.speedY * 0.92;
    }
}
var world = {
    viewport: {
        x: 15,
        y: 0,
        minwidth: 24,
        minheight: 15,
        maxwidth: 34,
        maxheight: 19,
        offset: {
            x: 0,
            y: 0
        },
        width: 0,
        height: 0
    },
    tiles: {
        "-": {
            solid: true
        },
        " ": {
            name: "ground",
            src: "images/floor.png",
            /* This number is added to all offsets defined for this tile */
            baseOffset: [1, 6],
            options: [
                [0, 0], [1, 0], [2, 0], [3, 0],
                [0, 1], [1, 1], [2, 1], [3, 1],
            ]
        },
        "o": {
            name: "plasma",
            src: "images/floor.png",
            solid: true,
            /* This number is added to all offsets defined for this tile */
            baseOffset: [14, 3],
            edges: {
                /* Entirely enclosed */
                "1111": [[0, 0]],
                /* Open on one side */
                "0111": [[2, 5]],
                "1011": [[0, 3]],
                "1101": [[3, 0]],
                "1110": [[5, 2]],
                "1100": [[4, 1]],
                "0110": [[4, 4]],
                "0011": [[1, 4]],
                "1001": [[1, 1]],
                /* Open on opposite sides */
                "0101": [[1, 8]],
                "1010": [[2, 7]],
                /* Edge on a single side */
                "1000": [[2, 1]],
                "0100": [[4, 3]],
                "0010": [[3, 4]],
                "0001": [[1, 2]],
                /* Kitty corners */
                "000010": [[1, 3]],
                "000001": [[4, 2]],
                "000011": [[3, 1]],
                "000101": [[4, 8]],
                "000111": [[4, 8]],
                "010010": [[1, 9]],
                "010011": [[1, 9]],
                "001101": [[1, 10]],
                "001111": [[1, 10]],
                "011010": [[4, 10]],
                "011011": [[4, 10]],
                "001011": [[3, 7]],
                // "001010":
                // "001001":
                /* No edges */
                "0000": [[2, 2], [2, 3], [3, 2], [3, 3]]
            }
        },
        "C": {
            name: "fat",
            src: "images/fat.png",
            solid: true,
            /* This number is added to all offsets defined for this tile */
            baseOffset: [0, 0],
            edges: {
                "1111": [[0, 0]],
                "1011": [[1, 0]],
                "1010": [[2, 0]],
                "1110": [[3, 0]],
                "1101": [[0, 1]],
                "1001": [[1, 1]],
                "1000": [[2, 1]],
                "1100": [[3, 1]],
                "0101": [[0, 2]],
                "0001": [[1, 2]],
                "0000": [[2, 2]],
                "0100": [[3, 2]],
                "0111": [[0, 3]],
                "0011": [[1, 3]],
                "0010": [[2, 3]],
                "0110": [[3, 3]],
            }
        },
        "l": {
            name: "fatleft",
            solid: true,
            /*
                This uses the tiles defined by "C" above, but with a west edge
                always on regardless of the edges that are detected.
            */
            variantOf: "C",
            "edges": "0001"
        },
        "r": {
            name: "fatright",
            solid: true,
            /*
                This uses the tiles defined by "C" above, but with a west edge
                always on regardless of the edges that are detected.
            */
            variantOf: "C",
            "edges": "0100"
        }
    },
    areas: {
        "towncenter": [
            "oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
            "oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
            "oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
            "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            "CCCCCCCCCCr       lCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            "CCCCCCCCCCrlCCr   lCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            "CCCCCCCCCCrlCCrlCrlCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            "           lCCrlCr                ooooooo                                       ",
            "               lCr                oooooooo                                      ",
            "o                                                                              o",
            "o                                oooooooo                                      o",
            "                                oooooooo                                        ",
            "                                oooooooo                                        ",
            "                                oooooooo                                        ",
            "                                 oooooooo                                       ",
            "                                 oooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                               oo ooooooo                                       "
        ],
        "towneast": [
            "oooCC                                                                           ",
            "oooCC                                                                           ",
            "oooCC                                                                           ",
            "CCCCC                                                                           ",
            "CCCCC                                                                           ",
            "CCCCC                                                                           ",
            "CCCCC                                                                           ",
            "CCCCC                                                                           ",
            "                                                                                ",
            "o                                                                               ",
            "o                                                                               ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                "
        ],
        "townwest": [
            "                                                                           CCooo",
            "                                                                           CCooo",
            "                                                                           CCooo",
            "                                                                           CCCCC",
            "                                                                           CCCCC",
            "                                                                           CCCCC",
            "                                                                           CCCCC",
            "                                                                           CCCCC",
            "                                                                                ",
            "                                                                               o",
            "                                                                               o",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                "
        ],
        "townsouth": [
            "                              oo  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       ",
            "                                  ooooooo                                       "
        ]
    },
    layout: [
        ["townwest", "towncenter", "towneast"],
        [null, "townsouth", null]
    ],
    actors: {
        "blud": {
            x: 29,
            y: 9,
            facing: "E",
            src: "images/blud.png",
            moving: {
                N: { x: 3, y: 3, rate: 0.5, frames: 8, ox: 1, oy: 0 },
                E: { x: 3, y: 0, rate: 0.5, frames: 8, ox: 1, oy: 0 },
                S: { x: 3, y: 1, rate: 0.5, frames: 8, ox: 1, oy: 0 },
                W: { x: 3, y: 2, rate: 0.5, frames: 8, ox: 1, oy: 0 }
            },
            standing: {
                N: { x: 0, y: 3 },
                E: { x: 0, y: 0 },
                S: { x: 0, y: 1 },
                W: { x: 0, y: 2 }
            },
            blinking: {
                N: { x: 1, y: 3 },
                E: { x: 1, y: 0 },
                S: { x: 1, y: 1 },
                W: { x: 1, y: 2 }
            },
            dead: {
                S: { x: 0, y: 4, src: "images/blud.png" }
            }
        },
        "arnold": {
            src: "images/split.png",
            width: 32,
            standing: {
                S: { x: 0, y: 0 },
            },
            dividing: {
                S: { x: 0, y: 0, rate: 1, frames: 18, ox: 1, oy: 0, repeat: false },
            },
            split: {
                S: { x: 17, y: 0 },
            },
        },
        "abby": {
            x: 28,
            y: 10,
            area: "towncenter",
            facing: "S",
            src: "images/npc.png",
            standing: {
                S: { x: 0, y: 0 }
            },
            blinking: {
                S: { x: 0, y: 2 }
            },
            dead: {
                S: { x: 0, y: 4, src: "images/blud.png" }
            },
            talking: {
                S: { x: 0, y: 0, rate: 0.1, frames: 2, ox: 0, oy: 1 }
            },
            dialog: [
                "What's a nice cell like you don't here?",
                "You're cute",
                [
                    "Why don't you and I get out of here",
                    "and see if we can find a nice quiet",
                    "vessel to stroll along?",
                    "",
                    "Would you like that?"
                ].join('\n')
            ]
        },
        "saul": {
            x: 9,
            y: 10,
            area: "towncenter",
            facing: "S",
            src: "images/npc.png",
            standing: {
                S: { x: 5, y: 0 }
            },
            blinking: {
                S: { x: 5, y: 2 }
            },
            talking: {
                S: { x: 5, y: 0, rate: 0.1, frames: 2, ox: 0, oy: 1 }
            },
            dead: {
                S: { x: 0, y: 4, src: "images/blud.png" }
            },
            dialog: [
                "Howdy",
                "What do you want?",
                "Why are you bugging me? Go away!"
            ]
        },
        "rotavirus": {
            at: [
                { x: 37, y: 10, area: "towncenter" },
                { x: 39, y: 10, area: "towncenter" },
                { x: 10, y: 20, area: "towncenter" },
            ],
            src: "images/enemy.png",
            standing: {
                S: { x: 2, y: 0 }
            },
            stuck: {
                S: { x: 0, y: 0, rate: 0.25, steps: 8, frames: 2, ox: 1, oy: 0 }
            },
            moving: {
                S: { x: 0, y: 0, rate: 0.25, steps: 8, frames: 2, ox: 1, oy: 0 }
            },
            dead: {
                S: { x: 0, y: 4, src: "images/blud.png" }
            }
        },
        "phage": {
            x: 20,
            y: 15,
            facing: "S",
            area: "towncenter",
            src: "images/enemy.png",
            standing: {
                S: { x: 0, y: 1, rate: 0.01, steps: 8, frames: 2, ox: 1, oy: 0 }
            },
            crouch: {
                S: { x: 2, y: 1 }
            },
            jump: {
                S: { x: 3, y: 1 }
            }
        }
    },
    items: {
        "eyeball": {
            src: "images/blud.png",
            standing: {
                S: { x: 3, y: 5 }
            },
            moving: {
                N: { x: 0, y: 6, rate: 0.5, frames: 6, ox: 1, oy: 0 },
                E: { x: 0, y: 5, rate: 0.5, frames: 6, ox: 1, oy: 0 },
                S: { x: 6, y: 6, rate: 0.5, frames: 6, ox: -1, oy: 0 },
                W: { x: 6, y: 5, rate: 0.5, frames: 6, ox: -1, oy: 0 }
            }
        }
    }
};
function MenuAction(name, value) {
    let p = null;
    if ('object' === typeof name) {
        var keys = Object.keys(name);
        for (let i = 0; i < keys.length; i++) {
            MenuAction(keys[i], name[keys[i]]);
        }
    }
    switch (name) {
        case "continue":
            break;
        case "pause":
            if (!editor) {
                p = Ask({
                    msg: "Paused",
                    choices: {
                        "continue": "Continue",
                        "edit": "Edit",
                        "about": "About",
                        "options": "Options",
                        "newgame": "New Game"
                    }
                });
            }
            else {
                p = Ask({
                    msg: "Paused",
                    choices: {
                        "continue": "Continue",
                        "edit": "Play"
                    }
                });
            }
            break;
        case "edit":
            editor = !editor;
            break;
        case "about":
            p = Ask({
                actor: {
                    actor: player,
                    action: player.MOVING,
                    facing: "E",
                    rate: 0.5
                },
                msg: [
                    "Blud is a game about a blood cell who finds himself in",
                    "one odd situation after another.\n\n",
                    "Blud was created by Micah Gorrell and Owen Swerkstrom."
                ].join(' ')
            });
            break;
        case "options":
            p = Ask({
                msg: "Options",
                choices: {
                    "remap": "Remap Controller",
                    "continue": "Cancel"
                }
            });
            break;
        case "remap":
            input.remapjs();
            break;
        case "newgame":
            var arnold = new Actor("arnold", world.actors["arnold"], level);
            arnold.state = "standing";
            p = Ask([
                {
                    actor: player,
                    msg: [
                        "Once upon a time there was a little blood cell named",
                        "Blud, but everyone called him Arnold."
                    ].join(' ')
                },
                {
                    actor: player,
                    msg: [
                        "Arnold was,",
                        "   to be blunt,",
                        "      a bit of a dick."
                    ].join('\n')
                },
                {
                    actor: player,
                    msg: "Luckily this story isn't about Arnold."
                },
                {
                    actor: {
                        actor: arnold,
                        action: "dividing",
                        delay: 20,
                        rate: 0.25
                    },
                    msg: [
                        "One day, Arnold divided, as cells do and a new cell",
                        "was born. The new cell was named Blud as well, but",
                        "everyone called them...",
                    ].join(' ')
                },
                {
                    msg: [
                        "Uh, Help me out here...",
                        "What did they call the new cell?"
                    ].join('\n'),
                    actor: player,
                    kb: true,
                    key: "nameplayer"
                }
            ]);
            break;
        case "respawn":
            player.health = 100;
            player.setState(player.STANDING);
            var arnold = new Actor("arnold", world.actors["arnold"], level);
            arnold.state = "standing";
            p = Ask([
                {
                    actor: player,
                    msg: "Uh, I thought this game was about " + player.name +
                        "... but " + player.name + " is dead."
                },
                {
                    actor: player,
                    msg: "Luckily this story isn't really about " + player.name + "."
                },
                {
                    actor: {
                        actor: arnold,
                        action: "dividing",
                        delay: 20,
                        rate: 0.25
                    },
                    msg: [
                        "Remember Arnold?\n\nArnold divided again",
                        "and a new cell was born. The new cell",
                        "was named Blud as well, but everyone",
                        "called them...",
                    ].join(' ')
                },
                {
                    msg: [
                        "Uh, Help me out here...",
                        "What did they call the new cell?"
                    ].join('\n'),
                    actor: player,
                    kb: true,
                    key: "nameplayer"
                }
            ]);
            break;
        case "nameplayer":
            if (!value) {
                value = player.name;
            }
            else {
                player.name = value;
            }
            p = Ask([
                {
                    actor: player,
                    msg: "The new cell was named Blud and everyone called them " + value + "."
                },
                {
                    actor: player,
                    msg: "This is a story about " + value + "."
                }
            ]);
            break;
    }
    if (p) {
        p.then(MenuAction)
            .catch(() => {
            ;
        });
    }
}
/*
    Copyright (c) 2010, Micah N Gorrell
    All rights reserved.

    THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED
    WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
    EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
    OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
    WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
    OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
    ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/* Mimick the random number generator used by windows */
let _seed = (new Date()).getTime();
function WRand(seed) {
    if (isNaN(seed)) {
        seed = _seed;
    }
    seed = seed % 32000;
    seed = seed * 214013 + 2531011;
    seed = seed & 4294967295;
    _seed = seed;
    return ((seed >> 16) & 32767);
}
function WRandUpdate(value) {
    _seed = ((_seed << 8) | (value & 0xff)) >>> 0;
    console.log(_seed.toString(2), value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL3V0aWwudHMiLCJzcmMvZGlhbG9nLnRzIiwic3JjL2FjdG9yLnRzIiwic3JjL2VuZW1pZXMudHMiLCJzcmMvaW5wdXQudHMiLCJzcmMvbGV2ZWwudHMiLCJzcmMvcGxheWVyLnRzIiwic3JjL3dvcmxkLnRzIiwic3JjL21lbnUudHMiLCJzcmMvd3JhbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLElBQUksTUFBTSxHQUFJLEtBQUssQ0FBQztBQUNwQixJQUFJLEtBQUssQ0FBQztBQUNWLElBQUksS0FBSyxDQUFDO0FBRVYsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFdEM7OztFQUdFO0FBQ0YsSUFBSSxVQUFVLEdBQUksSUFBSSxDQUFDO0FBRXZCO0NBSUM7QUFFRCxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFFcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3JELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBRUQsY0FBYyxLQUFLO0lBRWxCLGFBQWE7SUFDYixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFD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QUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUU3QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQzlDLElBQUksQ0FBQyxLQUFLLElBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUU5QixJQUFJLENBQUMsTUFBTSxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxD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QUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQ25CLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRztRQUVULElBQUksR0FBRyxHQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdkIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBSSxDQUFDLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsQ0FBQztRQUVOLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV2QixFQUFFLENB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LENBQUMsUUFBUSxDQUFDLENBQUM7NEJBQzdCLEtBQUssQ0FBQztvQkFDUixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxDQUFDO1FBQ1IsQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN0RCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELHVFQUF1RTtJQUN2RSxTQUFTLENBQUMsQ0FBUztRQUVsQixFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLE1BQU0sQ0FBQSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQztJQUNGLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUztRQUVSLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUUzQixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7WUFDckMsS0FBSyxHQUFHO2dCQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1lBQ3JDLEtB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QUNGLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLE1BQU0sS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0YsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRVYsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEIsS0FBSyxHQUFHO2dCQUFFLENBQUMsRUFBRSxDQUFDO2dCQUFDLEtBQUssQ0FBQztZQUNyQixLQUFLLEdBQUc7Z0JBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1lBQ3JCLEtBQUssR0FBRztnQkFBRSxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7WUFDckIsS0FBSyxHQUFHO2dCQUFFLENBQUMsRUFBRSxDQUFDO2dCQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFaEUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7WUFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQ2pDLENBQUMsQ0FBQyxDQUFDO1lBQ0YsZ0VBQWdFO1lBQ2hFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUV6QixLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQ3pDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztnQkFFekMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDakQsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDUCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDUDs7O2tCQUdFO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4QixDQUFDO0lBQ0YsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUMvQixDQUFDLENBQUMsQ0FBQztRQUNILEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxRQUFRLENBQUM7WUFDVixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcs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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxNQUFNLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFTyxZQUFZLENBQUMsSUFBSTtRQUV4QixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFFZCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDUixNQUFNLENBQUM7UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUMsRUFBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUMsRUFBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzFELElBQUksR0FBRyxDQUFDO1FBRVI7OztVQUdFO1FBQ0YsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNULEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDeEMsSUFBSSxHQUFHLENBQUM7WUFFUixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNQLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZixDQUFDO1FBQ0YsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFZixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNuQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBRVQsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN0QyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDO1lBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsSUFB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QUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQzFCOzs7Ozs7Ozs7OzBCQVVFO3dCQUNGLEdBQUcsR0FBRyxFQUFFLENBQUM7d0JBRVQsNkNBQTZDO3dCQUM3QyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBRTFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDOzRCQUN2QyxFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUN4QyxHQUFHLElBQUksR0FBRyxDQUFDOzRCQUNaLENBQUM7NEJBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ1AsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7NEJBQ3hDLENBQUM7d0JBQ0YsQ0FBQzt3QkFFRCxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7NEJBQ2hDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFL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UUFDMUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzdELEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLENBQUM7UUFDRixDQUFDO1FBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3BELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzdELEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNqQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUc7UUFFVCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoQixzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN0QixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLENBQUM7WUFFRCxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUM1QixDQUFDLEVBQUUsQ0FBQyxFQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUNoQyxDQUFDLEVBQUUsQ0FBQyxFQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0Qix1Q0FBdUM7WUFDdkMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQ2hDLENBQUMsRUFBRSxDQUFDLEVBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuQyx3REFBd0Q7WUFDeEQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDN0MsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckQsQ0FBQztZQUNGLENBQUM7WUFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxLQUFLLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDakMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDO0NBQ0Q7QUN4eEJEO0lBSUMsWUFBWSxLQUFXO1FBRXRCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJO0lBRUosQ0FBQztDQUNEO0FBRUQsb0JBQXFCLFNBQVEsUUFBUTtJQUFyQzs7UUFFQyxlQUFVLEdBQUcsQ0FBQyxDQUFDO0lBeVBoQixDQUFDO0lBdlBRLFFBQVEsQ0FBQyxLQUFLO1FBRXJCLE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbkMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN2QixLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztnQkFDcEIsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFZDtnQkFDQyxNQUFNLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQixDQUFDO0lBQ0YsQ0FBQztJQUVELElBQUk7UUFFSDs7O1VBR0U7UUFDRixJQUFJLEtBQUssR0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3hCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDN0IsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUUzQiwyRUFBMkU7UUFDM0UsSUFBSSxHQUFHLEdBQUssS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ2xDLElBQUksSUFBSSxDQUFDO1FBRVQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDakIsS0FBSyxLQUFLLENBQUMsTUFBTTtnQkFDaEI7Ozs7OztrQkFNRTtnQkFDRixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ2YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUViLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztnQkFDcEIsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUNyQixDQUFDO2dCQUVELEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDakIsQ0FBQztnQkFFRCwyQ0FBMkM7Z0JBQzNDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztnQkFFcEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUMvQixRQUFRLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM5QixDQUFDO2dCQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUM5QyxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQzlCOzs7Ozs7OzswQkFRRTt3QkFDRixJQUFJLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQzs0QkFDekUsK0JBQStCOzRCQUMvQixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFHaEMsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDUCxpQ0FBaUM7NEJBQ2pDLEtBQUssQ0FBQzt3QkFDUCxDQUFDO29CQUNGLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBTVIsQ0FBQztnQkFDRixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNQLGlDQUFpQztvQkFDakMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRWhDLENBQUM7WUFFRixLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFDcEIsS0FBSyxLQUFLLENBQUMsUUFBUTtnQkFDbEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDO2dCQUNsQixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUVoQjs7Ozs7Ozs7Ozs7OztrQkFhRTtnQkFDRixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNoRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDOzRCQUN4QixLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQzt3QkFDbkIsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDUCxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQzt3QkFDbkIsQ0FBQztvQkFDRixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNQLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUNyQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUM7Z0JBQ3ZCLGdCQUFnQjtnQkFFaEIsSUFBSSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQy9ELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2IsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7d0JBRWpCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZCOzs7Ozs4QkFLRTs0QkFDRixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDN0IsQ0FBQzt3QkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN4RDs7Ozs7OzhCQU1FOzRCQUNGLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDOzRCQUM5QixLQUFLLENBQUM7d0JBQ1AsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDUCxrQkFBa0I7NEJBQ2xCLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQzs0QkFDaEQsS0FBSyxDQUFDO3dCQUNQLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELEtBQUssQ0FBQztZQUVQLEtBQUssS0FBSyxDQUFDLE9BQU87Z0JBQ2pCLElBQUksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVqQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hEOzs7OztzQkFLRTtvQkFDRixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDL0IsS0FBSyxDQUFDO2dCQUNQLENBQUM7Z0JBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQjs7O3NCQUdFO29CQUNGLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztvQkFDaEQsS0FBSyxDQUFDO2dCQUNQLENBQUM7Z0JBQ0QsS0FBSyxDQUFDO1FBQ1IsQ0FBQztRQUVEOzs7VUFHRTtRQUNGLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QixLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFdEIsMkVBQTJFO1FBQzNFLEdBQUcsR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFNUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRWIsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDcEIsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUNyQixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDakIsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JCO2dCQUNDLEtBQUssQ0FBQztZQUVQLEtBQUssS0FBSyxDQUFDLE1BQU07Z0JBQ2hCLElBQUksS0FBSyxHQUFHLFNBQVMsR0FBRyxNQUFNLENBQUM7Z0JBRS9CLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUN0QixLQUFLLEdBQUc7d0JBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQzt3QkFBQyxLQUFLLENBQUM7b0JBQzdFLEtBQUssR0FBRzt3QkFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO3dCQUFDLEtBQUssQ0FBQztvQkFDN0UsS0FBSyxHQUFHO3dCQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUM7d0JBQUMsS0FBSyxDQUFDO29CQUM3RSxLQUFLLEdBQUc7d0JBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQzt3QkFBQyxLQUFLLENBQUM7Z0JBQzlFLENBQUM7Z0JBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FDaEQsQ0FBQyxDQUFDLENBQUM7b0JBQ0YsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ3RCLEtBQUssR0FBRzs0QkFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUM7NEJBQUMsS0FBSyxDQUFDO3dCQUNoRCxLQUFLLEdBQUc7NEJBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDOzRCQUFDLEtBQUssQ0FBQzt3QkFDaEQsS0FBSyxHQUFHOzRCQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQzs0QkFBQyxLQUFLLENBQUM7d0JBQ2hELEtBQUssR0FBRzs0QkFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUM7NEJBQUMsS0FBSyxDQUFDO29CQUNqRCxDQUFDO29CQUVELEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBRXpCLG9EQUFvRDtvQkFDcEQsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO2dCQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFDekIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUN6QyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsS0FBSyxDQUFDO1FBQ1IsQ0FBQztJQUNGLENBQUM7Q0FDRDtBQUVELHFCQUFzQixTQUFRLFFBQVE7SUFTckMsWUFBWSxLQUFXO1FBRXRCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUViLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNULElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdkM7Ozs7Ozs7Y0FPRTtZQUNGLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxLQUFLLENBQUM7WUFDUCxDQUFDO1FBQ0YsQ0FBQztRQUVELHlDQUF5QztRQUV6QyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDakIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxTQUFTLEdBQUc7WUFDaEIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwQixDQUFDLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3BCLENBQUM7UUFFRixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztZQUNwQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1AsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDcEIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNQLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBQ3BCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVPLGNBQWM7UUFFckIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUV2QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV4QixLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakIsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRWpCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3RDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2QsQ0FBQyxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUM7UUFDckIsQ0FBQztRQUNELEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV0QixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUN0QyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLENBQUMsSUFBSSxFQUFFLEdBQUcsU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFDRCxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELElBQUk7UUFFSCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRXZCOzs7VUFHRTtRQUNGLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFN0QsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFaEIsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUIsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVyQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLHNDQUFzQztZQUN0QyxNQUFNLENBQUM7UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUV0QixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNoQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLENBQUM7Q0FDRDtBQ25ZRCxJQUFJLEtBQUssR0FBRztJQUNYLFFBQVEsRUFBRTtRQUNULENBQUMsRUFBTSxFQUFFO1FBQ1QsQ0FBQyxFQUFNLENBQUM7UUFDUixRQUFRLEVBQUksRUFBRTtRQUNkLFNBQVMsRUFBSSxFQUFFO1FBQ2YsUUFBUSxFQUFJLEVBQUU7UUFDZCxTQUFTLEVBQUksRUFBRTtRQUVmLE1BQU0sRUFBSztZQUNWLENBQUMsRUFBSyxDQUFDO1lBQ1AsQ0FBQyxFQUFLLENBQUM7U0FDUDtRQUVELEtBQUssRUFBSyxDQUFDO1FBQ1gsTUFBTSxFQUFLLENBQUM7S0FDWjtJQUVELEtBQUssRUFBRTtRQUNOLEdBQUcsRUFBRTtZQUNKLEtBQUssRUFBSSxJQUFJO1NBQ2I7UUFFRCxHQUFHLEVBQUU7WUFDSixJQUFJLEVBQUksUUFBUTtZQUNoQixHQUFHLEVBQUksa0JBQWtCO1lBRXpCLCtEQUErRDtZQUMvRCxVQUFVLEVBQUcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFO1lBQ3JCLE9BQU8sRUFBRTtnQkFDUixDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUU7Z0JBQ3RDLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRTthQUN0QztTQUNEO1FBQ0QsR0FBRyxFQUFFO1lBQ0osSUFBSSxFQUFJLFFBQVE7WUFDaEIsR0FBRyxFQUFJLGtCQUFrQjtZQUN6QixLQUFLLEVBQUksSUFBSTtZQUViLCtEQUErRDtZQUMvRCxVQUFVLEVBQUcsQ0FBRSxFQUFFLEVBQUUsQ0FBQyxDQUFFO1lBRXRCLEtBQUssRUFBRTtnQkFDTix1QkFBdUI7Z0JBQ3ZCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQixzQkFBc0I7Z0JBQ3RCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFFcEIsNEJBQTRCO2dCQUM1QixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBRXBCLDJCQUEyQjtnQkFDM0IsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBRXBCLG1CQUFtQjtnQkFDbkIsUUFBUSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3RC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