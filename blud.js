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
function PlayerControls(actor) {
    this.actor = actor;
}
PlayerControls.prototype.isActive = function isActive(state) {
    switch (state || this.actor.state) {
        case this.actor.MOVING:
        case this.actor.STUCK:
            return (true);
        default:
            return (false);
    }
};
PlayerControls.prototype.tick = function tick() {
    /*
        Keep some information about the current state that may be referenced
        below after the state has changed.
    */
    var actor = this.actor;
    var orgfacing = actor.facing;
    var orgstate = actor.state;
    /* Grab the definition for this character's current action and direction */
    var def = actor.getDefinition();
    switch (actor.state) {
        case actor.STUCK:
        case actor.MOVING:
            /*
                How many frames does it take to move this character (in this
                state) one tile?

                In most cases the number of frames will match the number of
                steps, but it is also possible for the animation to repeat.
            */
            var frames = 8;
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
            /* Calculate the destination coordinates */
            var movingto = null;
            if (actor.MOVING === orgstate) {
                movingto = actor.lookingAt();
            }
            if (Math.floor(actor.frame * rate) <= frames) {
                if (orgstate !== actor.STUCK) {
                    /* Animation still in progress */
                    break;
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
            var dirs;
            /*
                Adjust the order we try each direction so that directions that
                the actor can move to are preferred, and the last direction
                that the actor travelled in is not preferred.

                This should ensure that a player holding multiple directions
                will see the expected behavior.
                    1) Holding 2 directions will cause the actor to slide along
                    a wall that is blocking movement in one of those directions.

                    2) A character will zigzag when holding 2 directions with
                    nothing blocking the path.
            */
            for (var i = 0, d; (d = nesw.charAt(i)) && d.length === 1; i++) {
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
            for (var i = 0, d; (d = order.charAt(i)) && d.length > 0; i++) {
                if (dirs[d]) {
                    actor.facing = d;
                    if (!actor.canMove(d)) {
                        /*
                            Change to the stuck state (pushing against a solid
                            block) right away. There is no need to change to
                            turning since the actor can't move so no need to let
                            the turn be cancelled.
                        */
                        actor.setState(actor.STUCK);
                    }
                    else if (orgfacing !== d && !this.isActive(orgstate)) {
                        /*
                            The character was not moving and is now turning to a
                            new direction. This state exists to provide a small
                            delay before moving so that the player can turn the
                            character in place without moving by tapping a
                            directional input.
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
            var dirs = input.getDirection(false);
            if (actor.facing && !(dirs[actor.facing] & input.HELD)) {
                /*
                    The direction input was released before the actor started
                    moving. Leave the actor on the same spot but facing the new
                    direction.
                */
                actor.setState(actor.STANDING);
                break;
            }
            if (actor.frame > 4) {
                /*
                    The directional input was held long enough to complete the
                    turn and start moving in the new direction.
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
    var def = actor.getDefinition();
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
function EyeballControls(actor) {
    this.actor = actor;
    for (;;) {
        this.speedX = ((WRand() / 10) % 6) - 3;
        this.speedY = ((WRand() / 10) % 6) - 3;
        /*
            Keep grabbing random values for speed until the eyeball is moving in
            one clear main direction.

            The intent is for the eyeballs to appear to move in any direction
            but to avoid things close to a 45 degree angle because we don't have
            an appropriate animation for that case.
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
EyeballControls.prototype.updateLocation = function updateLocation() {
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
EyeballControls.prototype.tick = function tick() {
    var actor = this.actor;
    /*
        Overwrite the frame on the actor with our own frame counter so we can
        adjust the animation speed based on the movement speed.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmx1ZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL3V0aWwudHMiLCJzcmMvZGlhbG9nLnRzIiwic3JjL2FjdG9yLnRzIiwic3JjL2VuZW1pZXMudHMiLCJzcmMvaW5wdXQudHMiLCJzcmMvbGV2ZWwudHMiLCJzcmMvcGxheWVyLnRzIiwic3JjL3dvcmxkLnRzIiwic3JjL3dyYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNuQixJQUFJLEtBQUssQ0FBQztBQUNWLElBQUksS0FBSyxDQUFDO0FBRVYsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFdEM7OztFQUdFO0FBQ0YsSUFBSSxVQUFVLEdBQUksSUFBSSxDQUFDO0FBRXZCO0lBQUE7SUFJQSxDQUFDO0lBQUQsWUFBQztBQUFELENBQUMsQUFKRCxJQUlDO0FBRUQsaUJBQWlCLENBQUMsRUFBRSxDQUFDO0lBRXBCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFBLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDZixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2QsQ0FBQztBQUVELGNBQWMsS0FBSztJQUVsQixhQUFhO0lBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFD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SUFBSSxDQUFDLFFBQVEsQ0FBQztJQUM1QixDQUFDO0FBQ0YsQ0FBQyxDQUFDO0FBRUYsaUJBQWlCLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRztJQUVsQzs7OztNQUlFO0lBQ0YsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN2QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFakIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUM7SUFDUixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUM7SUFDUixDQUFDO0lBRUQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUUxQixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ2QsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUNkLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLE1BQU0sS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0YsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRVYsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEIsS0FBSyxHQUFHO2dCQUFFLENBQUMsRUFBRSxDQUFDO2dCQUFDLEtBQUssQ0FBQztZQUNyQixLQUFLLEdBQUc7Z0JBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsS0FBSyxDQUFDO1lBQ3JCLEtBQUssR0FBRztnQkFBRSxDQUFDLEVBQUUsQ0FBQztnQkFBQyxLQUFLLENBQUM7WUFDckIsS0FBSyxHQUFHO2dCQUFFLENBQUMsRUFBRSxDQUFDO2dCQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFaEUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7WUFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxH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QUUsR0FBRyxFQUFFLENBQUM7WUFFdEIsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1YsbUNBQW1DO1lBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBRSxDQUFDO1lBRWxDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBRyxDQUFDO1lBRWhDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFB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LENBQUUsQ0FBQyxFQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsQ0FBQyxFQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUQsSUFBSSxHQUFHLENBQUM7SUFFUjs7O01BR0U7SUFDRixHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ1QsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUN4QyxJQUFJLEdBQUcsU0FBQSxDQUFDO1FBRVIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDO0lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ25DLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFFVCxH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LENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFFLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUMxRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDMUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFFLEtB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LElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdELEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDO0lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssU0FBQSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDcEQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3RCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sQ0FBQSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2QsQ0FBQyxDQUFDO0FBRUYsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLEdBQUc7SUFFM0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEIsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUzRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUMsSUFBSSxJQUFJLENB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LENBQUMsRUFBRSxDQUFDLENBQUU7WUFFckIsS0FBSyxFQUFFO2dCQUNOLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUVwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFFcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBRXBCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2dCQUNwQixNQUFNLEVBQUUsQ0FBRSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBRTtnQkFDcEIsTUFBTSxFQUFFLENBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUU7Z0JBQ3BCLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFFO2FBQ3BCO1NBQ0Q7UUFFRCxHQUFHLEVBQUU7WUFDSixJ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QUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUNyRCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDckQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3JELENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2FBQ3JEO1lBRUQsUUFBUSxFQUFFO2dCQUNULENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDakIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNqQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2pCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTthQUNqQjtZQUVELFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2pCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDakIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNqQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDakI7WUFFRCxJQUFJLEVBQUU7Z0JBQ0wsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRTthQUN6QztTQUNEO1FBRUQsUUFBUSxFQUFFO1lBQ1QsR0FBRyxFQUFJLGtCQUFrQjtZQUN6QixLQUFLLEVBQUksRUFBRTtZQUVYLFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDakI7WUFDRCxRQUFRLEVBQUU7Z0JBQ1QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTthQUNuRTtZQUNELEtBQUssRUFBRTtnQkFDTixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDbEI7U0FDRDtRQUVELE1BQU0sRUFBRTtZQUNQLENBQUMsRUFBSyxFQUFFO1lBQ1IsQ0FBQyxFQUFLLEVBQUU7WUFDUixJQUFJLEVBQUksWUFBWTtZQUVwQixNQUFNLEVBQUksR0FBRztZQUNiLEdBQUcsRUFBSSxnQkFBZ0I7WUFFdkIsUUFBUSxFQUFFO2dCQUNULENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTthQUNqQjtZQUVELFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDakI7WUFFRCxJQUFJLEVBQUU7Z0JBQ0wsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRTthQUN6QztZQUVELE9BQU8sRUFBRTtnQkFDUixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTthQUNyRDtZQUVELE1BQU0sRUFBRTtnQkFDUCx5Q0FBeUM7Z0JBQ3pDLGFBQWE7Z0JBQ2I7b0JBQ0MscUNBQXFDO29CQUNyQyxxQ0FBcUM7b0JBQ3JDLHlCQUF5QjtvQkFDekIsRUFBRTtvQkFDRixzQkFBc0I7aUJBQ3RCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUNaO1NBQ0Q7UUFFRCxNQUFNLEVBQUU7WUFDUCxDQUFDLEVBQUssQ0FBQztZQUNQLENBQUMsRUFBSyxFQUFFO1lBQ1IsSUFBSSxFQUFJLFlBQVk7WUFFcEIsTUFBTSxFQUFJLEdBQUc7WUFDYixHQUFHLEVBQUksZ0JBQWdCO1lBRXZCLFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDakI7WUFFRCxRQUFRLEVBQUU7Z0JBQ1QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2FBQ2pCO1lBRUQsT0FBTyxFQUFFO2dCQUNSLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2FBQ3JEO1lBRUQsSUFBSSxFQUFFO2dCQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7YUFDekM7WUFFRCxNQUFNLEVBQUU7Z0JBQ1AsT0FBTztnQkFDUCxtQkFBbUI7Z0JBQ25CLGtDQUFrQzthQUNsQztTQUNEO1FBRUQsV0FBVyxFQUFFO1lBQ1osRUFBRSxFQUFFO2dCQUNILEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUU7Z0JBQ3BDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUU7Z0JBQ3BDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUU7YUFDcEM7WUFFRCxHQUFHLEVBQUksa0JBQWtCO1lBRXpCLFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDakI7WUFFRCxLQUFLLEVBQUU7Z0JBQ04sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTthQUNoRTtZQUNELE1BQU0sRUFBRTtnQkFDUCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2FBQ2hFO1lBRUQsSUFBSSxFQUFFO2dCQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7YUFDekM7U0FDRDtRQUVELE9BQU8sRUFBRTtZQUNSLENBQUMsRUFBSyxFQUFFO1lBQ1IsQ0FBQyxFQUFLLEVBQUU7WUFDUixNQUFNLEVBQUksR0FBRztZQUNiLElBQUksRUFBSSxZQUFZO1lBQ3BCLEdBQUcsRUFBSSxrQkFBa0I7WUFFekIsUUFBUSxFQUFFO2dCQUNULENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7YUFDaEU7WUFFRCxNQUFNLEVBQUU7Z0JBQ1AsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2FBQ2pCO1lBQ0QsSUFBSSxFQUFFO2dCQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTthQUNqQjtTQUNEO0tBQ0Q7SUFFRCxLQUFLLEVBQUU7UUFDTixTQUFTLEVBQUU7WUFDVixHQUFHLEVBQUksaUJBQWlCO1lBRXhCLFFBQVEsRUFBRTtnQkFDVCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7YUFDakI7WUFFRCxNQUFNLEVBQUU7Z0JBQ1AsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RELENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUN0RCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUN0RCxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2FBQ3REO1NBQ0Q7S0FDRDtDQUNELENBQUM7QUNoYkY7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFFRix3REFBd0Q7QUFDeEQsSUFBSSxLQUFLLEdBQVUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7QUFFMUMsZUFBZSxJQUFhO0lBRTNCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNwQixJQUFJLEdBQUcsSUFBSSxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7SUFDL0IsSUFBSSxHQUFHLElBQUksR0FBRyxVQUFVLENBQUM7SUFFekIsS0FBSyxHQUFHLElBQUksQ0FBQztJQUViLE1BQU0sQ0FBQSxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQzlCLENBQUMifQ==