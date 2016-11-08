function RotaVirusControls(actor)
{
	this.actor	= actor;
	this.speed	= -2;
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

	if (player.x === actor.x) {
		if (player.y > actor.y) {
			actor.facing = "S";
		} else {
			actor.facing = "N";
		}
	} else if (player.y === actor.y) {
		if (player.x > actor.x) {
			actor.facing = "E";
		} else {
			actor.facing = "W";
		}
	} else {
		found = false;
	}

	if (actor.state !== actor.MOVING) {
		this.speed = -2;
	}

	if (found) {
		actor.setState(actor.MOVING, actor.lookingAt());

		if (this.speed < 4) {
			this.speed += 0.10;
		} else {
			this.speed = 4;
		}

	} else {
		if (this.speed > 0) {
			this.speed -= 0.15;
		}

		if (this.speed <= 0) {
			this.speed = -2;
			actor.setState(actor.STANDING);
		}
	}

	var movingto = actor.lookingAt();

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

		if (Math.abs(actor.renderOff.x) >= (TILE_SIZE * 0.75) ||
			Math.abs(actor.renderOff.y) >= (TILE_SIZE * 0.75)
		) {
			if (actor.canMove()) {
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

				this.speed = -2;
			}
		}
	}

	if (actor.state !== actor.MOVING) {
		if (actor.renderOff.x > 0) {
			actor.renderOff.x--;
		}
		if (actor.renderOff.x < 0) {
			actor.renderOff.x++
		}
		if (actor.renderOff.y > 0) {
			actor.renderOff.y--;
		}
		if (actor.renderOff.y < 0) {
			actor.renderOff.y++
		}
	}

	if (actor.state === actor.MOVING && (
		Math.abs(actor.renderOff.x) > (TILE_SIZE / 2) ||
		Math.abs(actor.renderOff.y) > (TILE_SIZE / 2)
	)) {
		var a;

		if ((a = actorAt(movingto.x, movingto.y))) {
			a.damage(5);
		}
	}
};


