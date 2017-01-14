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
        /* Set the seed */
        WRand((new Date()).getTime());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL3V0aWwudHMiLCJzcmMvZGlhbG9nLnRzIiwic3JjL2FjdG9yLnRzIiwic3JjL2VuZW1pZXMudHMiLCJzcmMvaW5wdXQudHMiLCJzcmMvbGV2ZWwudHMiLCJzcmMvcGxheWVyLnRzIiwic3JjL3dvcmxkLnRzIiwic3JjL21lbnUudHMiLCJzcmMvd3JhbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLElBQUksTUFBTSxHQUFJLEtBQUssQ0FBQztBQUNwQixJQUFJLEtBQUssQ0FBQztBQUNWLElBQUksS0FBSyxDQUFDO0FBRVYsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFdEM7OztFQUdFO0FBQ0YsSUFBSSxVQUFVLEdBQUksSUFBSSxDQUFDO0FBRXZCO0NBSUM7QUFFRCxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFFcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3JELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBRUQsY0FBYyxLQUFLO0lBRWxCLGFBQWE7SUFDYixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFD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QUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUU3QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQzlDLElBQUksQ0FBQyxLQUFLLElBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUU5QixJQUFJLENBQUMsTUFBTSxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxD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QUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQ25CLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRztRQUVULElBQUksR0FBRyxHQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdkIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBSSxDQUFDLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsQ0FBQztRQUVOLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV2QixFQUFFLENB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LENBQUMsUUFBUSxDQUFDLENBQUM7NEJBQzdCLEtBQUssQ0FBQztvQkFDUixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxDQUFDO1FBQ1IsQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN0RCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELHVFQUF1RTtJQUN2RSxTQUFTLENBQUMsQ0FBUztRQUVsQixFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLE1BQU0sQ0FBQSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQztJQUNGLENBQUM7SUFBQSxDQUFDO0lBRUYsU0FBUztRQUVSLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUUzQixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7WUFDckMsS0FBSyxHQUFHO2dCQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1lBQ3JDLEtB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QUNGLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLE1BQU0sS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0YsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FB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LEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxRQUFRLENBQUM7WUFDVixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcs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SyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUUsQ0FBQztZQUVsQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUVoQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV0QyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBRSxDQUFDO1lBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBRyxDQUFDO1lBRzVDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFFdkMsZ0JBQWdCO1lBQ2hCLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLEVB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QUFJLEdBQUcsRUFBRSxDQUFDO1FBRWQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFN0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1IsTUFBTSxDQUFDO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEVBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEVBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFJLEdBQUcsQ0FBQztRQUVSOzs7VUFHRTtRQUNGLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDVCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLElBQUksR0FBRyxDQUFDO1lBRVIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FB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Qzt3QkFDMUI7Ozs7Ozs7Ozs7MEJBVUU7d0JBQ0YsR0FBRyxHQUFHLEVBQUUsQ0FBQzt3QkFFVCw2Q0FBNkM7d0JBQzdDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzt3QkFFMUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3ZDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ3hDLEdBQUcsSUFBSSxHQUFHLENBQUM7NEJBQ1osQ0FBQzs0QkFBQyxJQUFJLENBQUMsQ0FBQztnQ0FDUCxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQzs0QkFDeEMsQ0FBQzt3QkFDRixDQUFDO3dCQUVELE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzs0QkFDaEMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxD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QUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDcEQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksS0FBSyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRztRQUVULEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLHNDQUFzQztZQUN0QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxHQUFHLElB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TyxFQUFHLE1BQU07U0FDaEI7UUFDRCxHQUFHLEVBQUU7WUFDSixJQUFJLEVBQUksVUFBVTtZQUNsQixLQUFLLEVBQUksSUFBSTtZQUViOzs7Y0FHRTtZQUNGLFNBQVMsRUFBRyxHQUFHO1lBQ2YsT0FBTyxFQUFHLE1BQU07U0FDaEI7S0FFRDtJQUVELEtBQUssRUFBRTtRQUNOLFlBQVksRUFBRTtZQUNiLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7U0FDbEY7UUFFRCxVQUFVLEVBQUU7WUFDWCxrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1NBQ2xGO1FBRUQsVUFBVSxFQUFFO1lBQ1gsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtTQUNsRjtRQUVELFdBQVcsRUFBRTtZQUNaLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRixrRkFBa0Y7U0FDbEY7S0FDRDtJQUVELE1BQU0sRUFBRTtRQUNQLENBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUU7UUFDeEMsQ0FBRSxJQUFJLEVBQUksV0FBVyxFQUFFLElBQUksQ0FBRztLQUM5QjtJQUVELE1BQU0sRUFBRTtRQUNQLE1BQU0sRUFBRTtZQUNQLENBQUMsRUFBSyxFQUFFO1lBQ1IsQ0FBQyxFQUFLLENBQUM7WUFDUCxNQUFNLEVBQUksR0FBRztZQUNiLEdBQUcsRUFBSSxpQkFBaUI7WUFFeEIsTUFBTSxFQUFFO2dCQUNQLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUNyRCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDckQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3JELENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2FBQ3JEO1lBRUQsUUFBUSxFQUFFO2dCQUNULENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDakIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNqQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2pCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTthQUNqQjtZQUVELFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2pCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDakIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxF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