function InputHandler(canvas, getWorldPosCB, getPlayerPosCB)
{
	/* It only makes sense to have one instance of this */
	if (arguments.callee._singletonInstance) {
		return(arguments.callee._singletonInstance);
	}
	arguments.callee._singletonInstance = this;

	/* The status of buttons as presented to the consumer */
	this.buttons = {};

	/* The status of each device. The details may vary from device to device */
	this.devices = {
		js:		{},
		kb:		{},
		mouse:	{}
	};

	/* Constants */
	this.PRESSED		= 0x1; /* The button has been pressed and not acted on */
	this.HELD			= 0x2; /* The button is still being held */

	this.NORTH			= this.N = 0;
	this.EAST			= this.E = 1;
	this.SOUTH			= this.S = 2;
	this.WEST			= this.W = 3;

	window.addEventListener('keydown', function(e)
	{
		this.devices.kb[e.key.toLowerCase()] = this.PRESSED | this.HELD;
	}.bind(this));

	window.addEventListener('keyup', function(e)
	{
		this.devices.kb[e.key.toLowerCase()] &= ~this.HELD;
	}.bind(this));

	var mousePos = function mousePos(e)
	{
		if (!(this.devices.mouse.state & this.HELD)) {
			return;
		}

		/* Store the position in the game world that the mouse is at */
		var pos = getWorldPosCB([e.clientX, e.clientY]);

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
InputHandler.prototype.getDirection = function getDirection()
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
		this.devices.mouse.state &= ~this.PRESSED;
	}

	/* Merge the results from the mouse (already set) and kb and js */
	// TODO Implement support for alternate bindings...
	d[this.N] |= this.devices.js.up	|| this.devices.kb.arrowup		|| this.devices.kb.w;
	d[this.E] |= this.devices.js.right|| this.devices.kb.arrowright	|| this.devices.kb.d;
	d[this.S] |= this.devices.js.down	|| this.devices.kb.arrowdown	|| this.devices.kb.s;
	d[this.W] |= this.devices.js.left	|| this.devices.kb.arrowleft	|| this.devices.kb.a;

	/* Clear the pressed state on all inputs on all devices */
	this.clearPressed(this.devices.js);
	this.clearPressed(this.devices.kb);

	return(d);
}

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
		if (pad.axes[0] < -axisThreshold) {
			this.devices.js.left = this.PRESSED | this.HELD;
		} else {
			this.devices.js.left &= ~this.HELD;
		}

		if (pad.axes[0] > axisThreshold) {
			this.devices.js.right = this.PRESSED | this.HELD;
		} else {
			this.devices.js.right &= ~this.HELD;
		}

		if (pad.axes[1] < -axisThreshold) {
			this.devices.js.up = true;this.PRESSED | this.HELD;
		} else {
			this.devices.js.up &= ~this.HELD;
		}
		if (pad.axes[1] > axisThreshold) {
			this.devices.js.down = true;this.PRESSED | this.HELD;
		} else {
			this.devices.js.down &= ~this.HELD;
		}
	}
};

