class InputHandler
{

private static	_instance:InputHandler	= null;

/* Constants */
readonly PRESSED		= 0x1; /* The button has been pressed and not acted on */
readonly HELD			= 0x2; /* The button is still being held */

readonly NORTH			= 'N';
readonly EAST			= 'E';
readonly SOUTH			= 'S';
readonly WEST			= 'W';

readonly N				= this.NORTH;
readonly E				= this.EAST;
readonly S				= this.SOUTH;
readonly W				= this.WEST;

readonly PAUSE			= 'pause';
readonly CONTINUE		= 'continue';
readonly BACK			= 'back';
readonly START			= 'start';
readonly SELECT			= 'select';
readonly A				= 'A';
readonly B				= 'B';
readonly X				= 'X';
readonly Y				= 'Y';
readonly LB				= 'LB';
readonly RB				= 'RB';
readonly directions		= [ this.N, this.E, this.S, this.W ];

axisThreshold			= 0.5;
private _direction		= { N: 0, E: 0, S: 0, W: 0 };

/* The status of each device. The details may vary from device to device. */
devices = {
	js:		[],
	kb:		{},
	other:	{}
};

/* Timestamps of the last time each button was pressed. */
timestamps = {
	js:		[],
	kb:		{},
	other:	{}
};

/* Duration of the last keypress for each button */
durations = {
	js:		[],
	kb:		{},
	other:	{}
};

bindings = {
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

deviceBindings = {
	"8Bitdo": [
		{ action:"N",			key:"axis1-"},
		{ action:"E",			key:"axis0+"},
		{ action:"S",			key:"axis1+"},
		{ action:"W",			key:"axis0-"},
		{ action:"A",			key:"button1"},
		{ action:"continue",	key:"button1"},
		{ action:"B",			key:"button0"},
		{ action:"back",		key:"button0"},
		{ action:"X",			key:"button4"},
		{ action:"Y",			key:"button3"},
		{ action:"start",		key:"button11"},
		{ action:"continue",	key:"button11"},
		{ action:"pause",		key:"button11"},
		{ action:"select",		key:"button10"},
		{ action:"RB",			key:"button7"},
		{ action:"LB",			key:"button6"}
	],
	"X-Box 360": [
		/* Left stick (usually) */
		{ action: this.N,		key: "axis1-" },
		{ action: this.E,		key: "axis0+" },
		{ action: this.S,		key: "axis1+" },
		{ action: this.W,		key: "axis0-" },

		/* dpad (usually) */
		{ action: this.N,		key: "axis7-" },
		{ action: this.E,		key: "axis6+" },
		{ action: this.S,		key: "axis7+" },
		{ action: this.W,		key: "axis6-" },

		/* Buttons */
		{ action: this.CONTINUE,key: "button0" },
		{ action: this.BACK,	key: "button1" },

		{ action: this.A,		key: "button0" },
		{ action: this.B,		key: "button1" },
		{ action: this.X,		key: "button2" },
		{ action: this.Y,		key: "button3" },

		{ action: this.PAUSE,	key: "button7" },
		{ action: this.START,	key: "button7" },
		{ action: this.CONTINUE,key: "button7" },
		{ action: this.SELECT,	key: "button6" }
	]
};

constructor(canvas:HTMLCanvasElement)
{
	if (InputHandler._instance) {
		throw new Error("Error: InputHandler may only be created once");
	}
	InputHandler._instance	= this;

	window.addEventListener('keydown', function(e)
	{
		let key = e.code.toLowerCase();

		if (!e.altKey && !e.ctrlKey && !key.match(/f[0-9]+$/)) {
			if (this.kbhandler && this.kbhandler(e.code, e.key, e.shiftKey)) {
				/*
					The current registered handler ate the keypress, so don't
					bother setting that state. We still track held though.
				*/
				this.devices.kb[key] = this.HELD;
			} else if (!(this.devices.kb[key] & this.HELD)) {
				this.devices.kb[key] = this.PRESSED | this.HELD;
				this.timestamps.kb[key] = new Date();

				WRandUpdate(e.keyCode);
			}
			e.preventDefault();
		}
	}.bind(this));

	window.addEventListener('keyup', function(e)
	{
		if (!e.altKey && !e.ctrlKey) {
			let key = e.code.toLowerCase();

			this.devices.kb[key] &= ~this.HELD;

			this.durations.kb[key] = ((new Date()).getTime()) -
							this.timestamps.kb[key];
			e.preventDefault();
		}
	}.bind(this));

	window.addEventListener("gamepadconnected", function(e)
	{
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

	window.onpagehide = window.onblur = function(e)
	{
		this.devices.other[this.PAUSE] = this.PRESSED;
		this.timestamps.other[this.PAUSE] = new Date();
	}.bind(this);

	return(this);
}

/*
	Return an object with the current state of all directions.

	This call will clear the PRESSED status from all inputs, so it should only
	be called once per tick.
*/
getDirection(clear?:boolean)
{
	this._direction.N = 0;
	this._direction.E = 0;
	this._direction.S = 0;
	this._direction.W = 0;

	/* Merge results from the keyboard */
	for (let i = 0, b; b = this.bindings.kb[i]; i++) {
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
	for (let i = 0, b; b = this.bindings.js[i]; i++) {
		if (!b || !b.key) {
			continue;
		}

		if (-1 != this.directions.indexOf(b.action)) {
			for (let p = 0; p < this.devices.js.length; p++) {
				this._direction[b.action] |= this.devices.js[p][b.key];

				if (clear) {
					this.devices.js[p][b.key] &= ~this.PRESSED;
				}
			}
		}
	}

	return(this._direction);
};

getButton(name:string, clear?:boolean)
{
	let		btn = 0;

	if (this.devices.other[name]) {
		btn |= this.devices.other[name];

		if (clear) {
			this.devices.other[name] &= ~this.PRESSED;
		}
	}

	/* Merge results from the keyboard */
	for (let i = 0, b; b = this.bindings.kb[i]; i++) {
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
	for (let i = 0, b; b = this.bindings.js[i]; i++) {
		if (!b || !b.key || name !== b.action) {
			continue;
		}

		for (let p = 0; p < this.devices.js.length; p++) {
			btn |= this.devices.js[p][b.key];
			if (clear) {
				this.devices.js[p][b.key] &= ~this.PRESSED;
			}
		}
	}

	return(btn);
};

/*
	Like getButton, except that it does not return until the button is released
	and the result is the duration of the keystroke.
*/
getButtonTime(name:string, maxTime: number, clear?:boolean)
{
	let btn	= 0;
	let duration;

	if (this.devices.other[name]) {
		btn = this.devices.other[name];

		if ((btn & this.PRESSED)) {
			if (btn & this.HELD) {
				duration = ((new Date()).getTime()) - this.timestamps.other[name];
			} else {
				duration = this.durations.other[name];
			}

			if (!(btn & this.HELD) || duration >= maxTime) {
				if (clear) {
					this.devices.other[name] &= ~this.PRESSED;
				}
				return(duration);
			}
		}
	}

	/* Check results from the keyboard */
	for (let i = 0, b; b = this.bindings.kb[i]; i++) {
		if (!b || !b.key || name !== b.action) {
			continue;
		}

		btn = this.devices.kb[b.key];

		if ((btn & this.PRESSED)) {
			if (btn & this.HELD) {
				duration = ((new Date()).getTime()) - this.timestamps.kb[b.key];
			} else {
				duration = this.durations.kb[b.key];
			}

			if (!(btn & this.HELD) || duration >= maxTime) {
				if (clear) {
					this.devices.kb[b.key] &= ~this.PRESSED;
				}
				return(duration);
			}
		}
	}

	/* Merge results from gamepads */
	this.poll();
	for (let i = 0, b; b = this.bindings.js[i]; i++) {
		if (!b || !b.key || name !== b.action) {
			continue;
		}

		for (let p = 0; p < this.devices.js.length; p++) {
			btn = this.devices.js[p][b.key];

			if ((btn & this.PRESSED)) {
				if (btn & this.HELD) {
					duration = ((new Date()).getTime()) - this.timestamps.js[p][b.key];
				} else {
					duration = this.durations.js[p][b.key];
				}

				if (!(btn & this.HELD) || duration >= maxTime) {
					if (clear) {
						this.devices.js[p][b.key] &= ~this.PRESSED;
					}
					return(duration);
				}
			}
		}
	}

	return(0);
};

clearPressed(device)
{
	let keys	= Object.keys(device);

	for (let i = 0, key; key = keys[i]; i++) {
		if (!isNaN(device[key])) {
			device[key] &= ~this.PRESSED;
		}
	}
};

getGamepads()
{
	let gamepads;

	if (navigator.getGamepads) {
		gamepads = navigator.getGamepads();
	} else if ((navigator as any).webkitGetGamepads) {
		gamepads = (navigator as any).webkitGetGamepads();
	} else {
		gamepads = [];
	}

	if (!gamepads[0]) {
		gamepads = [];
	}

	return(gamepads);
};

/*
	Some devices (gamepads with the current js API for example) require polling
	instead of acting on events. Calling this function as frequently as possible
	is required to avoid missing button presses on these devices.
*/
poll()
{
	let gamepads = this.getGamepads();

	if (!gamepads[0]) {
		return[];
	}

	for (let i = 0, pad; pad = gamepads[i]; i++) {
		if (!this.devices.js[i]) {
			this.devices.js[i] = {};
			this.devices.js[i].id = pad.id;
		}
		if (!this.timestamps.js[i]) {
			this.timestamps.js[i] = {};
		}
		if (!this.durations.js[i]) {
			this.durations.js[i] = {};
		}

		for (let a = 0; a < pad.axes.length; a++) {
			let axis	= pad.axes[a];
			let key		= "axis" + a;
			let on		= false;

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

					WRandUpdate(200 + a);
				}

				this.devices.js[i][key] |= this.HELD;
			} else {
				this.devices.js[i][(key + '+')] &= ~this.HELD;
				this.devices.js[i][(key + '-')] &= ~this.HELD;
			}
		}

		for (let b = 0; b < pad.buttons.length; b++) {
			let btn	= pad.buttons[b];
			let key	= "button" + b;
			let on;

			if ("object" === typeof btn) {
				on = btn.pressed;
			} else {
				on = btn;
			}

			if (on) {
				if (!this.devices.js[i][key]) {
					this.devices.js[i][key] = this.PRESSED;
					this.timestamps.js[i][key] = new Date();

					WRandUpdate(b);
				}
				this.devices.js[i][key] |= this.HELD;
			} else {
				this.devices.js[i][key] &= ~this.HELD;

				this.durations.js[i][key] = ((new Date()).getTime()) -
								this.timestamps.js[i][key];
			}
		}
	}

	// debug(JSON.stringify(this.devices.js));
};

loadJSBindings(device?:any)
{
	let gamepads	= this.getGamepads();

	if (!gamepads[0]) {
		return(false);
	}

	if (!device) {
		device = gamepads[0].id;
	}

	let keys = Object.keys(this.deviceBindings);

	for (let i = 0, key; key = keys[i]; i++) {
		if (-1 != device.indexOf(key)) {
			this.bindings.js = this.deviceBindings[key];
			return(true);
		}
	}
	return(false);
};

remapjs(msg?:string)
{
	if (msg) {
		let d = new Dialog({
			msg:		msg,
			noinput:	true
		});

		setTimeout(function() {
			d.close();
			this.remapjs();
		}.bind(this), 3000);
		return;
	}

	for (let p = 0; p < this.devices.js.length; p++) {
		this.clearPressed(this.devices.js[p]);
	}

	loadImage('images/blud.png', function(img) {
		let map		= [];
		let canvas	= document.createElement('canvas');
		let ctx		= canvas.getContext('2d');

		let original = this.bindings.js;
		this.bindings.js = [];

		let todo	= {};
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


		canvas.setAttribute('width',  '' + 32);
		canvas.setAttribute('height', '' + 16);

		/* Base image */
		ctx.drawImage(img, 12 * 16, 0, 32, 16, 0, 0, 32, 16);

		let keys = Object.keys(todo);
		let key;

		let addToMap = function addToMap(action, key, device) {
			/* We found a new button */
			map.push({
				action: action,
				key:	key
			});

			/* Add alternate button names as well */
			if (action === this.A || action === this.START) {
				map.push({
					action: this.CONTINUE,
					key:	key
				});
			}
			if (action === this.B) {
				map.push({
					action: this.BACK,
					key:	key
				});
			}
			if (action === this.START) {
				map.push({
					action: this.PAUSE,
					key:	key
				});
			}
		}.bind(this);

		let current = null;
		let readInput = function readInput() {
			this.poll();

			for (let p = 0; p < this.devices.js.length; p++) {
				let pkeys = Object.keys(this.devices.js[p]);

				for (let i = 0; i < pkeys.length; i++) {
					let duration;

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

		let nextInput = function nextInput() {
			if (!map) {
				return;
			}

			this.poll();
			for (let p = 0; p < this.devices.js.length; p++) {
				this.clearPressed(this.devices.js[p]);
			}

			if (!(key = keys.shift())) {
				// TODO Save locally and then load again at startup
				console.log(JSON.stringify(map));

				this.bindings.js = map;

				let t = null;
				let d = new Dialog({
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

			let offsets = todo[key];

			/* Draw left and right sides of image */
			ctx.drawImage(img, 12 * 16, offsets[0] * 16, 16, 16, 0,  0, 16, 16);
			ctx.drawImage(img, 13 * 16, offsets[1] * 16, 16, 16, 16, 0, 16, 16);

			dialog = new Dialog({
				steps: 0,
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

} /* End InputHandler class */

