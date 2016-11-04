function Actor(id, controls)
{
	if (!id || !world.actors[id]) {
		console.log("Could not find definition for actor:" + id);
		return(null);
	}

	this.id			= id;

	this.ticks		= 0;
	this.controls	= controls;
	this.state		= this.STANDING;
	this.definition	= world.actors[id];

	this.width		= this.definition.width  || TILE_SIZE;
	this.height		= this.definition.height || TILE_SIZE;

	/* Set defaults from the definition */
	this.x			= this.definition.x;
	this.y			= this.definition.y;
	this.facing		= this.definition.facing;

	this.area		= this.definition.area;
	this.visible	= this.area && this.area === world.area;

	if (id === "blud") {
		this.player	= true;
	}
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

	if (!(img = world.images[src])) {
		img = world.images[src] = loadImage(src);
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

	switch (this.state) {
		case this.STUCK:
		case this.MOVING:
			var frames		= 8;

			if (def && !isNaN(def.frames)) {
				frames = def.frames;
			}

			/* Calculate the destination coordinates */
			var newpos = null;

			if (this.MOVING === orgstate) {
				newpos = this.lookingAt();

				if (this.player && 1 === this.ticks) {
					scrollViewport(newpos[0], newpos[1], frames);
				}
			}

			if (this.ticks <= frames) {
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
				if (newpos) {
					this.x = newpos[0];
					this.y = newpos[1];

					/* Did that movement take us to a different area? */
					if (this.player) {
						switchArea(this.x, this.y);
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
};

/*
	Return the coords of the position at which this actor should be rendered.

	This will usually just be the actor's actual position, but if the actor is
	moving south then it needs to be rendered one row lower to avoid tiles below
	being drawn over it.
*/
Actor.prototype.renderPos = function renderPos()
{
	if ('S' === this.facing && this.MOVING === this.state) {
		return([ this.x, this.y + 1 ]);
	} else {
		return([ this.x, this.y ]);
	}
};

Actor.prototype.lookingAt = function lookingAt()
{
	var x = this.x;
	var y = this.y;

	switch (this.facing) {
		case 'N': y--; break;
		case 'E': x++; break;
		case 'S': y++; break;
		case 'W': x--; break;
	}

	return([ x, y ]);
}

Actor.prototype.render = function render(ctx, wx, wy)
{
	/* Grab the definition for this character's current action and direction */
	var def		= this.getDefinition(this.state, this.facing);

	/* Which tile (relative to the viewport) is the actor on */
	var x		= this.x - world.viewport.x;
	var y		= this.y - world.viewport.y;

	/* Offset (relative to the tile) */
	var ox		= wx;
	var oy		= wy;

	var frames	= 1;

	if (def && !isNaN(def.frames)) {
		frames = def.frames;
	}

	switch (this.state) {
		case this.STUCK:
		case this.TURNING:
			break;

		case this.MOVING:
			var steps = TILE_SIZE / frames;

			switch (this.facing) {
				case 'N': oy += -this.ticks * steps; break;
				case 'E': ox +=  this.ticks * steps; break;
				case 'S': oy +=  this.ticks * steps; break;
				case 'W': ox += -this.ticks * steps; break;
			}
			break;

		case this.BLINKING:
		case this.STANDING:
			break;
	}

	this.renderState(ctx, this.state, this.facing, this.ticks,
							(x * TILE_SIZE) + ox, (y * TILE_SIZE) + oy);
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

	if (!(img = world.images[src])) {
		img = world.images[src] = loadImage(src);
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

