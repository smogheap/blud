function VirusControls(actor)
{
	this.actor			= actor;
	this._direction		= { N: 0, E: 0, S: 0, W: 0 };
}

VirusControls.prototype.getDirection = function getDirection(clear)
{
	this._direction.N = 0;
	this._direction.E = 0;
	this._direction.S = 0;
	this._direction.W = 0;

	// TODO Check to see if the player is directly above, below or to the side
	//		of the virus, and if so move in the player's direction rather
	//		quickly.

	var player = null;

	for (var a = 0, actor; actor = actors[a]; a++) {
		if (actor.player) {
			player = actor;
			break;
		}
	}

	if (player) {
		if (player.area === this.actor.area) {
			if (player.x === this.actor.x) {
				if (player.y > this.actor.y) {
					this._direction.S = input.HELD;
				} else {
					this._direction.N = input.HELD;
				}
			}

			if (player.y === this.actor.y) {
				if (player.x > this.actor.x) {
					this._direction.E = input.HELD;
				} else {
					this._direction.W = input.HELD;
				}
			}
		}
	}

	return(this._direction);
};


