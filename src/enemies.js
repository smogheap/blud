function RotaVirusControls(actor)
{
	this.actor			= actor;
	this._direction		= { N: 0, E: 0, S: 0, W: 0 };
}

RotaVirusControls.prototype.getDirection = function getDirection(clear)
{
	this._direction.N = 0;
	this._direction.E = 0;
	this._direction.S = 0;
	this._direction.W = 0;

	/*
		This simple enemy has very basic logic. If it is lined up either
		vertically or horizontally with the player then it will attempt to move
		towards them.
	*/

	if (player) {
		if (player.area === this.actor.area) {
			if (player.x === this.actor.x) {
				if (player.y > this.actor.y) {
					this._direction.S = input.HELD;
				} else {
					this._direction.N = input.HELD;
				}

				if (Math.abs(player.y - this.actor.y) <= 1) {
					player.damage(5);
				}
			} else if (player.y === this.actor.y) {
				if (player.x > this.actor.x) {
					this._direction.E = input.HELD;
				} else {
					this._direction.W = input.HELD;
				}

				if (Math.abs(player.x - this.actor.x) <= 1) {
					player.damage(5);
				}
			}
		}
	}

	return(this._direction);
};


