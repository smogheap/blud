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
	pointer1:		[ 264, 0 ],
	pointer2:		[ 256, 8 ],
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
loadImage('images/blud.png', function(img) {
	// 17 * 16, 0 * 16 is top left corner of 3x3 tile for borders
	borders = img;
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

	if (false) {
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	} else {
		for (var x = 0; x < this.canvas.width; x += fontSizeX) {
			for (var y = 0; y < this.canvas.height; y += fontSizeY) {
				var sx = 16 * 17;
				var sy = 16 * 0;

				if (x > 0) {
					sx += 16;
				}
				if (x + fontSizeX >= this.canvas.width) {
					sx += 16 + 8;
				}

				if (y > 0) {
					sy += 16;
				}
				if (y + fontSizeY >= this.canvas.height) {
					sy += 16 + 8;
				}

				this.ctx.drawImage(borders,
						sx, sy, fontSizeX, fontSizeY,
						x,  y,  fontSizeX, fontSizeY)
			}
		}
	}

	return(this);
}

function drawText(str, ctx, x, y, scale, noclear)
{
	var img;

	if (isNaN(scale)) {
		scale = 1;
	}

	for (var i = 0; i < str.length; i++) {
		var c;

		if ('string' === typeof str) {
			 c = str.charAt(i);
			img = font;
		} else {
			c = "pointer" + str[i];
			img = borders;
		}

		if (!noclear) {
			ctx.fillStyle = '#666666';
			ctx.fillRect(x, y,
						fontSizeX * scale, fontSizeY * scale);
		}

		if (fontOffsets[c]) {
			ctx.drawImage(img,
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
	/* Reset ticks - Count down now that we're closing */
	this.ticks = this.steps;
	this.closing = true;
}

Dialog.prototype.tick = function tick()
{
	if (input.getButton(input.BACK, true) & input.PRESSED) {
		this.selected = -1;
		this.close();
	}
	if (input.getButton(input.CONTINUE, true) & input.PRESSED) {
		if (this.drawLimit < this.msg.length) {
			this.drawLimit = this.msg.length;
		} else {
			this.close();
		}
	}
	var dirs = input.getDirection(true);

	if (!this.closing && this.options && this.drawLimit >= this.msg.length) {
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

				if (false) {
					if (i == this.selected) {
						o = "[ " + o + " ]";
					} else {
						o = "  " + o + "  ";
					}
				} else {
					if (i == this.selected) {
						drawText([ 0 ], this.ctx,
							fontSizeX * (this.width - (5 + longest)),
							fontSizeY * (this.height + 2 + i));
					} else {
						drawText(" ", this.ctx,
							fontSizeX * (this.width - (5 + longest)),
							fontSizeY * (this.height + 2 + i));
					}
				}

				drawText(o, this.ctx,
					fontSizeX * (this.width - (4 + longest)),
					fontSizeY * (this.height + 2 + i));
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

		drawText(c, this.ctx, fontSizeX * (x + 1), fontSizeY * (y + 1));
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

