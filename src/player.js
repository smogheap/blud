function PlayerControls(actor)
{
	this.actor			= actor;
}

PlayerControls.prototype.isActive = function isActive(state)
{
	switch (state || this.actor.state) {
		case this.actor.MOVING:
		case this.actor.STUCK:
			return(true);

		default:
			return(false);
	}
};

PlayerControls.prototype.tick = function tick()
{
	/*
		Keep some information about the current state that may be referenced
		below after the state has changed.
	*/
	var actor		= this.actor;
	var orgfacing	= actor.facing;
	var orgstate	= actor.state;

	/* Grab the definition for this character's current action and direction */
	var def			= actor.getDefinition();

	switch (actor.state) {
		case actor.STUCK:
		case actor.MOVING:
			/*
				How many frames does it take to move this character (in this
				state) one tile?

				In most cases the number of frames will match the number of
				steps, but it is also possible for the animation to repeat.
			*/
			var frames	= 8;
			var rate	= 1;

			if (def && !isNaN(def.steps)) {
				frames = def.steps;
			} else if (def && !isNaN(def.frames)) {
				frames = def.frames;
			}

			if (def && !isNaN(def.rate)) {
				rate = def.rate;
			}

			/* Calculate the destination coordinates */
			var movingto = null;

			if (actor.MOVING === orgstate) {
				movingto = actor.lookingAt();
			}

			if (Math.floor(actor.frame * rate) <= frames) {
				if (orgstate !== actor.STUCK) {
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
				actor.setState(actor.STANDING);
				/* Fallthrough to handle input again */
			}

		case actor.BLINKING:
		case actor.STANDING:
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
				if (actor.canMove(d)) {
					if (d !== actor.facing) {
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

			dirs = input.getDirection(true);
			for (var i = 0, d; (d = order.charAt(i)) && d.length > 0; i++) {
				if (dirs[d]) {
					actor.facing = d;

					if (!actor.canMove(d)) {
						/*
							Change to the stuck state (pushing against a solid
							block) right away. There is no need to change to
							turning since the actor can't move so no need to let
							the turn be cancelled.
						*/
						actor.setState(actor.STUCK);
					} else if (orgfacing !== d && !this.isActive(orgstate)) {
						/*
							The character was not moving and is now turning to a
							new direction. This state exists to provide a small
							delay before moving so that the player can turn the
							character in place without moving by tapping a
							directional input.
						*/
						actor.setState(actor.TURNING);
						break;
					} else {
						/* Start moving */
						actor.setState(actor.MOVING, actor.lookingAt());
						break;
					}
				}
			}
			break;

		case actor.TURNING:
			var dirs = input.getDirection(false);

			if (actor.facing && !(dirs[actor.facing] & input.HELD)) {
				/*
					The direction input was released before the actor started
					moving. Leave the actor on the same spot but facing the new
					direction.
				*/
				actor.setState(actor.STANDING);
				break;
			}

			if (actor.frame > 4) {
				/*
					The directional input was held long enough to complete the
					turn and start moving in the new direction.
				*/
				actor.setState(actor.MOVING, actor.lookingAt());
				break;
			}
			break;
	}

	/*
		Calculate the rendering offset to use if the character is currently
		moving from one tile to another.
	*/
	actor.renderOff.x = 0;
	actor.renderOff.y = 0;

	/* Grab the definition for this character's current action and direction */
	var def		= actor.getDefinition();

	var frames	= 1;
	var rate	= 1;

	if (def && !isNaN(def.steps)) {
		frames = def.steps;
	} else if (def && !isNaN(def.frames)) {
		frames = def.frames;
	}

	if (def && !isNaN(def.rate)) {
		rate = def.rate;
	}

	switch (actor.state) {
		default:
			break;

		case actor.MOVING:
			var steps = TILE_SIZE / frames;

			switch (actor.facing) {
				case 'N': actor.renderOff.y -= Math.floor(actor.frame * steps * rate); break;
				case 'E': actor.renderOff.x += Math.floor(actor.frame * steps * rate); break;
				case 'S': actor.renderOff.y += Math.floor(actor.frame * steps * rate); break;
				case 'W': actor.renderOff.x -= Math.floor(actor.frame * steps * rate); break;
			}

			if (Math.abs(actor.renderOff.x) >= (TILE_SIZE * 0.5) ||
				Math.abs(actor.renderOff.y) >= (TILE_SIZE * 0.5)
			) {
				switch (actor.facing) {
					case 'N': actor.renderOff.y += TILE_SIZE; break;
					case 'E': actor.renderOff.x -= TILE_SIZE; break;
					case 'S': actor.renderOff.y -= TILE_SIZE; break;
					case 'W': actor.renderOff.x += TILE_SIZE; break;
				}

				actor.x = actor.newpos.x;
				actor.y = actor.newpos.y;

				/* Did that movement take us to a different area? */
				actor.level.switchArea(actor.x, actor.y, actor);
			}

			actor.level.scrollTo(false,
				(actor.x * TILE_SIZE) + actor.renderOff.x,
				(actor.y * TILE_SIZE) + actor.renderOff.y);
			break;
	}
};

function EyeballControls(actor)
{
	this.actor			= actor;

	for (;;) {
		this.speedX = ((WRand() / 10) % 6) - 3;
		this.speedY = ((WRand() / 10) % 6) - 3;

		/*
			Keep grabbing random values for speed until the eyeball is moving in
			one clear main direction.

			The intent is for the eyeballs to appear to move in any direction
			but to avoid things close to a 45 degree angle because we don't have
			an appropriate animation for that case.
		*/
		if (Math.abs(Math.abs(this.speedX) - Math.abs(this.speedY)) > 1.5) {
			break;
		}
	}

	// console.log(this.speedX, this.speedY);

	this.x = actor.x;
	this.y = actor.y;

	this.renderOff = {
		x: actor.renderOff.x,
		y: actor.renderOff.y
	};

	if (Math.abs(this.speedX) > Math.abs(this.speedY)) {
		if (this.speedX > 0) {
			actor.facing = "E";
		} else {
			actor.facing = "W";
		}
	} else {
		if (this.speedY < 0) {
			actor.facing = "N";
		} else {
			actor.facing = "S";
		}
	}

	actor.setState(actor.MOVING);
}

EyeballControls.prototype.updateLocation = function updateLocation()
{
	var actor	= this.actor;

	var x = this.renderOff.x;
	var y = this.renderOff.y;
	var mx = x > 0 ? 1 : -1;
	var my = y > 0 ? 1 : -1;

	actor.x = this.x;
	actor.y = this.y;

	while (Math.abs(x) > (TILE_SIZE / 2)) {
		actor.x += mx;
		x -= mx * TILE_SIZE;
	}
	actor.renderOff.x = x;

	while (Math.abs(y) > (TILE_SIZE / 2)) {
		actor.y += my;
		y -= my * TILE_SIZE;
	}
	actor.renderOff.y = y;
}

EyeballControls.prototype.tick = function tick()
{
	var actor	= this.actor;

	if (actor.state !== actor.MOVING) {
		/* This does nothing onces it stops */
		return;
	}

	this.renderOff.x += this.speedX;
	this.renderOff.y += this.speedY;
	this.updateLocation();

	if (!actor.canMove("-") || (Math.abs(this.speedX) < 0.1 && Math.abs(this.speedY) < 0.1)) {
		this.renderOff.x -= this.speedX;
		this.renderOff.y -= this.speedY;
		this.updateLocation();

		actor.setState(actor.STANDING);
	}

	this.speedX = this.speedX * 0.99;
	this.speedY = this.speedY * 0.99;
};

