function InputHandler(canvas)
{
	/* It only makes sense to have one instance of this */
	if (arguments.callee._singletonInstance) {
		return(arguments.callee._singletonInstance);
	}
	arguments.callee._singletonInstance = this;

	/* Constants */
	this.PRESSED		= 0x1; /* The button has been pressed and not acted on */
	this.HELD			= 0x2; /* The button is still being held */

	this.NORTH			= this.N = 'N';
	this.EAST			= this.E = 'E';
	this.SOUTH			= this.S = 'S';
	this.WEST			= this.W = 'W';

	this.PAUSE			= 'pause';
	this.CONTINUE		= 'continue';
	this.BACK			= 'back';
	this.START			= 'start';
	this.SELECT			= 'select';
	this.A				= 'A';
	this.B				= 'B';
	this.X				= 'X';
	this.Y				= 'Y';
	this.LB				= 'LB';
	this.RB				= 'RB';

	this.axisThreshold	= 0.5;

	/* The status of each device. The details may vary from device to device */
	this.devices = {
		js:		[],
		kb:		{},
		other:	{}
	};

	this.bindings = {
		js: [
			/* Left stick (usually) */
			{
				action:		this.N,
				key:		"axis1-"
			}, {
				action:		this.E,
				key:		"axis0+"
			}, {
				action:		this.S,
				key:		"axis1+"
			}, {
				action:		this.W,
				key:		"axis0-"
			},

			/* dpad (usually) */
			{
				action:		this.N,
				key:		"axis7-"
			}, {
				action:		this.E,
				key:		"axis6+"
			}, {
				action:		this.S,
				key:		"axis7+"
			}, {
				action:		this.W,
				key:		"axis6-"
			},

			/* Buttons */
			{
				action:		this.CONTINUE,
				key:		"button0"
			}, {
				action:		this.BACK,
				key:		"button1"
			},

			{
				action:		this.A,
				key:		"button0"
			}, {
				action:		this.B,
				key:		"button1"
			}, {
				action:		this.X,
				key:		"button2"
			}, {
				action:		this.Y,
				key:		"button3"
			},

			{
				action:		this.PAUSE,
				key:		"button7"
			},
			{
				action:		this.START,
				key:		"button7"
			},
			{
				action:		this.CONTINUE,
				key:		"button7"
			},
			{
				action:		this.SELECT,
				key:		"button6"
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
			}, {
				action:		this.A,
				key:		"space"
			},

			{
				action:		this.START,
				key:		"escape"
			}, {
				action:		this.PAUSE,
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
			if (this.kbhandler && this.kbhandler(e.code, e.key, e.shiftKey)) {
				/*
					The current registered handler ate the keypress, so don't
					bother setting that state. We still track held though.
				*/
				this.devices.kb[e.code.toLowerCase()] = this.HELD;
			} else {
				this.devices.kb[e.code.toLowerCase()] = this.PRESSED | this.HELD;
			}
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

	window.addEventListener("gamepadconnected", function(e)
	{
		console.log(e.gamepad);
		// TODO Look for a preset or previously configured mapping for this
		//		controller

		this.remapjs("An unrecognized controller has been connected");
	}.bind(this));
	if (this.getGamepads().length > 0) {
		// TODO Look for a preset or previously configured mapping for this
		//		controller

		this.remapjs("An unrecognized controller has been connected");
	}

	window.onpagehide = window.onblur = function(e)
	{
		this.devices.other[this.PAUSE] = this.PRESSED;
	}.bind(this);

	return(this);
}

/*
	Return an object with the current state of all directions.

	This call will clear the PRESSED status from all inputs, so it should only
	be called once per tick.
*/
InputHandler.prototype.getDirection = function getDirection(clear)
{
	var d = {};

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
			for (var p = 0; p < this.devices.js.length; p++) {
				d[b.action] |= this.devices.js[p][b.key];

				if (clear) {
					this.devices.js[p][b.key] &= ~this.PRESSED;
				}
			}
		}
	}

	return(d);
};

InputHandler.prototype.getButton = function getButton(name, clear)
{
	var		btn = 0;

	if ("string" === typeof name) {
		name = [ name ];
	}

	for (var n = 0; n < name.length; n++) {
		if (this.devices.other[name[n]]) {
			btn |= this.devices.other[name[n]];

			if (clear) {
				this.devices.other[name[n]] &= ~this.PRESSED;
			}
		}
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

		for (var p = 0; p < this.devices.js.length; p++) {
			btn |= this.devices.js[p][b.key];
			if (clear) {
				this.devices.js[p][b.key] &= ~this.PRESSED;
			}
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

InputHandler.prototype.getGamepads = function getGamepads()
{
	var gamepads;

	if (navigator.getGamepads) {
		gamepads = navigator.getGamepads();
	} else if (navigator.webkitGetGamepads) {
		gamepads = navigator.webkitGetGamepads();
	} else {
		gamepads = [];
	}

	return(gamepads);
};

/*
	Some devices (gamepads with the current js API for example) require polling
	instead of acting on events. Calling this function as frequently as possible
	is required to avoid missing button presses on these devices.
*/
InputHandler.prototype.poll = function poll()
{
	var gamepads = this.getGamepads();

	for (var i = 0, pad; pad = gamepads[i]; i++) {
		if (!this.devices.js[i]) {
			this.devices.js[i] = {};
			this.devices.js[i].id = pad.id;
		}

		for (var a = 0; a < pad.axes.length; a++) {
			var axis	= pad.axes[a];
			var key		= "axis" + a;
			var on		= false;

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
				}

				this.devices.js[i][key] |= this.HELD;
			} else {
				this.devices.js[i][(key + '+')] &= ~this.HELD;
				this.devices.js[i][(key + '-')] &= ~this.HELD;
			}
		}

		for (var b = 0; b < pad.buttons.length; b++) {
			var btn	= pad.buttons[b];
			var key	= "button" + b;
			var on;

			if ("object" === typeof btn) {
				on = btn.pressed;
			} else {
				on = btn;
			}

			if (on) {
				if (!this.devices.js[i][key]) {
					this.devices.js[i][key] = this.PRESSED;
				}
				this.devices.js[i][key] |= this.HELD;
			} else {
				this.devices.js[i][key] &= ~this.HELD;
			}
		}
	}

	// debug(JSON.stringify(this.devices.js));
};

InputHandler.prototype.remapjs = function remapjs(msg)
{
	if (msg) {
		var d = new Dialog({
			msg:		msg,
			noinput:	true
		});

		setTimeout(function() {
			d.close();
			this.remapjs();
		}.bind(this), 3000);
		return;
	}

	for (var p = 0; p < this.devices.js.length; p++) {
		this.clearPressed(this.devices.js[p]);
	}

	loadImage('images/blud.png', function(img) {
		var map		= [];
		var canvas	= document.createElement('canvas');
		var ctx		= canvas.getContext('2d');

		var original = this.bindings.js;
		this.bindings.js = [];

		var todo	= {};
						/* Left image, Right Image, Name */
		todo[input.N] =		[ 1, 0, "Up"	];
		todo[input.E] =		[ 2, 0, "Right"	];
		todo[input.S] =		[ 3, 0, "Down"	];
		todo[input.W] =		[ 4, 0, "left"	];

		todo[input.A] =		[ 0, 3, "A"		];
		todo[input.B] =		[ 0, 2, "B"		];
		todo[input.X] =		[ 0, 4, "X"		];
		todo[input.Y] =		[ 0, 1, "Y"		];

		todo[input.START] =	[ 0, 5, "START" ];
		todo[input.SELECT] =[ 5, 0, "SELECT"];

		todo[input.RB] =	[ 0, 6, "Right Shoulder" ];
		todo[input.LB] =	[ 6, 0, "Left Shoulder"  ];


		canvas.setAttribute('width',  32);
		canvas.setAttribute('height', 16);

		/* Base image */
		ctx.drawImage(img, 12 * 16, 0, 32, 16, 0, 0, 32, 16);

		var keys = Object.keys(todo);
		var key;

		var readInput = function readInput() {
			this.poll();

			for (var p = 0; p < this.devices.js.length; p++) {
				var pad		= this.devices.js[p];
				var pkeys	= Object.keys(pad);

				for (var i = 0; i < pkeys.length; i++) {
					if (pad[pkeys[i]] & this.PRESSED) {
						/* We found a new button */
						map.push({
							action: key,
							key:	pkeys[i],
							device:	pad.id
						});

						/* Add alternate button names as well */
						if (key === this.A || key === this.START) {
							map.push({
								action: this.CONTINUE,
								key:	pkeys[i],
								device:	pad.id
							});
						}
						if (key === this.B) {
							map.push({
								action: this.BACK,
								key:	pkeys[i],
								device:	pad.id
							});
						}
						if (key === this.START) {
							map.push({
								action: this.PAUSE,
								key:	pkeys[i],
								device:	pad.id
							});
						}

						nextInput();
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

			if (!(key = keys.shift())) {
				// TODO Save locally and then load again at startup
				console.log(JSON.stringify(map));

				this.bindings.js = map;

				var t = null;
				var d = new Dialog({
					msg: [
						"Success",
						"",
						"Press start to save or wait",
						"5 seconds to restart mapping"
					].join('\n'),
					closecb: function(value) {
						clearTimeout(t);

						if (-1 != value && map) {
							this.bindings.js = map;
						} else {
							this.bindings.js = original;
						}
					}.bind(this)
				});

				t = setTimeout(function() {
					d.close();
					this.remapjs();
				}.bind(this), 5000);

				return;
			}

			var offsets = todo[key];

			/* Draw left and right sides of image */
			ctx.drawImage(img, 12 * 16, offsets[0] * 16, 16, 16, 0,  0, 16, 16);
			ctx.drawImage(img, 13 * 16, offsets[1] * 16, 16, 16, 16, 0, 16, 16);

			for (var p = 0; p < this.devices.js.length; p++) {
				this.clearPressed(this.devices.js[p]);
			}

			dialog = new Dialog({
				steps:	0,
				msg: [
					"Press and hold the highlighted",
					"button on your controller."
				].join('\n'),
				icon:	[ canvas, 0, 0, 32, 16 ],
				closecb: nextInput.bind(this),
				inputcb: readInput.bind(this)
			});
			dialog.tick();
		}.bind(this);
		nextInput.bind(this)();
	}.bind(this));
};

