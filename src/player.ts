class Controls
{
	actor:		Actor;

	constructor(actor:Actor)
	{
		this.actor = actor;
	}

	tick()
	{
	}
}

class PlayerControls extends Controls
{
	moveFrames	= 0;

	private isActive(state)
	{
		switch (state || this.actor.state) {
			case this.actor.MOVING:
			case this.actor.STUCK:
				return(true);

			default:
				return(false);
		}
	}

	tick()
	{
		/*
			Keep some information about the current state that may be referenced
			below after the state has changed.
		*/
		let actor		= this.actor;
		let orgfacing	= actor.facing;
		let orgstate	= actor.state;

		/* Grab the definition for this character's current action and direction */
		let def			= actor.getDefinition();
		let dirs;

		if (actor.STUCK === actor.state || actor.MOVING === actor.state) {
			this.moveFrames++;
		} else {
			this.moveFrames = 0;
		}

		switch (actor.state) {
			case actor.STUCK:
			case actor.MOVING:
				/*
					How many frames does it take to move this character (in this
					state) one tile?

					In most cases the number of frames will match the number of
					steps, but it is also possible for the animation to repeat.
				*/
				let frames	= 8;
				let rate	= 1;

				if (def && !isNaN(def.steps)) {
					frames = def.steps;
				} else if (def && !isNaN(def.frames)) {
					frames = def.frames;
				}

				if (def && !isNaN(def.rate)) {
					rate = def.rate;
				}

				/* Calculate the destination coordinates */
				let movingto = null;

				if (actor.MOVING === orgstate) {
					movingto = actor.lookingAt();
				}

				if (Math.floor(actor.frame * rate) <= frames) {
					if (orgstate !== actor.STUCK) {
						/*
							If this.moveFrames < frames then the player likely
							just tapped a direction, in which case we want to
							allow moving one space.

							Otherwise if a player releases the button with less
							than half of the animation completed we want to
							cancel early because it feels more natural.
						*/
						dirs = input.getDirection(false);
						if (!dirs[actor.facing] && actor.frame < 5 && this.moveFrames >= frames) {
							/* Button was released early */
							actor.setState(actor.STANDING);

							/* Fallthrough to handle input again */
						} else {
							/* Animation still in progress */
							break;
						}
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
				let nesw	= "NESW";
				let order	= "";
				let others	= "";

				/*
					Adjust the order we try each direction so that directions
					that the actor can move to are preferred, and the last
					direction that the actor travelled in is not preferred.

					This should ensure that a player holding multiple directions
					will see the expected behavior.
						1) Holding 2 directions will cause the actor to slide
						along a wall that is blocking movement in one of those
						directions.

						2) A character will zigzag when holding 2 directions
						with nothing blocking the path.
				*/
				for (let i = 0, d; (d = nesw.charAt(i)) && d.length === 1; i++) {
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
				for (let i = 0, d; (d = order.charAt(i)) && d.length > 0; i++) {
					if (dirs[d]) {
						actor.facing = d;

						if (!actor.canMove(d)) {
							/*
								Change to the stuck state (pushing against a
								solid block) right away. There is no need to
								change to turning since the actor can't move so
								no need to let the turn be cancelled.
							*/
							actor.setState(actor.STUCK);
						} else if (orgfacing !== d && !this.isActive(orgstate)) {
							/*
								The character was not moving and is now turning
								to a new direction. This state exists to provide
								a small delay before moving so that the player
								can turn the character in place without moving
								by tapping a directional input.
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
				dirs = input.getDirection(false);

				if (actor.facing && !(dirs[actor.facing] & input.HELD)) {
					/*
						The direction input was released before the actor
						started moving. Leave the actor on the same spot but
						facing the new
						direction.
					*/
					actor.setState(actor.STANDING);
					break;
				}

				if (actor.frame > 4) {
					/*
						The directional input was held long enough to complete
						the turn and start moving in the new direction.
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
		def = actor.getDefinition();

		let frames	= 1;
		let rate	= 1;

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
				let steps = TILE_SIZE / frames;

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
	}
}

class EyeballControls extends Controls
{
	speedX:		number;
	speedY:		number;
	x:			number;
	y:			number;
	frame:		number;
	renderOff:	coord;

	constructor(actor:Actor)
	{
		super(actor);

		for (;;) {
			this.speedX = ((WRand() / 10) % 6) - 3;
			this.speedY = ((WRand() / 10) % 6) - 3;

			/*
				Keep grabbing random values for speed until the eyeball is
				moving in one clear main direction.

				The intent is for the eyeballs to appear to move in any
				direction but to avoid things close to a 45 degree angle because
				we don't have an appropriate animation for that case.
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
		this.frame = 0;
	}

	private updateLocation()
	{
		let actor	= this.actor;

		let x = this.renderOff.x;
		let y = this.renderOff.y;
		let mx = x > 0 ? 1 : -1;
		let my = y > 0 ? 1 : -1;

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

	tick()
	{
		let actor	= this.actor;

		/*
			Overwrite the frame on the actor with our own frame counter so we
			can adjust the animation speed based on the movement speed.
		*/
		let fc = (Math.abs(this.speedX) + Math.abs(this.speedY)) * 1;

		if (fc < 0.01) {
			/* This has effectively stopped */
		}

		this.frame += Math.min(1, fc);
		actor.frame = Math.floor(this.frame);

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

			this.speedX = this.speedY = 0;
		}

		this.speedX = this.speedX * 0.92;
		this.speedY = this.speedY * 0.92;
	}
}

