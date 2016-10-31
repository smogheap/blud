var font		= null;
var fontSizeX	= 8;
var fontSizeY	= 8;
var fontkeys = [
	" !\"#$%^'()*+,-./0123456789:;<=>?",
	"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_",
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

	this.canvas.setAttribute('width',  (this.width  * fontSizeX) + 32);
	this.canvas.setAttribute('height', (this.height * fontSizeY) + 16);

	this.ctx.mozImageSmoothingEnabled		= false;
	this.ctx.webkitImageSmoothingEnabled	= false;
	this.ctx.msImageSmoothingEnabled		= false;
	this.ctx.imageSmoothingEnabled			= false;

	this.ctx.fillStyle = 'black';
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	return(this);
}

Dialog.prototype.tick = function tick()
{
	if (input.getButton(input.ACTION, true) & input.PRESSED) {
		if (this.drawLimit < this.msg.length) {
			this.drawLimit = this.msg.length;
		} else {
			/* Reset ticks - Count down now that we're closing */
			this.ticks = this.steps;
			this.closing = true;
		}
	}

	if (this.closing) {
		this.ticks--;

		if (this.ticks < 0 && this.closecb) {
			this.closed = true;
			this.closecb();
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

		if (fontOffsets[c]) {
			this.ctx.drawImage(font,
						fontOffsets[c][0], fontOffsets[c][1],
						fontSizeX, fontSizeY,
						(x + 1) * fontSizeX, (y + 1) * fontSizeY,
						fontSizeX, fontSizeY);
		}
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

