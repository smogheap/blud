var player		= null;
var actornum	= 0;

function Actor(id, definition, level, area, x, y)
{
	if (!id || !definition) {
		console.log("Could not find definition for actor:" + id);
		return(null);
	}

	if (id === "blud" && player) {
		/* There is only one player */
		return(player);
	}

	this.num		= ++actornum;

	this.id			= id;
	this.level		= level;

	this.ticks		= 0;
	this.frame		= 0;
	this.definition	= definition;

	this.width		= this.definition.width  || TILE_SIZE;
	this.height		= this.definition.height || TILE_SIZE;

	/* Set defaults from the definition */
	this.facing		= this.definition.facing;
	this.x			= x || this.definition.x;
	this.y			= y || this.definition.y;

	this.health		= 100;

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

	this.area		= area || this.definition.area;

	switch (id) {
		case "blud":
			this.player	= true;
			this.level.scrollTo(true, this.x * TILE_SIZE, this.y * TILE_SIZE);
			this.controls = new PlayerControls(this);
			break;

		case "rotavirus":
			this.controls = new RotaVirusControls(this);
			break;
	}

	this.setState(this.STANDING);
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

	state = state || this.state;
	direction = direction || this.facing;

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

/*
	Return the distance between this actor and the one specified in pixels
	taking into account the rendering offset.
*/
Actor.prototype.distance = function distance(actor)
{
	var x1 = (this.x * TILE_SIZE) + this.renderOff.x;
	var y1 = (this.y * TILE_SIZE) + this.renderOff.y;
	var x2 = (actor.x * TILE_SIZE) + actor.renderOff.x;
	var y2 = (actor.y * TILE_SIZE) + actor.renderOff.y;

	// console.log(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
	return(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
};

Actor.prototype.setState = function setState(state, dest)
{
	if (state && (this.state !== state || dest)) {
		this.state = state;
		this.frame = 0;

		if (dest) {
			this.newpos.x = dest.x;
			this.newpos.y = dest.y;
		} else {
			this.newpos.x = this.x;
			this.newpos.y = this.y;
		}
	}
};

Actor.prototype.damage = function damage(ammount)
{
	// TODO Knock back?

	/* Invinsibility frames */
	if (this.ticks - this.lastDamage < 30) {
		return;
	}
	this.lastDamage = this.ticks;

	this.health -= ammount;
	if (this.health < 0) {
		this.health = 0;
	} else if (this.health > 100) {
		this.health = 100;
	}

	if (this.player && this.health <= 0) {
		new Dialog({
			msg:		"You died",
			noinput:	true
		});
	}
};

Actor.prototype.talk = function talk()
{
	// TODO Add actual logic to control what the actor can say
	if (!this.definition.dialog) {
		return;
	}

	var def	= this.getDefinition(this.STANDING, "S");
	var msg = this.definition.dialog[this.frame % this.definition.dialog.length];
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

Actor.prototype.canMove = function canMove(direction, mindistance)
{
	var tile;
	var x	= this.x;
	var y	= this.y;
	var ax;
	var ay;

	direction = direction || this.facing;

	switch (direction) {
		case 'N': y--; break;
		case 'E': x++; break;
		case 'S': y++; break;
		case 'W': x--; break;
	}

	for (var a = 0, actor; actor = level.actors[a]; a++) {
		if (actor === this || actor.area !== this.area) {
			continue;
		}

		switch (actor.state) {
			case actor.MOVING:
				ax = actor.newpos.x;
				ay = actor.newpos.y;
				break;

			default:
				ax = actor.x;
				ay = actor.y;
				break;
		}

		if (ax === x && ay === y) {
			/*
				Regardless of mindistance you can never take the exact same
				spot that another actor is moving to.
			*/
			return(false);
		}

		if (isNaN(mindistance)) {
			if (actor.x === x && actor.y === y) {
				return(false);
			}
		} else {
			if (actor.distance(this) < mindistance) {
				return(false);
			}
		}
	}

	tile = this.level.tileAt(x, y);
	if (!tile || !this.level.tiles[tile]) {
		return(false);
	}

	return(!this.level.tiles[tile].solid);
}

Actor.prototype.tick = function tick()
{
	/* this.frames resets when the state changes, this.ticks does not */
	this.ticks++;
	this.frame++;

	if (this.controls && this.controls.tick) {
		this.controls.tick();
	}

	/* Grab the definition for this character's current action and direction */
	var def			= this.getDefinition(this.state, this.facing);


	switch (this.state) {
		case this.BLINKING:
		case this.STANDING:
			if (0 == (this.ticks % 3)) {
				switch (this.state) {
					case this.STANDING:
						if (0 == (WRand() % 40)) {
							this.setState(this.BLINKING);
						}
						break;

					case this.BLINKING:
						this.setState(this.STANDING);
						break;
				}
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

	this.renderState(ctx, this.state, this.facing, this.frame, x, y);
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

