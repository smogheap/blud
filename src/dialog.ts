let dialog		= null;
let font		= null;
let fontSizeX	= 8;
let fontSizeY	= 8;
let fontkeys = [
	" !\"#$%^'()*+,-./0123456789:;<=>?",
	"@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_",
	"`abcdefghijklmnopqrstuvwxyz{|}~"
];
let fontOffsets = {
	pointer0:		[ 256, 0 ],
	pointer1:		[ 256, 0 ],
	pointer2:		[ 264, 8 ],
	pointer3:		[ 264, 8 ]
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
		fontOffsets[key] = [ x * fontSizeX, y * fontSizeY ];
	}
}

loadImage('images/text.png', function(img) {
	font = img;
});

function drawText(ctx: CanvasRenderingContext2D, str: any, x: number, y: number, scale?: number, noclear?: boolean)
{
	if (isNaN(scale)) {
		scale = 1;
	}

	for (let i = 0; i < str.length; i++) {
		let c;

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

/*
	Draw a border inside the specified square. The border itself is 6 pixels
	wide, but generally a 2 pixel padding is desired.
*/
function drawBorder(ctx: CanvasRenderingContext2D, dx: number, dy: number, w: number, h: number, fillStyle?: string)
{
	ctx.save();
	ctx.fillStyle = fillStyle;

	/*
		Borders are in the image at 272x0, in a 3x3 grid of images that are
		each 8x8 pixels.
	*/
	for (let x = 0; x < w; x+= fontSizeX) {
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

			ctx.drawImage(font,
					sx, sy, fontSizeX, fontSizeY,
					dx + x,  dy + y,  fontSizeX, fontSizeY);
		}
	}
	ctx.fillRect(dx + 6, dy + 6, w - 12, h - 12);
	ctx.restore();
}

interface DialogActor
{
	actor:		Actor;	/* The actor								*/
	facing?:	string;	/* The action they should be performing		*/
	action?:	string;	/* The direction the actor should be facing	*/
	rate?:		number;	/* Speed (between 0 and 1.0) of animation	*/

	width?:		number;
	height?:	number;
	delay?:		number;
}

interface CloseCB { ( value: number|string ): void; };
interface InputCB { ( dialog: Dialog ): void; };

interface DialogOptions
{
	/*
		An image to display to the left of the msg. This can either be just an
		image, or an array of: [ img, x, y, w, h ]
	*/
	icon?:		HTMLImageElement | HTMLCanvasElement | [ HTMLImageElement | HTMLCanvasElement, number, number, number, number ];

	/*
		An actor (NPC, enemy, player, etc) to render instead of an icon.
		Alternatively this may be a DialogActor to specify more options.
	*/
	actor?:		Actor | DialogActor;

	/* The text to display */
	msg:		string;

	/*
		If true the text will be displayed one character at a time to indicate
		to the player that the text is being spoken.
	*/
	spoken?:	boolean;

	/* If true the dialog can't be canceled with the input.BACK button */
	modal?:		boolean;

	/*
		A function to call when the dialog is closed. The function will be
		called with the index of the option that was selected if there was one,
		or -1.
	*/
	closecb?:	CloseCB;

	/*
		A function to call to handle input. If specified this function must do
		all input handling for this dialog.
	*/
	inputcb?:	InputCB;

	/* If true then ignore all input */
	noinput?:	boolean;

	/*
		The number of ticks to take to animate the dialog opening or closing. If
		not specified a default of 8 will be used.
	*/
	steps?:		number;

	/* An array of choices. */
	choices?:	string[];

	/*
		If specified the background will be filled with this color instead of
		drawing the normal border.
	*/
	fill?:		string

	/*
		If true then an on screen keyboard will be displayed to allow the user
		to enter text.
	*/
	kb?:		boolean;
}

class Dialog
{
	private canvas?:	HTMLCanvasElement;
	private ctx?:		CanvasRenderingContext2D;
	private next?:		DialogOptions[];
	private actor:		DialogActor	= null;
	private choices?:	string[]	= null;
	private drawn					= 0;
	private ticks					= 0;
	private steps					= 8;
	private modal					= false;
	private noinput					= false;
	private closecb					= null;
	private inputcb					= null;
	private spoken					= false;
	private msg						= '';
	private selected				= 0;
	private icon					= null;
	private kb						= false;
	private upper					= 1;
	private value					= '';
	private maxLength				= 20;
	private lineCount:	number;
	private height:		number;
	private width:		number;
	private drawLimit:	number;
	private iconWidth:	number;
	private closed					= false;
	private closing					= false;

	constructor(options: string);
	constructor(options: DialogOptions);
	constructor(options: DialogOptions[]);
	constructor(options: any)
	{
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
			this.steps	= options.steps;
		}

		this.modal		= options.modal;
		this.noinput	= options.noinput;
		this.closecb	= options.closecb;
		this.inputcb	= options.inputcb;
		this.spoken		= options.spoken;
		this.icon		= options.icon;
		this.kb			= options.kb;
		this.msg		= options.msg		|| this.msg;
		this.value		= options.value		|| this.value;
		this.maxLength	= options.maxLength	|| this.maxLength;

		if (options.actor) {
			if (options.actor.actor) {
				this.actor = options.actor;
			} else {
				this.actor = {
					actor:		options.actor as Actor,
					facing:		"S",
					action:		options.actor.TALKING
				};
			}

			this.actor.width	= this.actor.width	|| this.actor.actor.width;
			this.actor.height	= this.actor.width	|| this.actor.actor.height;
		}

		if (options.choices && options.choices.length > 0) {
			this.choices = options.choices;
		}

		let lines		= this.msg.split('\n');

		this.lineCount	= lines.length;
		this.height		= lines.length;
		this.width		= lines[0].length;

		for (let i = 1; i < lines.length; i++) {
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
		} else if (this.kb) {
			longest = (kbkeys[0].length * 2) + 1;
		}
		this.width = Math.max(this.width, longest);

		if (this.icon) {
			this.iconWidth = Math.ceil(this.icon[3] / fontSizeX);
			this.width += this.iconWidth;

			this.height = Math.max(this.height, Math.ceil(this.icon[4] / fontSizeY));
		} else if (this.actor) {
			this.iconWidth	= this.actor.width / fontSizeX;
			this.width		+= this.iconWidth;

			this.height		= Math.max(this.height, this.actor.height / fontSizeY);
		} else {
			this.iconWidth = 0;
		}

		this.canvas.setAttribute('width',  '' + ((this.width + 4) * fontSizeX));
		if (this.choices) {
			this.canvas.setAttribute('height', '' + ((this.height + 3 + this.choices.length) * fontSizeY));
		} else if (this.kb) {
			/* The keyboard takes up a lot of room... */
			this.canvas.setAttribute('height', '' + ((this.height + 6 + kbkeys.length) * fontSizeY));
		} else {
			this.canvas.setAttribute('height', '' + ((this.height + 2) * fontSizeY));
		}

		if (options.fill) {
			this.ctx.fillStyle = options.fill;
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		} else {
			this.ctx.fillStyle = '#666666';
			drawBorder(this.ctx, 0, 0, this.canvas.width, this.canvas.height, '#666666');
		}

		if (this.icon) {
			let y = 8 + ((this.height * fontSizeY) / 2) - (this.icon[4] / 2);

			this.ctx.drawImage(	this.icon[0],
								this.icon[1], this.icon[2],
								this.icon[3], this.icon[4],
								8, y,
								this.icon[3], this.icon[4]);
		}

		dialog = this;
		return(this);
	}

	close()
	{
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
				} else {
					this.closecb(this.selected);
				}
			}
		} else if (!this.closing) {
			/* Reset ticks - Count down now that we're closing */
			this.ticks = this.steps;
			this.closing = true;
		}
	}

	handleKBEvent(name, key, upper)
	{
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
						this.value.length < this.maxLength
				) {
					if (upper) {
						this.value += key.toUpperCase();
					} else {
						this.value += key.toLowerCase();
					}

					/* Move selector to "End" so that enter will finish */
					this.selected = kbkeys.join("").length + 3;
				} else {
					return(false);
				}
				break;
		}

		return(true);
	}

	tick()
	{
		if (this.inputcb) {
			/* Let the consumer handle input */
			this.inputcb(this);
		} else {
			if (!this.noinput && !this.modal &&
				input.getButton(input.BACK, true) & input.PRESSED
			) {
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
									} else {
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
									} else {
										this.value += keys.charAt(this.selected).toLowerCase();
									}
									break;
							}
						}
					} else if (this.drawLimit < this.msg.length) {
						this.drawLimit = this.msg.length;
					} else {
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
						} else if ((dirs[input.S] | dirs[input.W]) & input.PRESSED) {
							this.selected++;
						}
					} else if (this.kb) {
						/*
							The keyboard is 4 rows of 11 (currently) and has 2 extra
							for actions (shift, back and end).
						*/
						let kblen	= kbkeys.join("").length;

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

					drawText(this.ctx, i === this.selected ? [ 0 ] : " ",
						fontSizeX * (1 + this.width - longest),
						fontSizeY * (this.height + 2 + i));

					drawText(this.ctx, o,
						fontSizeX * (2 + this.width - longest),
						fontSizeY * (this.height + 2 + i));
				}
			} else if (this.kb) {
				let i = 0;

				for (let x = 0; x < this.maxLength; x++) {
					drawText(this.ctx, this.value.charAt(x) || ' ',
						(x + 3) * fontSizeX, (this.lineCount + 2) * fontSizeY);
				}

				for (let y = 0; y < kbkeys.length; y++) {
					for (let x = 0; x < kbkeys[y].length; x++) {
						drawText(this.ctx, i === this.selected ? [ 0 ] : " ",
							((x * 2) + 2) * fontSizeX,
							(fontSizeY * (y + this.lineCount + 4)));

						drawText(this.ctx, this.upper ?
								kbkeys[y].charAt(x) : kbkeys[y].charAt(x).toLowerCase(),
							((x * 2) + 3) * fontSizeX,
							(fontSizeY * (y + this.lineCount + 4)));

						i++;
					}
				}

				let choices = [ "Shift", "Del", "End" ];

				let x = 8;
				for (let o = 0; o < choices.length; o++) {
					drawText(this.ctx, i === this.selected ? [ 0 ] : " ",
						(x++) * fontSizeX,
						(fontSizeY * (kbkeys.length + this.lineCount + 4)));
					drawText(this.ctx, choices[o],
						(x) * fontSizeX,
						(fontSizeY * (kbkeys.length + this.lineCount + 4)));
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
			} else {
				x++;
			}

			if (i < this.drawn) {
				continue;
			}

			if (1 === this.lineCount && (this.icon || this.actor) && !this.choices && !this.kb) {
				oy = (this.height - 1) * fontSizeY / 2;
			}

			drawText(this.ctx, c,
				fontSizeX * (x + 1 + this.iconWidth), (fontSizeY * (y + 1)) + oy);
			this.drawn++;
		}
	}

	render(ctx)
	{
		let img		= this.canvas;
		let perx	= Math.min(this.ticks / this.steps, 1);
		let pery	= Math.min(this.ticks / this.steps, 1);

		if (!img || !ctx || this.closed) {
			return;
		}

		let w = Math.floor(perx * img.width);
		let h = Math.floor(pery * img.height);
		let x = Math.floor(ctx.canvas.width  / 2);
		let y;

		x -= Math.floor(w / 2);

		if (this.spoken) {
			y = (ctx.canvas.height - 15) - h;
		} else {
			y = Math.floor(ctx.canvas.height / 2);
			y -= Math.floor(h / 2);
		}

		if (this.actor) {
			let rate	= this.actor.rate;
			let delay	= this.actor.delay || 0;
			let ticks;

			if (isNaN(rate)) {
				rate	= 1.0;
			}

			ticks = Math.floor(this.ticks * rate);
			ticks -= delay;

			if (ticks < 0) {
				ticks = 0;
			}

			let ay = 8 + ((this.height * fontSizeY) / 2) - (this.actor.actor.height / 2);

			this.ctx.fillRect(8, ay, this.actor.actor.width, this.actor.actor.height);
			this.actor.actor.renderState(this.ctx,
							this.actor.action, this.actor.facing,
							ticks, 8, ay);
		}

		ctx.drawImage(img,
					0, 0,
					img.width, img.height,
					x, y,
					perx * img.width, pery * img.height);
	}
}

