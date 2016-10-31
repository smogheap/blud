var font		= null;
var fontSizeX	= 8;
var fontSizeY	= 8;
var fontkeys = [
	" !\"#$%^'()*+,-./0123456789:;<=>?",
	"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_",
	"`abcdefghijklmnopqrstuvwxyz{|}~"
];
var fontOffsets = {};

/* Build a table with offsets for each displayable character */
for (var y = 0, line; line = fontkeys[y]; y++) {
	for (var x = 0, key; (key = line.charAt(x)) && key.length == 1; x++) {
		fontOffsets[key] = [ x * fontSizeX, y * fontSizeY ];
	}
}

loadImage('images/text.png', function(img) {
	font = img;
});

function Dialog(msg, spoken, options, closecb)
{
	var lines		= msg.split('\n');

	/*
		The number of steps that should be used to zoom the dialog in when
		opening it, and out again when closing it.
	*/
	this.steps		= 8;

	this.ticks		= 0;
	this.closecb	= closecb;
	this.spoken		= spoken;
	this.msg		= msg;
	this.options	= options;
	this.selected	= 0;

	this.height		= lines.length;
	this.width		= lines[0].length;

	for (var i = 1; i < lines.length; i++) {
		this.width = Math.max(this.width, lines[i].length);
	}

	if (spoken) {
		this.drawLimit	= 1;
	} else {
		this.drawLimit	= msg.length;
	}
	this.drawn = 0;


	this.canvas		= document.createElement('canvas');
	this.ctx		= this.canvas.getContext('2d');

	this.canvas.setAttribute('width',  (this.width + 4) * fontSizeX);
	if (options && options.length > 0) {
		this.canvas.setAttribute('height', (this.height + 3 + options.length) * fontSizeY);
	} else {
		this.canvas.setAttribute('height', (this.height + 2) * fontSizeY);
	}

	this.ctx.mozImageSmoothingEnabled		= false;
	this.ctx.webkitImageSmoothingEnabled	= false;
	this.ctx.msImageSmoothingEnabled		= false;
	this.ctx.imageSmoothingEnabled			= false;

	this.ctx.fillStyle = 'black';
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	return(this);
}

Dialog.prototype.drawText = function drawText(str, ctx, x, y)
{
	for (var i = 0; i < str.length; i++) {
		var c = str.charAt(i);

		ctx.fillStyle = 'black';
		ctx.fillRect(x * fontSizeX, y * fontSizeY,
					fontSizeX, fontSizeY);

		if (fontOffsets[c]) {
			ctx.drawImage(font,
					fontOffsets[c][0], fontOffsets[c][1],
					fontSizeX, fontSizeY,
					x * fontSizeX, y * fontSizeY,
					fontSizeX, fontSizeY);
		}
		x++;
	}
}

Dialog.prototype.tick = function tick()
{
	if (input.getButton(input.ACTION, false) & input.PRESSED) {
		if (this.drawLimit < this.msg.length) {
			this.drawLimit = this.msg.length;
		} else {
			/* Reset ticks - Count down now that we're closing */
			this.ticks = this.steps;
			this.closing = true;
		}
	}
	var dirs = input.getDirection(true);

	if (this.options) {
		if ((dirs[input.N] | dirs[input.E]) & input.PRESSED) {
			this.selected--
			if (this.selected < 0) {
				this.selected += this.options.length;
			}
		} else if ((dirs[input.S] | dirs[input.W]) & input.PRESSED) {
			this.selected++
			if (this.selected >= this.options.length) {
				this.selected -= this.options.length;
			}
		}
	}

	if (this.closing) {
		this.ticks--;

		if (this.ticks < 0 && this.closecb) {
			this.closed = true;

			if (this.options) {
				this.closecb(this.options[this.selected], this.selected);
			} else {
				this.closecb();
			}
		}
		return;
	}

	this.ticks++;

	if (!font) {
		/* Not ready */
		return;
	}

	if (this.drawLimit < this.msg.length) {
		/* Adjust this increment to change the speed text is "spoken" */
		// TODO Play a noise with this?
		this.drawLimit += 2;
	}

	if (this.drawn >= this.drawLimit) {
		var longest = 0;

		if (this.options) {
			for (var i = 0, o; o = this.options[i]; i++) {
				longest = Math.max(longest, o.length);
			}

			for (var i = 0, o; o = this.options[i]; i++) {
				while (o.length < longest) {
					o += " ";
				}

				if (i == this.selected) {
					o = "[ " + o + " ]";
				} else {
					o = "  " + o + "  ";
				}

				this.drawText(o, this.ctx,
					this.width - (5 + longest), this.height + 2 + i);
			}
		}

		return;
	}

	var x = 0;
	var y = 0;
	for (var i = 0; i < this.drawLimit; i++) {
		var c = this.msg.charAt(i);

		if (c === '\n') {
			x = 0;
			y++;
		} else {
			x++;
		}

		if (i < this.drawn) {
			continue;
		}

		this.drawText(c, this.ctx, x + 1, y + 1);
		this.drawn++;
	}
};

Dialog.prototype.render = function render(ctx)
{
	var img = this.canvas;
	var per	= Math.min(this.ticks / this.steps, 1);

	if (img && ctx && !this.closed) {
		var w = Math.floor(per * img.width);
		var h = Math.floor(per * img.height);
		var x = Math.floor(ctx.canvas.width  / 2);
		var y = Math.floor(ctx.canvas.height / 2);

		x -= Math.floor(w / 2);
		y -= Math.floor(h / 2);

		ctx.drawImage(img,
					0, 0,
					img.width, img.height,
					x, y,
					per * img.width, per * img.height);
	}
};

