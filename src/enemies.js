function RotaVirusControls(actor)
{
	this.actor		= actor;

	this.maxSpeed	= 3;
	this.minSpeed	= -1;
	this.accelRate	= 0.05;
	this.decelRate	= 0.05;

	this.speed		= this.minSpeed;
}

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
		} else {
			facing = "N";
		}
	} else if (player.y === actor.y) {
		if (player.x > actor.x) {
			facing = "E";
		} else {
			facing = "W";
		}
	} else {
		found = false;
	}

	if (actor.state !== actor.MOVING) {
		this.speed = this.minSpeed;
		actor.facing = facing;
	}

	var movingto = actor.lookingAt();
	if (found && actor.canMove(actor.facing, TILE_SIZE * 0.75)) {
		actor.setState(actor.MOVING, movingto);

		if (this.speed < this.maxSpeed) {
			this.speed += this.accelRate;
		} else {
			this.speed = this.maxSpeed;
		}

	} else {
		if (this.speed > 0) {
			this.speed -= this.decelRate;
		}

		if (this.speed <= 0) {
			this.speed = this.minSpeed;
			actor.setState(actor.STANDING);
		}
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

		if (x !== 0) {
			actor.renderOff.x += Math.floor(x * this.speed);
		} else {
			actor.renderOff.x = 0;
		}
		if (y !== 0) {
			actor.renderOff.y += Math.floor(y * this.speed);
		} else {
			actor.renderOff.y  = 0;
		}

		if (Math.abs(actor.renderOff.x) >= (TILE_SIZE * 0.5) ||
			Math.abs(actor.renderOff.y) >= (TILE_SIZE * 0.5)
		) {
			if (actor.canMove(actor.facing, TILE_SIZE * 0.75)) {
				actor.x = movingto.x;
				actor.y = movingto.y;

				actor.renderOff.x -= x * TILE_SIZE;
				actor.renderOff.y -= y * TILE_SIZE;
			} else {
				if (found) {
					actor.setState(actor.STUCK);
				} else {
					actor.setState(actor.STANDING);
				}

				this.speed = this.minSpeed;
			}
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
			if (actor.distance(actors[a]) < (TILE_SIZE)) {
				actors[a].damage(5);
			}
		}
	}
};


