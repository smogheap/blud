let TILE_SIZE = 16;
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
    console.log(lines);
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
function Level(definition, loadedcb) {
    this.def = definition;
    this.images = {};
    let tilenames = Object.keys(this.def.tiles);
    let loadCount = 1;
    let src;
    this.slideFrames = 30;
    this.marginX = TILE_SIZE * 10;
    this.marginY = TILE_SIZE * 6;
    this.viewport = { x: 0, y: 0, w: 100, h: 100 };
    this.playerpos = { x: 0, y: 0 };
    this.children = [];
    let imageLoaded = function () {
        loadCount--;
        if (0 === loadCount) {
            /* All images have now been loaded */
            this._prepareLevelData();
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
;
Level.prototype.addChild = function resize(child) {
    if (!child.area) {
        child.area = this.area;
    }
    this.children.push(child);
};
Level.prototype.resize = function resize(w, h) {
    this.viewport.w = w;
    this.viewport.h = h;
    this.scrollTo(true);
};
Level.prototype.tileAt = function tileAt(x, y, deftile, ignoreVariants, rows, tiles) {
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
};
Level.prototype.squareAt = function squareAt(x, y, rows) {
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
};
Level.prototype._loadAreaData = function _loadAreaData(name) {
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
};
/*
    The level definition defines each area as an array of strings to make them
    easier to edit by hand, but that isn't very efficent to reference while
    rendering.

    Convert the areas into arrays of arrays of numbers instead, and convert the
    tiles to an indexed array.

    This also gives us a chance to load a border around each area 1 tile wide
    based on the edges of the surrounding areas. This border will not be
    rendered but can be used for collision checking.
*/
Level.prototype._prepareLevelData = function _prepareLevelData() {
    /*
        Insert a dummy value in the tiles array because it is easier to check
        the validity of a tile value with 'if (tile)' than 'if (!isNaN(tile))'
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
            Convert the area into an array of arrays (from an array of strings)
            and load the border (from surrounding areas).
        */
        let data = this._loadAreaData(name);
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

                    If so swap it out for that tile, but grab the edges string
                    from the variant first.
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
                        Pick an appropriate portion of the tile depending on what
                        the tiles surrounding this one are.

                        Build a string to represent the edges, in the order:
                            N,E,S,W,NW,NE,SW,SE

                        Look for edges on the tile with all 8 characters, then 6,
                        then 4 since the kitty corner values may not matter in most
                        cases.
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
                    Final value we keep for each tile is the tile index, and the
                    x and y offset in that tile's image.
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
};
Level.prototype.findNearbyArea = function findNearbyArea(ox, oy, area) {
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
};
/*
    Determine which area the specified coords are linked to and then switch to
    that area if one is found.

    Keep in mind that this.rows includes a 1 tile border all the way arround
    from the edges of the surrounding areas. Stepping onto that border means the
    player is in the new area.

    The player coords are relative to this area though, not the border, so the
    top left corner is actually -1, -1.
*/
Level.prototype.switchArea = function switchArea(x, y, player) {
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
};
Level.prototype.loadArea = function loadArea(name) {
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
};
/*
    Adjust the offset to ensure that the specified position (usually the player)
    is visible when the level is rendered.

    coords are in pixels, not tiles.
*/
Level.prototype.scrollTo = function scrollTo(instant, x, y) {
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
};
/* Build an image containing the entire loaded area */
Level.prototype.bake = function bake() {
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
};
Level.prototype.tick = function tick() {
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
            child.tick();
        }
    }
    return (true);
};
Level.prototype.render = function render(ctx) {
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
                child.render(ctx, this.viewport.x, this.viewport.y);
            }
        }
    }
};
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
        case "pause":
            p = Ask({
                msg: "Paused",
                choices: {
                    "continue": "Continue",
                    "about": "About",
                    "options": "Options",
                    "newgame": "New Game"
                }
            });
            break;
        case "continue":
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL3V0aWwudHMiLCJzcmMvZGlhbG9nLnRzIiwic3JjL2FjdG9yLnRzIiwic3JjL2VuZW1pZXMudHMiLCJzcmMvaW5wdXQudHMiLCJzcmMvbGV2ZWwudHMiLCJzcmMvcGxheWVyLnRzIiwic3JjL3dvcmxkLnRzIiwic3JjL21lbnUudHMiLCJzcmMvd3JhbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLElBQUksS0FBSyxDQUFDO0FBQ1YsSUFBSSxLQUFLLENBQUM7QUFFVixJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUV0Qzs7O0VBR0U7QUFDRixJQUFJLFVBQVUsR0FBSSxJQUFJLENBQUM7QUFFdkI7Q0FJQztBQUVELGlCQUFpQixDQUFDLEVBQUUsQ0FBQztJQUVwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDckQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2YsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNkLENBQUM7QUFFRCxjQUFjLEtBQUs7SUFFbEIsYUFBYTtJQUNiLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4RCxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLEdBQUcsR0FBSSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDOUIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWxDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDWCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkIsdURBQXVEO1FBQ3ZELE1BQU0sQ0FBQSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2YsQ0FBQztBQUNGLENBQUM7QUFFRCxnQkFBZ0IsR0FBRztJQUVsQixLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLFNBQVM7SUFDVCxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuQixVQUFVLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWxELEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDUixFQUFFLElBQUksQ0FBQyxDQUFDO0lBRVIsc0RBQXNEO0lBQ3RELElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUN0QyxJQUFJLENBQUMsR0FBSSxFQUFFLEdBQUcsTUFBTSxDQUFDO0lBRXJCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hCLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDWixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVuQixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFDZixFQUFFLEVBQUUsQ0FBQyxFQUNMLENBQUMsRUFBRSxDQUFDLEVBQ0osTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUNyQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDVCxDQUFDO0FBQ0YsQ0FBQztBQUVELGVBQWUsR0FBRztJQUVqQixJQUFLLEdBQUcsQ0FBQztJQUVULEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVwQyxHQUFHLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQztRQUNqQixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsR0FBRyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFDckIsQ0FBQztBQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7SUFFL0IsSUFBSSxLQUFLLEdBQUksQ0FBQyxDQUFDO0lBQ2YsSUFBSSxNQUFNLEdBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvQyxJQUFJLEdBQUcsR0FBSyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLElBQUksTUFBTSxHQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0MsSUFBSSxJQUFJLEdBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVwQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVsQyxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFakMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxZQUFZLEdBQUcsVUFBUyxLQUFjO1FBRXpDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFDdEIsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFFdkIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSyxDQUFDLENBQUM7b0JBQ2xELENBQUMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQy9DLENBQUMsQ0FBQyxDQUFDO29CQUNGLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDUCxLQUFLLENBQUM7Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFDRCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzNELEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFNUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9FLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVsRixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFakYsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0UsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7WUFBQSxDQUFDO1lBQzdFLG1FQUFtRTtZQUVuRSxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV4RSx3REFBd0Q7WUFDeEQsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2QsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRVosZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFdkIsb0VBQW9FO1lBQ3BFLENBQUMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1lBQ3RCLENBQUMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBRXZCLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsQ0FBQztJQUNGLENBQUMsQ0FBQztJQUVGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVaLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztJQUNyQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsQ0FBQztJQUM5QyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDbEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLElBQUksS0FBSyxHQUFJLENBQUMsQ0FBQztJQUNmLElBQUksSUFBSSxDQUFDO0lBRVQsSUFBSSxnQkFBZ0IsR0FBRywwQkFBMEIsSUFBSTtRQUVwRCxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXhDOzs7VUFHRTtRQUNGLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUViLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDZixTQUFTLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQztRQUMvQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxTQUFTLEdBQUcsSUFBSSxHQUFHLFNBQVMsQ0FBQztRQUM5QixDQUFDO1FBQ0QsU0FBUyxHQUFHLElBQUksQ0FBQztRQUVqQixPQUFPLFNBQVMsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUM5QixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2IsQ0FBQztZQUVELEtBQUssRUFBRSxDQUFDO1lBQ1IsU0FBUyxJQUFJLFFBQVEsQ0FBQztRQUV2QixDQUFDO1FBRUQsWUFBWSxFQUFFLENBQUM7UUFFZixzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUViLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUNELFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWYsdURBQXVEO1FBQ3ZELEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFDbEIsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQ2pDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUM7SUFFRixLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO1FBQ3hCLDBCQUEwQjtRQUMxQixLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzdCLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFMUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDO0FDek9ILHlDQUF5QztBQUN6QyxDQUFDO0lBQ0csSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLElBQUksT0FBTyxHQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWpDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNsRixNQUFNLENBQUMscUJBQXFCO1lBQ2hDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsdUJBQXVCLENBQUMsQ0FBQztRQUVyQyxNQUFNLENBQUMsb0JBQW9CO1lBQy9CLE1BQU0sQ0FBQyxNQUFNLEdBQUcsc0JBQXNCLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsNkJBQTZCLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sQ0FBQyxxQkFBcUIsR0FBRyxVQUFTLFFBQVEsRUFBRSxPQUFPO1lBQ3JELElBQUksUUFBUSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxFQUFFLEdBQUssTUFBTSxDQUFDLFVBQVUsQ0FBQztnQkFFcEMsUUFBUSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsQ0FBQztZQUNqQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFUCxRQUFRLEdBQUcsUUFBUSxHQUFHLFVBQVUsQ0FBQztZQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2QsQ0FBUSxDQUFDO0lBQ2hCLENBQUM7SUFFRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDL0IsTUFBTSxDQUFDLG9CQUFvQixHQUFHLFVBQVMsRUFBRTtZQUNyQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDO0lBQ1QsQ0FBQztBQUNGLENBQUMsRUFBRSxDQUFDLENBQUM7QUFFTCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO0lBQy9CLHNFQUFzRTtJQUN0RSxFQUFFLENBQUMsQ0FBQyxjQUFjLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDNUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDO0FBRUgsMEJBQTBCLEdBQUc7SUFFNUIsR0FBRyxDQUFDLHdCQUF3QixHQUFJLEtBQUssQ0FBQztJQUN0QyxtRkFBbUY7SUFDbkYsR0FBRyxDQUFDLHVCQUF1QixHQUFLLEtBQUssQ0FBQztJQUN0QyxHQUFHLENBQUMscUJBQXFCLEdBQUssS0FBSyxDQUFDO0FBQ3JDLENBQUM7QUFNRCxtQkFBbUIsR0FBVyxFQUFFLEVBQWtCO0lBRWpELElBQUksR0FBRyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7SUFFdEIsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFdEIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNSLEdBQUcsQ0FBQyxNQUFNLEdBQUc7WUFDWixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVCxDQUFDLENBQUM7SUFDSCxDQUFDO0lBRUQsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDZCxNQUFNLENBQUEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNiLENBQUM7QUNwRUQsSUFBSSxNQUFNLEdBQUksSUFBSSxDQUFDO0FBQ25CLElBQUksSUFBSSxHQUFJLElBQUksQ0FBQztBQUNqQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDbEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLElBQUksUUFBUSxHQUFHO0lBQ2QsbUNBQW1DO0lBQ25DLG1DQUFtQztJQUNuQyxpQ0FBaUM7Q0FDakMsQ0FBQztBQUNGLElBQUksV0FBVyxHQUFHO0lBQ2pCLFFBQVEsRUFBRyxDQUFFLEdBQUcsRUFBRSxDQUFDLENBQUU7SUFDckIsUUFBUSxFQUFHLENBQUUsR0FBRyxFQUFFLENBQUMsQ0FBRTtJQUNyQixRQUFRLEVBQUcsQ0FBRSxHQUFHLEVBQUUsQ0FBQyxDQUFFO0lBQ3JCLFFBQVEsRUFBRyxDQUFFLEdBQUcsRUFBRSxDQUFDLENBQUU7Q0FDckIsQ0FBQztBQUVGLElBQUksTUFBTSxHQUFHO0lBQ1osYUFBYTtJQUNiLGFBQWE7SUFDYixhQUFhO0lBQ2IsYUFBYTtDQUNiLENBQUM7QUFFRiwrREFBK0Q7QUFDL0QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDL0MsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRSxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUUsQ0FBQztJQUNyRCxDQUFDO0FBQ0YsQ0FBQztBQUVELFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxVQUFTLEdBQUc7SUFDeEMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDO0FBRUgsa0JBQWtCLEdBQTZCLEVBQUUsR0FBUSxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsS0FBYyxFQUFFLE9BQWlCO0lBRWpILEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsQ0FBQztRQUVOLEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxHQUFHLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNkLDZCQUE2QjtZQUM3QixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQ2QsU0FBUyxHQUFHLEtBQUssRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQ2hCLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3BDLFNBQVMsRUFBRSxTQUFTLEVBQ3BCLENBQUMsRUFBRSxDQUFDLEVBQ0osU0FBUyxHQUFHLEtBQUssRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNELENBQUMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLENBQUM7QUFDRixDQUFDO0FBRUQ7OztFQUdFO0FBQ0Ysb0JBQW9CLEdBQTZCLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLFNBQWtCO0lBRWxILEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNYLEdBQUcsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBRTFCOzs7TUFHRTtJQUNGLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBRyxTQUFTLEVBQUUsQ0FBQztRQUN0QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksU0FBUyxFQUFFLENBQUM7WUFDdkMsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO1lBQ2IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRVgsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNULENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDO2dCQUNsQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ1QsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNYLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztnQkFDbEIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNULENBQUM7WUFFRCxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFDaEIsRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUM1QixFQUFFLEdBQUcsQ0FBQyxFQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUcsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDRixDQUFDO0lBQ0QsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDN0MsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2YsQ0FBQztBQUVELG9CQUFvQixHQUFXLEVBQUUsUUFBZ0I7SUFFaEQsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ2YsSUFBSSxHQUFHLEdBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixJQUFJLElBQUksQ0FBQztJQUVULE9BQU8sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM3QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pCLFFBQVEsQ0FBQztRQUNWLENBQUM7UUFFRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLElBQUksSUFBSSxDQUFDO1FBRVQsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNWLE9BQU8sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUMvQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixJQUFJLElBQUksR0FBRyxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksSUFBSSxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsQ0FBQztJQUNGLENBQUM7SUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLE1BQU0sQ0FBQSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2YsQ0FBQztBQWNvRCxDQUFDO0FBQ1AsQ0FBQztBQWlGaEQsYUFBYSxPQUFZO0lBRXhCLE1BQU0sQ0FBQSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU07UUFDbEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFLO1lBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sR0FBRyxDQUFDLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELEtBQUssT0FBTztnQkFDWCxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO2dCQUM5QyxLQUFLLENBQUM7WUFFUCxLQUFLLFFBQVE7Z0JBQ1osSUFBSSxDQUFDLEdBQUc7b0JBQ1AsR0FBRyxFQUFHLE9BQU87b0JBQ2IsT0FBTyxFQUFFLE9BQU87aUJBQ2hCLENBQUM7Z0JBQ0YsT0FBTyxHQUFHLENBQUMsQ0FBQztnQkFDWixLQUFLLENBQUM7WUFFUDtnQkFDQyxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFDMUIsS0FBSyxDQUFDO1FBQ1IsQ0FBQztRQUVELElBQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7SUFtQ0MsWUFBWSxPQUFZO1FBOUJoQixVQUFLLEdBQWlCLElBQUksQ0FBQztRQUMzQixTQUFJLEdBQWUsSUFBSSxDQUFDO1FBQ3hCLFlBQU8sR0FBYyxJQUFJLENBQUM7UUFDMUIsVUFBSyxHQUFPLENBQUMsQ0FBQztRQUNkLFVBQUssR0FBTyxDQUFDLENBQUM7UUFDZCxVQUFLLEdBQU8sQ0FBQyxDQUFDO1FBQ2QsVUFBSyxHQUFPLEtBQUssQ0FBQztRQUNsQixZQUFPLEdBQU8sS0FBSyxDQUFDO1FBQ3BCLFlBQU8sR0FBTyxJQUFJLENBQUM7UUFDbkIsWUFBTyxHQUFPLElBQUksQ0FBQztRQUNuQixXQUFNLEdBQU8sS0FBSyxDQUFDO1FBQ25CLFFBQUcsR0FBUSxFQUFFLENBQUM7UUFDZCxhQUFRLEdBQU0sQ0FBQyxDQUFDO1FBQ2hCLFNBQUksR0FBTyxJQUFJLENBQUM7UUFDaEIsT0FBRSxHQUFRLEtBQUssQ0FBQztRQUNoQixRQUFHLEdBQVEsSUFBSSxDQUFDO1FBQ2hCLFVBQUssR0FBTyxDQUFDLENBQUM7UUFDZCxVQUFLLEdBQU8sRUFBRSxDQUFDO1FBQ2YsY0FBUyxHQUFNLEVBQUUsQ0FBQztRQU1sQixXQUFNLEdBQU8sS0FBSyxDQUFDO1FBQ25CLFlBQU8sR0FBTyxLQUFLLENBQUM7UUFPM0IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7WUFDcEIsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDakMsT0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUVEOzs7VUFHRTtRQUNGLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxHQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQy9CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUMvQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBSSxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzlCLElBQUksQ0FBQyxJQUFJLEdBQUksT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsRUFBRSxHQUFLLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBSSxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUksT0FBTyxDQUFDLEtBQUssSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzNDLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDO1FBRXJELElBQUksQ0FBQyxHQUFHLEdBQUksT0FBTyxDQUFDLEdBQUcsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3JDLElBQUksS0FBSyxHQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXRDLElBQUksQ0FBQyxHQUFHLEdBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNuQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUM1QixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEtBQUssR0FBRztvQkFDWixLQUFLLEVBQUcsT0FBTyxDQUFDLEtBQWM7b0JBQzlCLE1BQU0sRUFBRyxHQUFHO29CQUNaLE1BQU0sRUFBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU87aUJBQzlCLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQzlELElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUNqRSxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDaEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNQLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUV4QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBRWxCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUN0QyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUM1QixJQUFJLENBQUMsS0FBSyxHQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFFOUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQ2xDLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLEdBQUcsR0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFM0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDYix5REFBeUQ7WUFDekQsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsdUNBQXVDO1FBQ3ZDLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUVoQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNsQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLENBQUM7UUFDZCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUzQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUU3QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQzlDLElBQUksQ0FBQyxLQUFLLElBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUU5QixJQUFJLENBQUMsTUFBTSxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLDRDQUE0QztZQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxRixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDbEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMvQixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcs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QUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRztRQUVULElBQUksR0FBRyxHQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdkIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBSSxDQUFDLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsQ0FBQztRQUVOLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV2QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxD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QUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEQsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFRCx1RUFBdUU7SUFDdkUsU0FBUyxDQUFDLENBQVM7UUFFbEIsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUEsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxNQUFNLENBQUEsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUM7SUFDRixDQUFDO0lBQUEsQ0FBQztJQUVGLFNBQVM7UUFFUixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFM0IsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDckIsS0FBSyxHQUFHO2dCQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1lBQ3JDLEtBQUssR0FBRztnQkFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUFDLEtBQUssQ0FBQztZQUNyQyxLQUFLLEdBQUc7Z0JBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7WUFDckMsS0FBSyxHQUFHO2dCQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxNQUFNLENBQUEsQ0FBQyxJQUFJ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Q0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWQ7WUFDQyxNQUFNLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQixDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBRUYsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRztJQUVuQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDN0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDNUIsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUc7SUFFbkMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzdCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDNUIsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUc7SUFFbEM7Ozs7TUFJRTtJQUNGLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdkIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBRWpCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEMsTUFBTSxDQUFDO0lBQ1IsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDO0lBQ1IsQ0FBQztJQUVELElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENB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dUJBQXVCLElBQUk7SUFFMUQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRWQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFN0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1IsTUFBTSxDQUFDO0lBQ1IsQ0FBQztJQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEVBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEVBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRCxJQUFJLEdBQUcsQ0FBQztJQUVSOzs7TUFHRTtJQUNGLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDVCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3hDLElBQUksR0FBRyxDQUFDO1FBRVIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFH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RSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDaEMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxpQ0FBaUM7SUFDakMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLENBQUM7UUFFTixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7SUFDRixDQUFDO0lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDaEQ7OztVQUdFO1FBQ0YsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVwQywwQ0FBMEM7UUFDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO1lBQ3RDLENBQUM7UUFDRixDQUFDO1FBRUQ7Ozs7VUFJRTtRQUNGLElBQUksR0FBRyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDO1FBRXBELFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUV2QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckI7Ozs7O2tCQUtFO2dCQUNGLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDOUIsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQ2pDLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ1AsTUFBTSxHQUFHLElBQUksQ0FBQztnQkFDZixDQUFDO2dCQUVELE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2YsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQzFCOzs7Ozs7Ozs7O3NCQVVFO29CQUNGLEdBQUcsR0FBRyxFQUFFLENBQUM7b0JBRVQsNkNBQTZDO29CQUM3QyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFFLEtB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Q0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTNELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFDNUIsQ0FBQyxFQUFFLENBQUMsRUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFDaEMsQ0FBQyxFQUFFLENBQUMsRUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEIsdUNBQXVDO1FBQ3ZDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENB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dUI7Z0JBQ3ZCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQixzQkFBc0I7Z0JBQ3RCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFFcEIsNEJBQTRCO2dCQUM1QixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBRXBCLDJCQUEyQjtnQkFDM0IsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBRXBCLG1CQUFtQjtnQkFDbkIsUUFBUSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3RCLFFB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