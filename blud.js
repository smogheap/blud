var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TILE_SIZE = 16;
var input;
var level;
var hud = loadImage('images/hud.png');
/*
    This will be true for the first frame only, and can be used for debug
    purposes to avoid printing debug messages at 60fps.
*/
var firstframe = true;
var coord = (function () {
    function coord() {
    }
    return coord;
}());
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
        new Dialog({
            msg: "Paused",
            choices: ["Continue", "About", "Options", "New Game"],
            closecb: function (selected) {
                /*
                    Clear any additional pause events that may have happened
                    while the game was paused.
                */
                input.getButton(input.PAUSE, true);
                switch (selected) {
                    default:
                    case 0:
                        break;
                    case 1:
                        new Dialog({
                            actor: {
                                actor: player,
                                action: player.MOVING,
                                facing: "E",
                                rate: 0.5
                            },
                            msg: [
                                "Blud is a game about a blood",
                                "cell who finds himself in",
                                "one odd situation after",
                                "another.",
                                "",
                                "Blud was created by Micah",
                                "Gorrell and Owen Swerkstrom."
                            ].join('\n')
                        });
                        break;
                    case 2:
                        new Dialog({
                            msg: "Options",
                            choices: ["Remap Controller", "Cancel"],
                            closecb: function (selected) {
                                switch (selected) {
                                    case 0:
                                        input.remapjs();
                                        break;
                                    default:
                                    case 1:
                                        break;
                                }
                            }
                        });
                        break;
                    case 3:
                        var arnold = new Actor("arnold", world.actors["arnold"], level);
                        arnold.state = "standing";
                        new Dialog([
                            { actor: player, msg: [
                                    "Once upon a time there was a little",
                                    "blood cell named Blud, but everyone",
                                    "called him Arnold."
                                ].join('\n') },
                            { actor: player, msg: [
                                    "Arnold was,",
                                    "   to be blunt,",
                                    "      a bit of a dick."
                                ].join('\n') },
                            { actor: player, msg: [
                                    "Luckily this story isn't about Arnold."
                                ].join('\n') },
                            {
                                actor: {
                                    actor: arnold,
                                    action: "dividing",
                                    delay: 20,
                                    rate: 0.25
                                },
                                msg: [
                                    "One day, Arnold divided, as cells",
                                    "do and a new cell was born. The new",
                                    "cell was named Blud as well, but",
                                    "everyone called it...",
                                ].join('\n')
                            },
                            {
                                msg: [
                                    "Uh, Help me out here...",
                                    "What did they call the",
                                    "new cell?"
                                ].join('\n'),
                                actor: player,
                                kb: true,
                                closecb: function (name) {
                                    if (!name) {
                                        name = "Sue";
                                    }
                                    new Dialog([
                                        {
                                            actor: player,
                                            msg: [
                                                "The new cell was named Blud and",
                                                "everyone called them " + name + "."
                                            ].join('\n')
                                        },
                                        {
                                            actor: player,
                                            msg: [
                                                "This is a story about " + name + "."
                                            ].join('\n')
                                        },
                                    ]);
                                }
                            }
                        ]);
                        break;
                }
            }
        });
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
var dialog = null;
var font = null;
var fontSizeX = 8;
var fontSizeY = 8;
var fontkeys = [
    " !\"#$%^'()*+,-./0123456789:;<=>?",
    "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_",
    "`abcdefghijklmnopqrstuvwxyz{|}~"
];
var fontOffsets = {
    pointer0: [256, 0],
    pointer1: [256, 0],
    pointer2: [264, 8],
    pointer3: [264, 8]
};
var kbkeys = [
    "ABCDEFGHIJK",
    "LMNOPQRSTUV",
    "WXYZ-.,~`&_",
    "0123456789 "
];
/* Build a table with offsets for each displayable character */
for (var y = 0, line = void 0; line = fontkeys[y]; y++) {
    for (var x = 0, key = void 0; (key = line.charAt(x)) && key.length == 1; x++) {
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
    for (var i = 0; i < str.length; i++) {
        var c = void 0;
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
    for (var x = 0; x < w; x += fontSizeX) {
        for (var y = 0; y < h; y += fontSizeY) {
            var sx = 272;
            var sy = 0;
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
;
;
var Dialog = (function () {
    function Dialog(options) {
        this.actor = null;
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
        this.msg = options.msg || this.msg;
        this.value = options.value || this.value;
        this.maxLength = options.maxLength || this.maxLength;
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
        if (options.choices && options.choices.length > 0) {
            this.choices = options.choices;
        }
        var lines = this.msg.split('\n');
        this.lineCount = lines.length;
        this.height = lines.length;
        this.width = lines[0].length;
        for (var i = 1; i < lines.length; i++) {
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
        var longest = 0;
        if (this.choices) {
            for (var i = 0, o = void 0; o = this.choices[i]; i++) {
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
            var y = 8 + ((this.height * fontSizeY) / 2) - (this.icon[4] / 2);
            this.ctx.drawImage(this.icon[0], this.icon[1], this.icon[2], this.icon[3], this.icon[4], 8, y, this.icon[3], this.icon[4]);
        }
        dialog = this;
        return (this);
    }
    Dialog.prototype.close = function () {
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
                if (this.kb) {
                    this.closecb(this.value);
                }
                else {
                    this.closecb(this.selected);
                }
            }
        }
        else if (!this.closing) {
            /* Reset ticks - Count down now that we're closing */
            this.ticks = this.steps;
            this.closing = true;
        }
    };
    Dialog.prototype.handleKBEvent = function (name, key, upper) {
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
    };
    Dialog.prototype.tick = function () {
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
                            var keys = kbkeys.join('');
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
                var dirs = input.getDirection(true);
                if (!this.closing && this.drawLimit >= this.msg.length) {
                    var total = void 0;
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
                        var kblen = kbkeys.join("").length;
                        /* There are currently 3 buttons (Shift, Del, End) */
                        total = kblen + 3;
                        if (dirs[input.N] & input.PRESSED) {
                            if (this.selected >= kblen) {
                                var i = this.selected - kblen;
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
                                var i = this.selected - kblen;
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
            var longest = 0;
            if (this.choices) {
                for (var i = 0, o = void 0; o = this.choices[i]; i++) {
                    longest = Math.max(longest, o.length);
                }
                for (var i = 0, o = void 0; o = this.choices[i]; i++) {
                    while (o.length < longest) {
                        o += " ";
                    }
                    drawText(this.ctx, i === this.selected ? [0] : " ", fontSizeX * (1 + this.width - longest), fontSizeY * (this.height + 2 + i));
                    drawText(this.ctx, o, fontSizeX * (2 + this.width - longest), fontSizeY * (this.height + 2 + i));
                }
            }
            else if (this.kb) {
                var i = 0;
                for (var x_1 = 0; x_1 < this.maxLength; x_1++) {
                    drawText(this.ctx, this.value.charAt(x_1) || ' ', (x_1 + 3) * fontSizeX, (this.lineCount + 2) * fontSizeY);
                }
                for (var y_1 = 0; y_1 < kbkeys.length; y_1++) {
                    for (var x_2 = 0; x_2 < kbkeys[y_1].length; x_2++) {
                        drawText(this.ctx, i === this.selected ? [0] : " ", ((x_2 * 2) + 2) * fontSizeX, (fontSizeY * (y_1 + this.lineCount + 4)));
                        drawText(this.ctx, this.upper ?
                            kbkeys[y_1].charAt(x_2) : kbkeys[y_1].charAt(x_2).toLowerCase(), ((x_2 * 2) + 3) * fontSizeX, (fontSizeY * (y_1 + this.lineCount + 4)));
                        i++;
                    }
                }
                var choices = ["Shift", "Del", "End"];
                var x_3 = 8;
                for (var o = 0; o < choices.length; o++) {
                    drawText(this.ctx, i === this.selected ? [0] : " ", (x_3++) * fontSizeX, (fontSizeY * (kbkeys.length + this.lineCount + 4)));
                    drawText(this.ctx, choices[o], (x_3) * fontSizeX, (fontSizeY * (kbkeys.length + this.lineCount + 4)));
                    i++;
                    x_3 += choices[o].length + 1;
                }
            }
            return;
        }
        var x = 0;
        var y = 0;
        for (var i = 0; i < this.drawLimit; i++) {
            var c = this.msg.charAt(i);
            var oy = 0;
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
    };
    Dialog.prototype.render = function (ctx) {
        var img = this.canvas;
        var perx = Math.min(this.ticks / this.steps, 1);
        var pery = Math.min(this.ticks / this.steps, 1);
        if (!img || !ctx || this.closed) {
            return;
        }
        var w = Math.floor(perx * img.width);
        var h = Math.floor(pery * img.height);
        var x = Math.floor(ctx.canvas.width / 2);
        var y;
        x -= Math.floor(w / 2);
        if (this.spoken) {
            y = (ctx.canvas.height - 15) - h;
        }
        else {
            y = Math.floor(ctx.canvas.height / 2);
            y -= Math.floor(h / 2);
        }
        if (this.actor) {
            var rate = this.actor.rate;
            var delay = this.actor.delay || 0;
            var ticks = void 0;
            if (isNaN(rate)) {
                rate = 1.0;
            }
            ticks = Math.floor(this.ticks * rate);
            ticks -= delay;
            if (ticks < 0) {
                ticks = 0;
            }
            var ay = 8 + ((this.height * fontSizeY) / 2) - (this.actor.actor.height / 2);
            this.ctx.fillRect(8, ay, this.actor.actor.width, this.actor.actor.height);
            this.actor.actor.renderState(this.ctx, this.actor.action, this.actor.facing, ticks, 8, ay);
        }
        ctx.drawImage(img, 0, 0, img.width, img.height, x, y, perx * img.width, pery * img.height);
    };
    return Dialog;
}());
var player = null;
var actornum = 0;
var Actor = (function () {
    // TODO Set the right type for level
    function Actor(id, definition, level, area, x, y) {
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
    Actor.prototype.getDefinition = function (state, direction) {
        var def = null;
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
    };
    Actor.prototype.isAt = function (x, y) {
        if (x === this.x && y === this.y) {
            return (true);
        }
        if (x === this.newpos.x && y === this.newpos.y) {
            return (true);
        }
        return (false);
    };
    /*
        Return the distance between this actor and the one specified in pixels
        taking into account the rendering offset.
    */
    Actor.prototype.distance = function (actor) {
        var x1 = (this.x * TILE_SIZE) + this.renderOff.x;
        var y1 = (this.y * TILE_SIZE) + this.renderOff.y;
        var x2 = (actor.x * TILE_SIZE) + actor.renderOff.x;
        var y2 = (actor.y * TILE_SIZE) + actor.renderOff.y;
        // console.log(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
        return (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    };
    Actor.prototype.setState = function (state, dest) {
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
    };
    // TODO Add a direction arg
    // TODO Knock back?
    Actor.prototype.damage = function (ammount) {
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
            }
        }
    };
    Actor.prototype.talk = function () {
        // TODO Add actual logic to control what the actor can say
        if (!this.definition.dialog) {
            return;
        }
        var def = this.getDefinition(this.STANDING, "S");
        var msg = this.definition.dialog[this.frame % this.definition.dialog.length];
        var src = def.src || this.definition.src;
        var img;
        if (!(img = this.level.images[src])) {
            img = this.level.images[src] = loadImage(src);
        }
        new Dialog({
            actor: this,
            msg: msg,
            spoken: true
        });
    };
    Actor.prototype.canMove = function (direction, mindistance) {
        var tile;
        var x = this.x;
        var y = this.y;
        var ax;
        var ay;
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
        for (var a = 0, actor = void 0; actor = level.actors[a]; a++) {
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
    };
    Actor.prototype.tick = function () {
        /* this.frames resets when the state changes, this.ticks does not */
        this.ticks++;
        this.frame++;
        if (this.controls && this.controls.tick) {
            this.controls.tick();
        }
        /* Grab the definition for this character's current action and direction */
        var def = this.getDefinition(this.state, this.facing);
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
        for (var c = 0, child = void 0; child = this.children[c]; c++) {
            child.tick();
        }
    };
    /* Return true if this actor should be rendered on the specified row */
    Actor.prototype.renderRow = function (y) {
        if ('S' === this.facing && this.MOVING === this.state) {
            return (y === this.y + 1);
        }
        else {
            return (y === this.y);
        }
    };
    ;
    Actor.prototype.lookingAt = function () {
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
    };
    Actor.prototype.render = function (ctx, wx, wy) {
        /* Which tile (relative to the viewport) is the actor on */
        var x = (this.x * TILE_SIZE) - wx;
        var y = (this.y * TILE_SIZE) - wy;
        /* Add the offset if the character is moving between tiles */
        x += this.renderOff.x;
        y += this.renderOff.y;
        this.renderState(ctx, this.state, this.facing, this.frame, x, y);
        for (var c = 0, child = void 0; child = this.children[c]; c++) {
            child.render(ctx, wx, wy);
        }
    };
    ;
    Actor.prototype.renderState = function (ctx, state, facing, ticks, x, y) {
        /* Grab the definition for this character's current action and direction */
        var def = this.getDefinition(state, facing);
        var src = def.src || this.definition.src;
        var img;
        if (!src) {
            return;
        }
        if (!(img = this.level.images[src])) {
            img = this.level.images[src] = loadImage(src);
        }
        /* How many frames are there for this state? */
        var frames = 1;
        var rate = 1;
        var frame;
        if (def && !isNaN(def.frames)) {
            frames = def.frames;
        }
        if (def && !isNaN(def.rate)) {
            rate = def.rate;
        }
        /* Determine which frame to use */
        var sx = def.x;
        var sy = def.y;
        frame = Math.floor(ticks * rate);
        if (def.repeat !== undefined && !def.repeat && frame >= frames) {
            frame = frames - 1;
        }
        sx += (frame % frames) * (def.ox || 0);
        sy += (frame % frames) * (def.oy || 0);
        ctx.drawImage(img, sx * this.width, sy * this.height, this.width, this.height, x, y, this.width, this.height);
    };
    return Actor;
}()); /* End of Actor class */
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
var InputHandler = (function () {
    function InputHandler(canvas) {
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
    InputHandler.prototype.getDirection = function (clear) {
        this._direction.N = 0;
        this._direction.E = 0;
        this._direction.S = 0;
        this._direction.W = 0;
        /* Merge results from the keyboard */
        for (var i = 0, b = void 0; b = this.bindings.kb[i]; i++) {
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
        for (var i = 0, b = void 0; b = this.bindings.js[i]; i++) {
            if (!b || !b.key) {
                continue;
            }
            if (-1 != this.directions.indexOf(b.action)) {
                for (var p = 0; p < this.devices.js.length; p++) {
                    this._direction[b.action] |= this.devices.js[p][b.key];
                    if (clear) {
                        this.devices.js[p][b.key] &= ~this.PRESSED;
                    }
                }
            }
        }
        return (this._direction);
    };
    ;
    InputHandler.prototype.getButton = function (name, clear) {
        var btn = 0;
        if (this.devices.other[name]) {
            btn |= this.devices.other[name];
            if (clear) {
                this.devices.other[name] &= ~this.PRESSED;
            }
        }
        /* Merge results from the keyboard */
        for (var i = 0, b = void 0; b = this.bindings.kb[i]; i++) {
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
        for (var i = 0, b = void 0; b = this.bindings.js[i]; i++) {
            if (!b || !b.key || name !== b.action) {
                continue;
            }
            for (var p = 0; p < this.devices.js.length; p++) {
                btn |= this.devices.js[p][b.key];
                if (clear) {
                    this.devices.js[p][b.key] &= ~this.PRESSED;
                }
            }
        }
        return (btn);
    };
    ;
    InputHandler.prototype.clearPressed = function (device) {
        var keys = Object.keys(device);
        for (var i = 0, key = void 0; key = keys[i]; i++) {
            if (!isNaN(device[key])) {
                device[key] &= ~this.PRESSED;
            }
        }
    };
    ;
    InputHandler.prototype.getGamepads = function () {
        var gamepads;
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
    };
    ;
    /*
        Some devices (gamepads with the current js API for example) require polling
        instead of acting on events. Calling this function as frequently as possible
        is required to avoid missing button presses on these devices.
    */
    InputHandler.prototype.poll = function () {
        var gamepads = this.getGamepads();
        if (!gamepads[0]) {
            return [];
        }
        for (var i = 0, pad = void 0; pad = gamepads[i]; i++) {
            if (!this.devices.js[i]) {
                this.devices.js[i] = {};
                this.devices.js[i].id = pad.id;
            }
            if (!this.timestamps.js[i]) {
                this.timestamps.js[i] = {};
            }
            for (var a = 0; a < pad.axes.length; a++) {
                var axis = pad.axes[a];
                var key = "axis" + a;
                var on = false;
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
            for (var b = 0; b < pad.buttons.length; b++) {
                var btn = pad.buttons[b];
                var key = "button" + b;
                var on = void 0;
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
    };
    ;
    InputHandler.prototype.loadJSBindings = function (device) {
        var gamepads = this.getGamepads();
        if (!gamepads[0]) {
            return (false);
        }
        if (!device) {
            device = gamepads[0].id;
        }
        var keys = Object.keys(this.deviceBindings);
        for (var i = 0, key = void 0; key = keys[i]; i++) {
            if (-1 != device.indexOf(key)) {
                this.bindings.js = this.deviceBindings[key];
                return (true);
            }
        }
        return (false);
    };
    ;
    InputHandler.prototype.remapjs = function (msg) {
        if (msg) {
            var d_1 = new Dialog({
                msg: msg,
                noinput: true
            });
            setTimeout(function () {
                d_1.close();
                this.remapjs();
            }.bind(this), 3000);
            return;
        }
        for (var p = 0; p < this.devices.js.length; p++) {
            this.clearPressed(this.devices.js[p]);
        }
        loadImage('images/blud.png', function (img) {
            var map = [];
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var original = this.bindings.js;
            this.bindings.js = [];
            var todo = {};
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
            var keys = Object.keys(todo);
            var key;
            var addToMap = function addToMap(action, key, device) {
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
            var current = null;
            var readInput = function readInput() {
                this.poll();
                for (var p = 0; p < this.devices.js.length; p++) {
                    var pkeys = Object.keys(this.devices.js[p]);
                    for (var i = 0; i < pkeys.length; i++) {
                        var duration = void 0;
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
            var nextInput = function nextInput() {
                if (!map) {
                    return;
                }
                this.poll();
                for (var p = 0; p < this.devices.js.length; p++) {
                    this.clearPressed(this.devices.js[p]);
                }
                if (!(key = keys.shift())) {
                    // TODO Save locally and then load again at startup
                    console.log(JSON.stringify(map));
                    this.bindings.js = map;
                    var t_1 = null;
                    var d_2 = new Dialog({
                        msg: [
                            "Success",
                            "",
                            "Press start to save or wait",
                            "5 seconds to restart mapping"
                        ].join('\n'),
                        closecb: function (value) {
                            clearTimeout(t_1);
                            if (-1 != value && map) {
                                this.bindings.js = map;
                            }
                            else {
                                this.bindings.js = original;
                            }
                        }.bind(this)
                    });
                    t_1 = setTimeout(function () {
                        d_2.close();
                        this.remapjs();
                    }.bind(this), 5000);
                    return;
                }
                var offsets = todo[key];
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
    };
    ;
    return InputHandler;
}()); /* End InputHandler class */
InputHandler._instance = null;
function Level(definition, loadedcb) {
    this.def = definition;
    this.images = {};
    var tilenames = Object.keys(this.def.tiles);
    var loadCount = 1;
    var src;
    this.slideFrames = 30;
    this.marginX = TILE_SIZE * 10;
    this.marginY = TILE_SIZE * 6;
    this.viewport = { x: 0, y: 0, w: 100, h: 100 };
    this.playerpos = { x: 0, y: 0 };
    this.children = [];
    var imageLoaded = function () {
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
    for (var i = 0, tile = void 0; tile = tilenames[i]; i++) {
        if ((src = this.def.tiles[tile].src)) {
            loadCount++;
            this.images[src] = loadImage(src, imageLoaded);
        }
    }
    /* Preload all images for actors */
    for (var i = 0, actor = void 0; actor = this.def.actors[i]; i++) {
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
    var tile;
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
    var rows = [];
    var c = this.def.areas[name];
    if (!c) {
        return;
    }
    var n = this.def.areas[this.findNearbyArea(0, -1, name)];
    var e = this.def.areas[this.findNearbyArea(1, 0, name)];
    var s = this.def.areas[this.findNearbyArea(0, 1, name)];
    var w = this.def.areas[this.findNearbyArea(-1, 0, name)];
    var row;
    /*
        Build the rows for the current area with a border filled out from the
        surrounding areas.
    */
    row = [];
    for (var x = -1; x <= c[0].length; x++) {
        var tmp = void 0;
        if (n && (tmp = n[n.length - 1].charAt(x))) {
            row.push(tmp);
        }
        else {
            row.push('-');
        }
    }
    rows.push(row);
    for (var y = 0; y < c.length; y++) {
        row = [];
        row.push(w ? w[y].charAt(w[y].length - 1) : '-');
        for (var x = 0; x < c[y].length; x++) {
            row.push(c[y].charAt(x));
        }
        row.push(e ? e[y].charAt(0) : '-');
        rows.push(row);
    }
    row = [];
    for (var x = -1; x <= c[0].length; x++) {
        var tmp = void 0;
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
    var newtiles = [{}];
    var newareas = {};
    var tilenames = Object.keys(this.def.tiles);
    var areanames = Object.keys(this.def.areas);
    var tilemap = {};
    /* Set the seed */
    WRand((new Date()).getTime());
    /* Move the tiles into an indexed array */
    for (var i = 0, tile = void 0; tile = tilenames[i]; i++) {
        tilemap[tile] = newtiles.length;
        newtiles.push(this.def.tiles[tile]);
    }
    /* Adjust the variantOf values */
    for (var i = 0; i < newtiles.length; i++) {
        var v = void 0;
        if ((v = newtiles[i].variantOf)) {
            newtiles[i].variantOf = tilemap[v];
        }
    }
    for (var a = 0, name_1; name_1 = areanames[a]; a++) {
        /*
            Convert the area into an array of arrays (from an array of strings)
            and load the border (from surrounding areas).
        */
        var data = this._loadAreaData(name_1);
        /* Replace the tile names with an index */
        for (var y = 0; y < data.length; y++) {
            for (var x = 0; x < data[y].length; x++) {
                data[y][x] = [tilemap[data[y][x]]];
            }
        }
        /*
            Calculate the appropriate variant of a tile to used based on the
            tiles surrounding it. This is used for things like edges on
            water/walls etc.
        */
        var key = void 0, edges = [], vedges = void 0, options = void 0, tile = void 0, offsets = void 0;
        newareas[name_1] = [];
        for (var y = 0; y < data.length; y++) {
            newareas[name_1][y] = [];
            for (var x = 0; x < data[y].length; x++) {
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
                    for (var i = 0; i < edges.length; i++) {
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
                    var src = newtiles[tile].src;
                    var img = src ? this.images[src] : null;
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
                newareas[name_1][y][x] = [data[y][x][0], offsets[0], offsets[1]];
            }
        }
    }
    for (var i = 0; i < newtiles.length; i++) {
        if (newtiles[i].src) {
            newtiles[i].img = this.images[newtiles[i].src];
        }
    }
    this.areas = newareas;
    this.tiles = newtiles;
};
Level.prototype.findNearbyArea = function findNearbyArea(ox, oy, area) {
    var name = null;
    area = area || this.area;
    for (var y = 0; y < this.def.layout.length; y++) {
        for (var x = 0; x < this.def.layout[y].length; x++) {
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
    var name;
    var ox = 0;
    var oy = 0;
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
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
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
    var ids = Object.keys(this.def.actors);
    for (var i = 0, id = void 0; id = ids[i]; i++) {
        var def = this.def.actors[id];
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
            for (var x = 0; x < def.at.length; x++) {
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
    var minX = this.viewport.x + this.marginX;
    var maxX = this.viewport.x + this.viewport.w - this.marginX;
    var minY = this.viewport.y + this.marginY;
    var maxY = this.viewport.y + this.viewport.h - this.marginY;
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
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.setAttribute('width', '' + (this.width * TILE_SIZE));
    canvas.setAttribute('height', '' + (this.height * TILE_SIZE));
    disableSmoothing(ctx);
    ctx.fillStyle = 'black';
    var square, img;
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
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
            var player_1 = this.slide.player;
            this.area = this.slide.area;
            this.slide = null;
            if (player_1) {
                this.scrollTo(true, (player_1.x * TILE_SIZE) + player_1.renderOff.x, (player_1.y * TILE_SIZE) + player_1.renderOff.y);
            }
        }
        else {
            /* Nothing else should be active while the slide is in progress */
            return (false);
        }
    }
    this.scrollTo(false);
    /* Update the children (NPCs, other non-static objects) */
    for (var c = 0, child = void 0; child = this.children[c]; c++) {
        if (child.player || !child.area || child.area === this.area) {
            child.tick();
        }
    }
    for (var c = 0, child = void 0; child = this.actors[c]; c++) {
        if (child.player || !child.area || child.area === this.area) {
            child.tick();
        }
    }
    return (true);
};
Level.prototype.render = function render(ctx) {
    if (this.slide) {
        /* Sliding from one area to another */
        var x = Math.abs(this.slide.ox) * Math.floor(this.slide.x);
        var y = Math.abs(this.slide.oy) * Math.floor(this.slide.y);
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
        for (var c = 0, child = void 0; child = this.children[c]; c++) {
            if (!child.area || child.area === this.area) {
                child.render(ctx, this.viewport.x, this.viewport.y);
            }
        }
        for (var c = 0, child = void 0; child = this.actors[c]; c++) {
            if (!child.area || child.area === this.area) {
                child.render(ctx, this.viewport.x, this.viewport.y);
            }
        }
    }
};
var Controls = (function () {
    function Controls(actor) {
        this.actor = actor;
    }
    Controls.prototype.tick = function () {
    };
    return Controls;
}());
var PlayerControls = (function (_super) {
    __extends(PlayerControls, _super);
    function PlayerControls() {
        var _this = _super.apply(this, arguments) || this;
        _this.moveFrames = 0;
        return _this;
    }
    PlayerControls.prototype.isActive = function (state) {
        switch (state || this.actor.state) {
            case this.actor.MOVING:
            case this.actor.STUCK:
                return (true);
            default:
                return (false);
        }
    };
    PlayerControls.prototype.tick = function () {
        /*
            Keep some information about the current state that may be referenced
            below after the state has changed.
        */
        var actor = this.actor;
        var orgfacing = actor.facing;
        var orgstate = actor.state;
        /* Grab the definition for this character's current action and direction */
        var def = actor.getDefinition();
        var dirs;
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
                var frames_1 = 8;
                var rate_1 = 1;
                if (def && !isNaN(def.steps)) {
                    frames_1 = def.steps;
                }
                else if (def && !isNaN(def.frames)) {
                    frames_1 = def.frames;
                }
                if (def && !isNaN(def.rate)) {
                    rate_1 = def.rate;
                }
                /* Calculate the destination coordinates */
                var movingto = null;
                if (actor.MOVING === orgstate) {
                    movingto = actor.lookingAt();
                }
                if (Math.floor(actor.frame * rate_1) <= frames_1) {
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
                        if (!dirs[actor.facing] && actor.frame < 5 && this.moveFrames >= frames_1) {
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
                var nesw = "NESW";
                var order = "";
                var others = "";
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
                for (var i = 0, d = void 0; (d = nesw.charAt(i)) && d.length === 1; i++) {
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
                for (var i = 0, d = void 0; (d = order.charAt(i)) && d.length > 0; i++) {
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
        var frames = 1;
        var rate = 1;
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
                var steps = TILE_SIZE / frames;
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
    };
    return PlayerControls;
}(Controls));
var EyeballControls = (function (_super) {
    __extends(EyeballControls, _super);
    function EyeballControls(actor) {
        var _this = _super.call(this, actor) || this;
        for (;;) {
            _this.speedX = ((WRand() / 10) % 6) - 3;
            _this.speedY = ((WRand() / 10) % 6) - 3;
            /*
                Keep grabbing random values for speed until the eyeball is
                moving in one clear main direction.

                The intent is for the eyeballs to appear to move in any
                direction but to avoid things close to a 45 degree angle because
                we don't have an appropriate animation for that case.
            */
            if (Math.abs(Math.abs(_this.speedX) - Math.abs(_this.speedY)) > 1.5) {
                break;
            }
        }
        // console.log(this.speedX, this.speedY);
        _this.x = actor.x;
        _this.y = actor.y;
        _this.renderOff = {
            x: actor.renderOff.x,
            y: actor.renderOff.y
        };
        if (Math.abs(_this.speedX) > Math.abs(_this.speedY)) {
            if (_this.speedX > 0) {
                actor.facing = "E";
            }
            else {
                actor.facing = "W";
            }
        }
        else {
            if (_this.speedY < 0) {
                actor.facing = "N";
            }
            else {
                actor.facing = "S";
            }
        }
        actor.setState(actor.MOVING);
        _this.frame = 0;
        return _this;
    }
    EyeballControls.prototype.updateLocation = function () {
        var actor = this.actor;
        var x = this.renderOff.x;
        var y = this.renderOff.y;
        var mx = x > 0 ? 1 : -1;
        var my = y > 0 ? 1 : -1;
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
    };
    EyeballControls.prototype.tick = function () {
        var actor = this.actor;
        /*
            Overwrite the frame on the actor with our own frame counter so we
            can adjust the animation speed based on the movement speed.
        */
        var fc = (Math.abs(this.speedX) + Math.abs(this.speedY)) * 1;
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
    };
    return EyeballControls;
}(Controls));
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
                "0110": [[3, 3]]
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
                S: { x: 0, y: 0 }
            },
            dividing: {
                S: { x: 0, y: 0, rate: 1, frames: 18, ox: 1, oy: 0, repeat: false }
            },
            split: {
                S: { x: 17, y: 0 }
            }
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
var _seed = (new Date()).getTime();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL3V0aWwudHMiLCJzcmMvZGlhbG9nLnRzIiwic3JjL2FjdG9yLnRzIiwic3JjL2VuZW1pZXMudHMiLCJzcmMvaW5wdXQudHMiLCJzcmMvbGV2ZWwudHMiLCJzcmMvcGxheWVyLnRzIiwic3JjL3dvcmxkLnRzIiwic3JjL3dyYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLElBQUksS0FBSyxDQUFDO0FBQ1YsSUFBSSxLQUFLLENBQUM7QUFFVixJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUV0Qzs7O0VBR0U7QUFDRixJQUFJLFVBQVUsR0FBSSxJQUFJLENBQUM7QUFFdkI7SUFBQTtJQUlBLENBQUM7SUFBRCxZQUFDO0FBQUQsQ0FBQyxBQUpELElBSUM7QUFFRCxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFFcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3JELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxDQUFBLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBRUQsY0FBYyxLQUFLO0lBRWxCLGFBQWE7SUFDYixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFD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Q0FBQztRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLENBQUM7UUFFTixDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFdkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQ2xDLElBQUksS0FBSyxTQUFBLENBQUM7WUFFVixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixJQUFJLEdB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QyxDQUFDLENBQUM7WUFDckIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsQ0FBQztJQUNGLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVWLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLEtBQUssR0FBRztnQkFBRSxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7WUFDckIsS0FBSyxHQUFHO2dCQUFFLENBQUMsRUFBRSxDQUFDO2dCQUFDLEtBQUssQ0FBQztZQUNyQixLQUFLLEdBQUc7Z0JBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1lBQ3JCLEtBQUssR0FBRztnQkFBRSxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hFLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRWhFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFT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Q0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBRXRCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNWLG1DQUFtQztZQUN2QyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUUsQ0FBQztZQUVsQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUcsQ0FBQztZQUVoQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV0QyxJQUFJLENBQUMsS0FBSyxD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QUMsY0FBYyxDQUFFLENBQUMsRUFBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFFLENBQUMsRUFBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFELElBQUksR0FBRyxDQUFDO0lBRVI7OztNQUdFO0lBQ0YsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNULEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDeEMsSUFBSSxHQUFHLFNBQUEsQ0FBQztRQUVSLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNQLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZixDQUFDO0lBQ0YsQ0FBQztJQUNELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFZixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNuQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBRVQsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBRW5DLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVELEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDVCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3hDLElBQUksR0FBRyxTQUFBLENBQUM7UUFFUixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVmLE1BQU0sQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2QsQ0FBQyxDQUFDO0FBRUY7Ozs7Ozs7Ozs7O0VBV0U7QUFDRixLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixHQUFHO0lBRW5DOzs7TUFHRTtJQUNGLElBQUksUUFBUSxHQUFTLENBQUUsRUFBRSxDQUFFLENBQUM7SUFDNUIsSUFBSSxRQUFRLEdBQUksRUFBRSxDQUFDO0lBQ25CLElBQUksU0FBUyxHQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QyxJQUFJLFNBQVMsR0FBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0MsSUFBSSxPQUFPLEdBQUssRUFBRSxDQUFDO0lBRW5CLGtCQUFrQjtJQUNsQixLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUU5QiwwQ0FBMEM7SUFDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksU0FBQSxFQUFFLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNoRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUNoQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELGlDQUFpQztJQUNqQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsU0FBQSxDQUFDO1FBRU4sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDO0lBQ0YsQ0FBQztJQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFJLEVBQUUsTUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2hEOzs7VUFHRTtRQUNGLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBSSxDQUFDLENBQUM7UUFFcEMsMENBQTBDO1FBQzFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVEOzs7O1VBSUU7UUFDRixJQUFJLEdBQUcsU0FBQSxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsTUFBTSxTQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUUsSUFBSSxTQUFBLEVBQUUsT0FBTyxTQUFBLENBQUM7UUFFcEQsUUFBUSxDQUFDLE1BQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN0QyxRQUFRLENBQUMsTUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXZCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVyQjs7Ozs7a0JBS0U7Z0JBQ0YsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUM5QixJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDakMsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDUCxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNmLENBQUM7Z0JBRUQsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDZixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDMUI7Ozs7Ozs7Ozs7c0JBVUU7b0JBQ0YsR0FBRyxHQUFHLEVBQUUsQ0FBQztvQkFFVCw2Q0FBNkM7b0JBQzdDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29C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QUUsQ0FBQTtZQUNsQixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFDRCw0REFBNEQ7SUFHNUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLHNEQUFzRDtBQUN0RCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRztJQUV0QixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxD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QUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3RCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLFNBQUEsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3BELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0QsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQztBQUVGLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHO0lBRTNDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2hCLHNDQUFzQztRQUN0QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFM0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLElBQUks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cEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFFcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBRXBCLDRCQUE0QjtnQkFDNUIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQiwyQkFBMkI7Z0JBQzNCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQixtQkFBbUI7Z0JBQ25CLFFBQVEsRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUN0QixRQUFRLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDdEIsUUFBUSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3RCLFFBQVEsRUFBRSxDQUFFLENBQUUsQ0FB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