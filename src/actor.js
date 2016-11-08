/*
	Keep a global list of all active actors, since many actors need to find
	others that may be nearby.
*/
// TODO Find a better way to track this. Perhaps keep a list of actors on the
//		level that only includes those that are in the current area?
var actors = [];
var player = null;

function Actor(world, id, level, controls)
{
	if (!id || !world.actors[id]) {
		console.log("Could not find definition for actor:" + id);
		return(null);
	}

	this.id			= id;
	this.level		= level;

	this.ticks		= 0;
	this.state		= this.STANDING;
	this.definition	= world.actors[id];
	this.controls	= controls;

	this.width		= this.definition.width  || TILE_SIZE;
	this.height		= this.definition.height || TILE_SIZE;

	/* Set defaults from the definition */
	this.facing		= this.definition.facing;
	this.x			= this.definition.x;
	this.y			= this.definition.y;

	this.health		= WRand() % 100;

	this.newpos		= {
		x:			this.x,
		y:			this.y
	};

	this._lookingAt	= {
		x:			0,
		y:			0
	};

	this.renderOff	= {
		x:			0,
		y:			0
	};

	this.area		= this.definition.area;

	switch (id) {
		case "blud":
			player = this;
			this.player	= true;
			this.level.scrollTo(true, this.x * TILE_SIZE, this.y * TILE_SIZE);
			break;

		case "rotavirus":
			this.controls = new RotaVirusControls(this);
			break;
	}

	actors.push(this);
};

Actor.prototype.STANDING		= "standing";
Actor.prototype.BLINKING		= "blinking";
Actor.prototype.STUCK			= "stuck";
Actor.prototype.TURNING			= "turning";
Actor.prototype.MOVING			= "moving";
Actor.prototype.TALKING			= "talking";

Actor.prototype.getDefinition = function getDefinition(state, direction)
{
	var def = null;

	if (this.definition[state]) {
		def = this.definition[state][direction] || this.definition[state]['S'];
	}

	if (!def) {
		switch (state) {
			case this.STUCK:
				def = this.getDefinition(this.MOVING, direction);
				break;

			default:
			case this.BLINKING:
				def = this.getDefinition(this.STANDING, direction);
				break;

			case this.STANDING:
				/* This is the default; so it can't fall back to anything else */
				break;
		}
	}

	/* Fill out some sane defaults */
	if (isNaN(def.ox)) {
		def.ox = 0;
	}
	if (isNaN(def.oy)) {
		def.oy = 0;
	}

	return(def);
};

Actor.prototype.isAt = function isAt(x, y)
{
	if (x === this.x && y === this.y) {
		return(true);
	}

	if (x === this.newpos.x && y === this.newpos.y) {
		return(true);
	}

	return(false);
};

Actor.prototype.setState = function setState(state)
{
	if (state && this.state !== state) {
		this.state = state;
		this.ticks = 0;
	}
};

Actor.prototype.isActive = function isActive(state)
{
	switch (state || this.state) {
		case this.MOVING:
		case this.STUCK:
			return(true);

		default:
			return(false);
	}
}

Actor.prototype.talk = function talk()
{
	// TODO Add actual logic to control what the actor can say
	if (!this.definition.dialog) {
		return;
	}

	var def	= this.getDefinition(this.STANDING, "S");
	var msg = this.definition.dialog[this.ticks % this.definition.dialog.length];
	var src = def.src || this.definition.src;
	var img;

	if (!(img = this.level.images[src])) {
		img = this.level.images[src] = loadImage(src);
	}

	new Dialog({
		actor:		this,
		msg:		msg,
		spoken:		true
	});
};

Actor.prototype.tick = function tick()
{
	/*
		Keep some information about the current state that may be referenced
		below after the state has changed.
	*/
	var orgfacing	= this.facing;
	var orgstate	= this.state;

	/* Grab the definition for this character's current action and direction */
	var def			= this.getDefinition(this.state, this.facing);

	this.ticks++;

	this.newpos.x	= this.x;
	this.newpos.y	= this.y;

	switch (this.state) {
		case this.STUCK:
		case this.MOVING:
			/*
				How many frames does it take to move this character (in this
				state) one tile?

				In most cases the number of frames will match the number of
				steps, but it is also possible for the animation to repeat.
			*/
			var frames	= 8;
			var rate	= 1;

			if (def && !isNaN(def.steps)) {
				frames = def.steps
			} else if (def && !isNaN(def.frames)) {
				frames = def.frames;
			}

			if (def && !isNaN(def.rate)) {
				rate = def.rate;
			}

			/* Calculate the destination coordinates */
			var movingto = null;

			if (this.MOVING === orgstate) {
				movingto = this.lookingAt();

				this.newpos.x = movingto.x;
				this.newpos.y = movingto.y;
			}

			if (Math.floor(this.ticks * rate) <= frames) {
				if (orgstate !== this.STUCK) {
					/* Animation still in progress */
					break;
				} else {
					/*
						Fallthrough; Let input break a character out an
						animation for the stuck state.
					*/
					// console.log('stuck');
				}
			} else {
				/* The animation has completed */
				if (movingto) {
					this.x = movingto.x;
					this.y = movingto.y;

					/* Did that movement take us to a different area? */
					if (this.player) {
						this.level.switchArea(this.x, this.y, this);
					}
				}

				this.setState(this.STANDING);
				/* Fallthrough to handle input again */
			}

		case this.BLINKING:
		case this.STANDING:
			var nesw	= "NESW";
			var order	= "";
			var others	= "";
			var dirs;

			/*
				Adjust the order we try each direction so that directions that
				the actor can move to are preferred, and the last direction
				that the actor travelled in is not preferred.

				This should ensure that a player holding multiple directions
				will see the expected behavior.
					1) Holding 2 directions will cause the actor to slide along
					a wall that is blocking movement in one of those directions.

					2) A character will zigzag when holding 2 directions with
					nothing blocking the path.
			*/
			for (var i = 0, d; (d = nesw.charAt(i)) && d.length === 1; i++) {
				if (canMove(this, d)) {
					if (d !== this.facing) {
						order = d + order;
					} else {
						order = order + d;
					}
				} else {
					others = others + d;
				}
			}
			order = order + others;
			// debug(order);

			if (this.controls) {
				dirs = this.controls.getDirection(true);
			} else {
				// TODO Load a different set of controls depending on the actor
				//		type. This will likely be based on a schedule set in
				//		the definition file.
				dirs = {};
			}

			if (0 == (this.ticks % 3)) {
				switch (this.state) {
					case this.STANDING:
						if (0 == (WRand() % 40)) {
							// console.log('blink');
							this.state = this.BLINKING;
						}
						break;

					case this.BLINKING:
						this.state = this.STANDING;
						break;
				}
			}

			for (var i = 0, d; (d = order.charAt(i)) && d.length > 0; i++) {
				if (dirs[d]) {
					this.facing = d;

					if (!canMove(this, d)) {
						/*
							Change to the stuck state (pushing against a solid
							block) right away. There is no need to change to
							turning since the actor can't move so no need to let
							the turn be cancelled.
						*/
						this.setState(this.STUCK);
					} else if (orgfacing !== d && !this.isActive(orgstate)) {
						/*
							The character was not moving and is now turning to a
							new direction. This state exists to provide a small
							delay before moving so that the player can turn the
							character in place without moving by tapping a
							directional input.
						*/
						this.setState(this.TURNING);
						break;
					} else {
						/* Start moving */
						this.setState(this.MOVING);
						break;
					}
				}
			}
			break;

		case this.TURNING:
			var dirs;

			if (this.controls) {
				dirs = this.controls.getDirection(false);
			} else {
				dirs = {};
			}

			if (this.facing && !(dirs[this.facing] & input.HELD)) {
				/*
					The direction input was released before the actor started
					moving. Leave the actor on the same spot but facing the new
					direction.
				*/
				this.setState(this.STANDING);
				break;
			}

			if (this.ticks > 4) {
				/*
					The directional input was held long enough to complete the
					turn and start moving in the new direction.
				*/
				this.setState(this.MOVING);
				break;
			}
			break;
	}

	/*
		Calculate the rendering offset to use if the character is currently
		moving from one tile to another.
	*/
	this.renderOff.x = 0;
	this.renderOff.y = 0;

	/* Grab the definition for this character's current action and direction */
	var def		= this.getDefinition(this.state, this.facing);

	var frames	= 1;
	var rate	= 1;

	if (def && !isNaN(def.steps)) {
		frames = def.steps
	} else if (def && !isNaN(def.frames)) {
		frames = def.frames;
	}

	if (def && !isNaN(def.rate)) {
		rate = def.rate;
	}

	switch (this.state) {
		default:
			break;

		case this.MOVING:
			var steps = TILE_SIZE / frames;

			switch (this.facing) {
				case 'N': this.renderOff.y -= Math.floor(this.ticks * steps * rate); break;
				case 'E': this.renderOff.x += Math.floor(this.ticks * steps * rate); break;
				case 'S': this.renderOff.y += Math.floor(this.ticks * steps * rate); break;
				case 'W': this.renderOff.x -= Math.floor(this.ticks * steps * rate); break;
			}

			if (this.player) {
				this.level.scrollTo(false,
					(this.x * TILE_SIZE) + this.renderOff.x,
					(this.y * TILE_SIZE) + this.renderOff.y);
			}
			break;
	}
};

/* Return true if this actor should be rendered on the specified row */
Actor.prototype.renderRow = function renderRow(y)
{
	if ('S' === this.facing && this.MOVING === this.state) {
		return(y === this.y + 1);
	} else {
		return(y === this.y);
	}
};

Actor.prototype.lookingAt = function lookingAt()
{
	this._lookingAt.x = this.x;
	this._lookingAt.y = this.y;

	switch (this.facing) {
		case 'N': this._lookingAt.y--; break;
		case 'E': this._lookingAt.x++; break;
		case 'S': this._lookingAt.y++; break;
		case 'W': this._lookingAt.x--; break;
	}

	return(this._lookingAt);
}

Actor.prototype.render = function render(ctx, wx, wy)
{
	/* Which tile (relative to the viewport) is the actor on */
	var x		= (this.x * TILE_SIZE) - wx;
	var y		= (this.y * TILE_SIZE) - wy;

	/* Add the offset if the character is moving between tiles */
	x += this.renderOff.x;
	y += this.renderOff.y;

	this.renderState(ctx, this.state, this.facing, this.ticks, x, y);
};

Actor.prototype.renderState = function renderState(ctx, state, facing, ticks, x, y)
{
	/* Grab the definition for this character's current action and direction */
	var def	= this.getDefinition(state, facing);
	var src = def.src || this.definition.src;
	var img;

	if (!src) {
		return;
	}

	if (!(img = this.level.images[src])) {
		img = this.level.images[src] = loadImage(src);
	}

	/* How many frames are there for this state? */
	var frames	= 1;
	var rate	= 1;
	var frame;

	if (def && !isNaN(def.frames)) {
		frames = def.frames;
	}
	if (def && !isNaN(def.rate)) {
		rate = def.rate;
	}

	/* Determine which frame to use */
	var sx = def.x;
	var sy = def.y;

	frame = Math.floor(ticks * rate);
	if (def.repeat !== undefined && !def.repeat && frame >= frames) {
		frame = frames - 1;
	}

	sx += (frame % frames) * (def.ox || 0);
	sy += (frame % frames) * (def.oy || 0);

	ctx.drawImage(img,
			sx * this.width, sy * this.height,
			this.width, this.height,
			x, y,
			this.width, this.height);
};

