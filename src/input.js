function InputHandler(canvas, getWorldPosCB, getPlayerPosCB)
{
	/* It only makes sense to have one instance of this */
	if (arguments.callee._singletonInstance) {
		return(arguments.callee._singletonInstance);
	}
	arguments.callee._singletonInstance = this;

	/* Constants */
	this.PRESSED		= 0x1; /* The button has been pressed and not acted on */
	this.HELD			= 0x2; /* The button is still being held */

	this.NORTH			= this.N = 0;
	this.EAST			= this.E = 1;
	this.SOUTH			= this.S = 2;
	this.WEST			= this.W = 3;

	this.CONTINUE		= 'continue';
	this.BACK			= 'back';
	this.START			= 'start';
	this.SELECT			= 'select';
	this.A				= 'A';
	this.B				= 'B';
	this.X				= 'X';
	this.Y				= 'Y';


	/* The status of buttons as presented to the consumer */
	this.buttons = {};

	/* The status of each device. The details may vary from device to device */
	this.devices = {
		js:		{},
		kb:		{},
		mouse:	{}
	};

	this.bindings = {
		js: [
			/* Left stick (usually) */
			{
				action:		this.N,
				axis:		1,
				threshold:	-0.5
			}, {
				action:		this.E,
				axis:		0,
				threshold:	0.5
			}, {
				action:		this.S,
				axis:		1,
				threshold:	0.5
			}, {
				action:		this.W,
				axis:		0,
				threshold:	-0.5
			},

			/* dpad (usually) */
			{
				action:		this.N,
				axis:		7,
				threshold:	-0.5
			}, {
				action:		this.E,
				axis:		6,
				threshold:	0.5
			}, {
				action:		this.S,
				axis:		7,
				threshold:	0.5
			}, {
				action:		this.W,
				axis:		6,
				threshold:	-0.5
			},

			/* Buttons */
			{
				action:		this.CONTINUE,
				button:		0
			}, {
				action:		this.BACK,
				button:		1
			},

			{
				action:		this.A,
				button:		0
			}, {
				action:		this.B,
				button:		1
			}, {
				action:		this.X,
				button:		2
			}, {
				action:		this.Y,
				button:		3
			},

			{
				action:		this.START,
				button:		7
			},
			{
				action:		this.CONTINUE,
				button:		7
			},
			{
				action:		this.SELECT,
				button:		6
			}
		],

		kb: [
			/* WASD */
			{
				action:		this.N,
				key:		"keyw"
			}, {
				action:		this.E,
				key:		"keyd"
			}, {
				action:		this.S,
				key:		"keys"
			}, {
				action:		this.W,
				key:		"keya"
			},

			/* Arrows */
			{
				action:		this.N,
				key:		"arrowup"
			}, {
				action:		this.E,
				key:		"arrowright"
			}, {
				action:		this.S,
				key:		"arrowdown"
			}, {
				action:		this.W,
				key:		"arrowleft"
			},

			/* Enter and escape for dialogs */
			{
				action:		this.CONTINUE,
				key:		"enter"
			}, {
				action:		this.CONTINUE,
				key:		"space"
			}, {
				action:		this.BACK,
				key:		"escape"
			},

			{
				action:		this.START,
				key:		"escape"
			}, {
				action:		this.SELECT,
				key:		"tab"
			}
		]
	};

	window.addEventListener('keydown', function(e)
	{
		if (!e.altKey && !e.ctrlKey) {
			this.devices.kb[e.code.toLowerCase()] = this.PRESSED | this.HELD;
			e.preventDefault();
		}
	}.bind(this));

	window.addEventListener('keyup', function(e)
	{
		if (!e.altKey && !e.ctrlKey) {
			this.devices.kb[e.code.toLowerCase()] &= ~this.HELD;
			e.preventDefault();
		}
	}.bind(this));

	var mousePos = function mousePos(e)
	{
		if (!(this.devices.mouse.state & this.HELD)) {
			return;
		}

		/* Store the position in the game world that the mouse is at */
		var pos = getWorldPosCB([e.offsetX, e.offsetY]);

		this.devices.mouse.x = pos[0];
		this.devices.mouse.y = pos[1];
	}.bind(this);

	canvas.addEventListener('mousemove', mousePos);
	canvas.addEventListener('mousedown', function(e) {
		this.devices.mouse.state = this.PRESSED | this.HELD;
		mousePos(e);
	}.bind(this));
	canvas.addEventListener('mouseup', function(e)
	{
		this.devices.mouse.state &= ~this.HELD;
	}.bind(this));

	this.getPlayerPosCB = getPlayerPosCB;

	return(this);
}

/*
	Return an array of the current state of all directions.

	This call will clear the PRESSED status from all inputs, so it should only
	be called once per tick.
*/
InputHandler.prototype.getDirection = function getDirection(clear)
{
	var d = [ false, false, false, false ];

	/* Compare the mouse position (if still pressed) to the character position */
	if (this.devices.mouse.state) {
		var charpos	= this.getPlayerPosCB();

		if (this.devices.mouse.x < charpos[0]) {
			d[this.W] = true;
		} else if (this.devices.mouse.x > charpos[0]) {
			d[this.E] = true;
		}

		if (this.devices.mouse.y < charpos[1]) {
			d[this.N] = true;
		} else if (this.devices.mouse.y > charpos[1]) {
			d[this.S] = true;
		}

		/* Clear the pressed state since this input has been handled */
		if (clear) {
			this.devices.mouse.state &= ~this.PRESSED;
		}
	}

	/* Merge results from the keyboard */
	for (var i = 0, b; b = this.bindings.kb[i]; i++) {
		if (!b || !b.key) {
			continue;
		}

		if ([ this.N, this.E, this.S, this.W ].includes(b.action)) {
			d[b.action] |= this.devices.kb[b.key];

			if (clear) {
				this.devices.kb[b.key] &= ~this.PRESSED;
			}
		}
	}

	/* Merge results from gamepads */
	this.poll();
	for (var i = 0, b; b = this.bindings.js[i]; i++) {
		if (!b || !b.key) {
			continue;
		}

		if ([ this.N, this.E, this.S, this.W ].includes(b.action)) {
			d[b.action] |= this.devices.js[b.key];

			if (clear) {
				this.devices.js[b.key] &= ~this.PRESSED;
			}
		}
	}

	return(d);
}

InputHandler.prototype.getButton = function getButton(name, clear)
{
	var		btn = 0;

	if ("string" === typeof name) {
		name = [ name ];
	}

	/* Merge results from the keyboard */
	for (var i = 0, b; b = this.bindings.kb[i]; i++) {
		if (!b || !b.key || !name.includes(b.action)) {
			continue;
		}

		btn |= this.devices.kb[b.key];
		if (clear) {
			this.devices.kb[b.key] &= ~this.PRESSED;
		}
	}

	/* Merge results from gamepads */
	this.poll();
	for (var i = 0, b; b = this.bindings.js[i]; i++) {
		if (!b || !b.key || !name.includes(b.action)) {
			continue;
		}

		btn |= this.devices.js[b.key];
		if (clear) {
			this.devices.js[b.key] &= ~this.PRESSED;
		}
	}

	return(btn);
};

InputHandler.prototype.clearPressed = function clearPressed(device)
{
	var keys	= Object.keys(device);

	for (var i = 0, key; key = keys[i]; i++) {
		device[key] &= ~this.PRESSED;
	}
};

/*
	Some devices (gamepads with the current js API for example) require polling
	instead of acting on events. Calling this function as frequently as possible
	is required to avoid missing button presses on these devices.
*/
InputHandler.prototype.poll = function poll()
{
	var gamepads;
	var axisThreshold	= 0.5;

	if (navigator.getGamepads) {
		gamepads = navigator.getGamepads();
	} else if (navigator.webkitGetGamepads) {
		gamepads = navigator.webkitGetGamepads();
	} else {
		gamepads = [];
	}

	for (var i = 0, pad; pad = gamepads[i]; i++) {
		for (var i = 0, b; b = this.bindings.js[i]; i++) {
			if (!isNaN(b.axis) && !isNaN(pad.axes[b.axis])) {
				var value	= pad.axes[b.axis];
				var on;

				if (b.threshold > 0) {
					on = value >= b.threshold;
				} else {
					on = value <= b.threshold;
				}

				if (!b.key) {
					b.key = 'axis:' + b.axis + (b.threshold > 0 ? '+' : '-');
				}

				if (on) {
					if (!this.devices.js[b.key]) {
						this.devices.js[b.key] = this.PRESSED;
					}
					this.devices.js[b.key] |= this.HELD;
				} else {
					this.devices.js[b.key] &= ~this.HELD;
				}
			} else if (!isNaN(b.button)) {
				var on;

				if ("object" === typeof pad.buttons[b.button]) {
					on = pad.buttons[b.button].pressed;
				} else {
					on = pad.buttons[b.button];
				}

				if (!b.key) {
					b.key = 'btn:' + b.button;
				}

				if (on) {
					if (!this.devices.js[b.key]) {
						this.devices.js[b.key] = this.PRESSED;
					}
					this.devices.js[b.key] |= this.HELD;
				} else {
					this.devices.js[b.key] &= ~this.HELD;
				}
			}
		}
	}

	// debug(JSON.stringify(this.devices.js));
};

