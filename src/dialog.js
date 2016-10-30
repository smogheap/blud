var font		= null;
var fontkeys = [
	" !\"#$%^'()*+,-./0123456789:;<=>?",
	"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_",
	"`abcdefghijklmnopqrstuvwxyz{|}~"
];
var fontOffsets = {};

/* Build a table with offsets for each displayable character */
for (var y = 0, line; line = fontkeys[y]; y++) {
	for (var x = 0, key; (key = line.charAt(x)) && key.length == 1; x++) {
		fontOffsets[key] = [ x * 8, y * 8 ];
	}
}

loadImage('images/text.png', function(img) {
	font = img;
});

function Dialog(msg, spoken, options)
{
	var lines		= msg.split('\n');

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

	this.canvas.setAttribute('width',  (this.width  * 8) + 32);
	this.canvas.setAttribute('height', (this.height * 8) + 16);

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
			this.closed = true;
		}
	}

	if (this.closed) {
		return;
	}

	if (!font) {
		/* Not ready */
		return;
	}

	if (this.drawLimit < this.msg.length) {
		this.drawLimit++;
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
						8, 8,
						(x + 1) * 8, (y + 1) * 8,
						8, 8);
		}
		this.drawn++;
	}
};

Dialog.prototype.render = function render(ctx, scale)
{
	// TODO Fade the square in to the right size over a few frames
	// TODO If the text is being spoken render it a character at a time, unless
	//		the player hits a key while it is drawing.

	if (this.canvas && ctx && !this.closed) {
		// TODO Where do we want to position it?
		ctx.drawImage(this.canvas,
					0, 0,
					this.canvas.width, this.canvas.height,
					32 * scale, 32 * scale,
					this.canvas.width * scale, this.canvas.height * scale);
	}
};

