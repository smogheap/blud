function RotaVirusControls(actor)
{
	this.actor		= actor;

	this.maxSpeed	= 3;
	this.minSpeed	= -1;
	this.accelRate	= 0.05;
	this.decelRate	= 0.05;

	this.speed		= this.minSpeed;
}

RotaVirusControls.prototype.isActive = function isActive(state)
{
	switch (state || this.actor.state) {
		case this.actor.MOVING:
		case this.actor.STUCK:
			return(true);

		default:
			return(false);
	}
};

RotaVirusControls.prototype.accel = function accel()
{
	this.speed += this.accelRate;
	if (this.speed > this.maxSpeed) {
		this.speed = this.maxSpeed;
	}
};

RotaVirusControls.prototype.decel = function decel()
{
	this.speed -= this.decelRate;
	if (this.speed <= 0) {
		this.speed = this.minSpeed;
		this.actor.setState(this.actor.STANDING);
	}
};

RotaVirusControls.prototype.tick = function tick()
{
	/*
		This simple enemy has very basic logic. If it is lined up either
		vertically or horizontally with the player then it will attempt to move
		towards them.
	*/
	var actor	= this.actor;
	var found	= true;

	if (!player || player.area !== actor.area) {
		return;
	}

	var facing = actor.facing;
	if (player.x === actor.x) {
		if (player.y > actor.y) {
			facing = "S";
		} else if (player.y < actor.y) {
			facing = "N";
		}
	} else if (player.y === actor.y) {
		if (player.x > actor.x) {
			facing = "E";
		} else if (player.x < actor.x) {
			facing = "W";
		}
	} else {
		found = false;
	}

	if (actor.state !== actor.MOVING) {
if (actor.facing !== facing) {
	console.log('Turning to', facing);
}
		actor.facing = facing;
	}

	if (found && facing === actor.facing) {
		if (actor.canMove(actor.facing, TILE_SIZE * 0.75)) {
			actor.setState(actor.MOVING, actor.lookingAt());
		} else {
			actor.setState(actor.MOVING);
		}

		this.accel();
	} else {
		this.decel();
	}

	if (this.speed > 0 && actor.state === actor.MOVING) {
		var x = 0;
		var y = 0;

		switch (actor.facing) {
			case 'N': y--; break;
			case 'E': x++; break;
			case 'S': y++; break;
			case 'W': x--; break;
		}

		var rx = x ? actor.renderOff.x + Math.floor(x * this.speed) : 0;
		var ry = y ? actor.renderOff.y + Math.floor(y * this.speed) : 0;

		if (Math.abs(rx) >= (TILE_SIZE * 0.5) ||
			Math.abs(ry) >= (TILE_SIZE * 0.5)
		) {
			/* The character has moved far enough to reach another square */
			if (actor.canMove(actor.facing, TILE_SIZE * 0.5)) {
				actor.x = actor.newpos.x;
				actor.y = actor.newpos.y;

				actor.renderOff.x = rx - (x * TILE_SIZE);
				actor.renderOff.y = ry - (y * TILE_SIZE);

				if (actor.canMove(actor.facing, TILE_SIZE * 0.5)) {
					actor.setState(actor.MOVING, actor.lookingAt());
				} else {
					actor.setState(actor.STANDING);
				}
			} else {
				/*
					Simply skip moving the character this turn because something
					was in the way.
				*/
				;
			}
		} else {
			actor.renderOff.x = rx;
			actor.renderOff.y = ry;
		}
	}

	if (actor.state !== actor.MOVING) {
		if (actor.renderOff.x > 0) {
			actor.renderOff.x--;
		}
		if (actor.renderOff.x < 0) {
			actor.renderOff.x++;
		}
		if (actor.renderOff.y > 0) {
			actor.renderOff.y--;
		}
		if (actor.renderOff.y < 0) {
			actor.renderOff.y++;
		}
	}

	if (actor.state === actor.MOVING && (
		Math.abs(actor.renderOff.x) > 2 ||
		Math.abs(actor.renderOff.y) > 2
	)) {
		var a;

		for (a = 0; actors[a]; a++) {
			if (actors[a] === actor) {
				continue;
			}
			if (actor.distance(actors[a]) < (TILE_SIZE)) {
				actors[a].damage(5);
				this.speed = 0;
			}
		}
	}
};


