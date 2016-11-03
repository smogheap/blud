var dialog		= null;
var font		= null;
var fontSizeX	= 8;
var fontSizeY	= 8;
var fontkeys = [
	" !\"#$%^'()*+,-./0123456789:;<=>?",
	"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_",
	"`abcdefghijklmnopqrstuvwxyz{|}~"
];
var fontOffsets = {
	pointer0:		[ 256, 0 ],
	pointer1:		[ 256, 0 ],
	pointer2:		[ 264, 8 ],
	pointer3:		[ 264, 8 ]
};

/* Build a table with offsets for each displayable character */
for (var y = 0, line; line = fontkeys[y]; y++) {
	for (var x = 0, key; (key = line.charAt(x)) && key.length == 1; x++) {
		fontOffsets[key] = [ x * fontSizeX, y * fontSizeY ];
	}
}

loadImage('images/text.png', function(img) {
	font = img;
});

/*
	Supported options:
		icon	An image to display to the left of the msg. This can either be
				just an image, or an array of: [ img, x, y, w, h ]
		msg		The text to display

		spoken	If true the text will be displayed one character at a time to
				indicate to the player that the text is being spoken.

		closecb	A function to call when the dialog is closed. The function will
				be called with the index of the option that was selected if
				there was one, or -1.

		modal	If true the dialog can't be canceled with the input.BACK button

		inputcb	A function to call to handle input. If specified this function
				must do all input handling for this dialog.

		noinput	If true then ignore all input

		steps	The number of ticks to take to animate the dialog opening or
				closing. If not specified this defaults to 8.

		choices	An array of choices.

		fill	If specified the background will be filled with this color
				instead of drawing the normal border.

		// TODO Add support for a grid of choices (useful with images)
*/
function Dialog(options)
{
	if ("string" === typeof options) {
		options = { msg: options };
	}

	/*
		The number of steps that should be used to zoom the dialog in when
		opening it, and out again when closing it.
	*/
	if (isNaN(options.steps)) {
		this.steps	= 8;
	} else {
		this.steps	= options.steps;
	}

	this.drawn		= 0;
	this.ticks		= 0;
	this.modal		= options.modal;
	this.noinput	= options.noinput;
	this.closecb	= options.closecb;
	this.inputcb	= options.inputcb;
	this.spoken		= options.spoken;
	this.msg		= options.msg || '';
	this.selected	= 0;
	this.icon		= options.icon;
	this.actor		= options.actor;

	if (options.choices && options.choices.length > 0) {
		this.choices = options.choices;
	}

	var lines		= this.msg.split('\n');

	this.lineCount	= lines.length;
	this.height		= lines.length;
	this.width		= lines[0].length;

	for (var i = 1; i < lines.length; i++) {
		this.width = Math.max(this.width, lines[i].length);
	}

	if (this.spoken) {
		this.drawLimit	= 1;
	} else {
		this.drawLimit	= this.msg.length;
	}

	this.canvas		= document.createElement('canvas');
	this.ctx		= this.canvas.getContext('2d');

	disableSmoothing(this.ctx);

	/* Pad box to fit the largest option */
	var longest = 0;

	if (this.choices) {
		for (var i = 0, o; o = this.choices[i]; i++) {
			longest = Math.max(longest, o.length);
		}
		longest += 1;
	}
	this.width = Math.max(this.width, longest);

	if (this.icon) {
		this.iconWidth = Math.ceil(this.icon[3] / fontSizeX);
		this.width += this.iconWidth;

		this.height = Math.max(this.height, Math.ceil(this.icon[4] / fontSizeY));
	} else if (this.actor) {
		this.iconWidth	= TILE_SIZE / fontSizeX;
		this.width		+= TILE_SIZE / fontSizeX;

		this.height		= Math.max(this.height, TILE_SIZE / fontSizeY);
	} else {
		this.iconWidth = 0;
	}

	this.canvas.setAttribute('width',  (this.width + 4) * fontSizeX);
	if (this.choices) {
		this.canvas.setAttribute('height', (this.height + 3 + this.choices.length) * fontSizeY);
	} else {
		this.canvas.setAttribute('height', (this.height + 2) * fontSizeY);
	}

	if (options.fill) {
		this.ctx.fillStyle = options.fill;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	} else {
		this.ctx.fillStyle = '#666666';

		/*
			Borders are in the image at 272x0, in a 3x3 grid of images that are
			each 8x8 pixels.
		*/
		for (var x = 0; x < this.canvas.width; x += fontSizeX) {
			for (var y = 0; y < this.canvas.height; y += fontSizeY) {
				var sx = 272;
				var sy = 0;

				if (x > 0) {
					sx += 8;
				}
				if (x + fontSizeX >= this.canvas.width) {
					sx += 8;
				}

				if (y > 0) {
					sy += 8;
				}
				if (y + fontSizeY >= this.canvas.height) {
					sy += 8;
				}

				this.ctx.drawImage(font,
						sx, sy, fontSizeX, fontSizeY,
						x,  y,  fontSizeX, fontSizeY);
			}
		}
	}

	if (this.icon) {
		var y = 8 + ((this.height * fontSizeY) / 2) - (this.icon[4] / 2);

		this.ctx.drawImage(	this.icon[0],
							this.icon[1], this.icon[2],
							this.icon[3], this.icon[4],
							8, y,
							this.icon[3], this.icon[4]);
	}

	dialog = this;
	return(this);
}

function drawText(str, ctx, x, y, scale, noclear)
{
	if (isNaN(scale)) {
		scale = 1;
	}

	for (var i = 0; i < str.length; i++) {
		var c;

		if ('string' === typeof str) {
			 c = str.charAt(i);
		} else {
			c = "pointer" + str[i];
		}

		if (!noclear) {
			// ctx.fillStyle = '#666666';
			ctx.fillRect(x, y,
						fontSizeX * scale, fontSizeY * scale);
		}

		if (fontOffsets[c]) {
			ctx.drawImage(font,
					fontOffsets[c][0], fontOffsets[c][1],
					fontSizeX, fontSizeY,
					x, y,
					fontSizeX * scale, fontSizeY * scale);
		}
		x += fontSizeX * scale;
	}
}

Dialog.prototype.close = function close()
{
	if (this.ticks < 0 || this.steps === 0) {
		this.closed = true;
		dialog = null;

		if (this.closecb) {
			if (this.choices) {
				this.closecb(this.selected);
			} else {
				this.closecb(-1);
			}
		}
	} else {
		/* Reset ticks - Count down now that we're closing */
		this.ticks = this.steps;
		this.closing = true;
	}
};

Dialog.prototype.tick = function tick()
{
	if (this.inputcb) {
		/* Let the consumer handle input */
		this.inputcb(this);
	} else {
		if (!this.noinput && !this.modal &&
			input.getButton(input.BACK, true) & input.PRESSED
		) {
			this.selected = -1;
			this.close();
		}

		if (!this.noinput) {
			if (input.getButton(input.CONTINUE, true) & input.PRESSED) {
				if (this.drawLimit < this.msg.length) {
					this.drawLimit = this.msg.length;
				} else {
					this.close();
				}
			}
			var dirs = input.getDirection(true);

			if (!this.closing && this.choices && this.drawLimit >= this.msg.length) {
				if ((dirs[input.N] | dirs[input.E]) & input.PRESSED) {
					this.selected--;
					if (this.selected < 0) {
						this.selected += this.choices.length;
					}
				} else if ((dirs[input.S] | dirs[input.W]) & input.PRESSED) {
					this.selected++;
					if (this.selected >= this.choices.length) {
						this.selected -= this.choices.length;
					}
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
		this.drawLimit += 2;
	}

	if (this.drawn >= this.drawLimit) {
		var longest = 0;

		if (this.choices) {
			for (var i = 0, o; o = this.choices[i]; i++) {
				longest = Math.max(longest, o.length);
			}

			for (var i = 0, o; o = this.choices[i]; i++) {
				while (o.length < longest) {
					o += " ";
				}

				drawText(i === this.selected ? [ 0 ] : " ", this.ctx,
					fontSizeX * (1 + this.width - longest),
					fontSizeY * (this.height + 2 + i));

				drawText(o, this.ctx,
					fontSizeX * (2 + this.width - longest),
					fontSizeY * (this.height + 2 + i));
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
		} else {
			x++;
		}

		if (i < this.drawn) {
			continue;
		}

		if (1 === this.lineCount && (this.icon || this.actor) && !this.choices) {
			oy = (this.height - 1) * fontSizeY / 2;
		}

		drawText(c, this.ctx,
			fontSizeX * (x + 1 + this.iconWidth), (fontSizeY * (y + 1)) + oy);
		this.drawn++;
	}
};

Dialog.prototype.render = function render(ctx)
{
	var img = this.canvas;
	var per	= Math.min(this.ticks / this.steps, 1);

	if (!img || !ctx || this.closed) {
		return;
	}

	var w = Math.floor(per * img.width);
	var h = Math.floor(per * img.height);
	var x = Math.floor(ctx.canvas.width  / 2);
	var y;

	x -= Math.floor(w / 2);

	if (this.spoken) {
		y = ctx.canvas.height - (img.height + 15);
	} else {
		y = Math.floor(ctx.canvas.height / 2);
		y -= Math.floor(h / 2);
	}

	if (this.actor) {
		var ay = 8 + ((this.height * fontSizeY) / 2) - (TILE_SIZE / 2);

		this.ctx.fillRect(8, ay, TILE_SIZE, TILE_SIZE);
		this.actor.renderState(this.ctx, this.actor.TALKING, "S", this.ticks, 8, ay);
	}

	ctx.drawImage(img,
				0, 0,
				img.width, img.height,
				x, y,
				per * img.width, per * img.height);
};

