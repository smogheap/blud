let player		= null;
let actornum	= 0;

class Actor
{

// TODO Turn these into an enum and use numbers instead of strings so we can
//		have the state be defined as the actor state type.
readonly STANDING				= "standing";
readonly BLINKING				= "blinking";
readonly STUCK					= "stuck";
readonly TURNING				= "turning";
readonly MOVING					= "moving";
readonly TALKING				= "talking";
readonly DEAD					= "dead";

readonly id:			string;
readonly player:		boolean	= false;
name:					string;

state:					string;
children:				Actor[];

readonly controls:		Controls;

level:					any;
readonly definition:	any;
area:					string;

private num:			number;
private ticks:			number;
frame:					number;

readonly width:			number;
readonly height:		number;

health:					number;
private lastDamage:		number;
x:						number;
y:						number;
facing:					string;

renderOff:				coord;
newpos:					coord;
private _lookingAt:		coord;

// TODO Set the right type for level
constructor(id: string, definition: any, level: any, area?: string, x?: number, y?: number)
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

	this.setState(this.STANDING);
	switch (id) {
		case "blud":
			this.player	= true;
			this.name = "Sue"; /* Default name for the player */

			this.level.scrollTo(true, this.x * TILE_SIZE, this.y * TILE_SIZE);
			this.controls = new PlayerControls(this);
			break;

		case "eyeball":
			this.controls = new EyeballControls(this);
			break;

		case "rotavirus":
			this.controls = new RotaVirusControls(this);
			break;
	}

	this.children	= [];
}

getDefinition(state?: string, direction?: string)
{
	let def = null;

	state		= state		|| this.state;
	direction	= direction	|| this.facing;

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
}

isAt(x, y)
{
	if (x === this.x && y === this.y) {
		return(true);
	}

	if (x === this.newpos.x && y === this.newpos.y) {
		return(true);
	}

	return(false);
}

/*
	Return the distance between this actor and the one specified in pixels
	taking into account the rendering offset.
*/
distance(actor: Actor)
{
	let x1 = (this.x  * TILE_SIZE) + this.renderOff.x;
	let y1 = (this.y  * TILE_SIZE) + this.renderOff.y;
	let x2 = (actor.x * TILE_SIZE) + actor.renderOff.x;
	let y2 = (actor.y * TILE_SIZE) + actor.renderOff.y;

	// console.log(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
	return(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}

setState(state: string, dest?: coord)
{
	if (state && this.state !== state) {
		this.state = state;
		this.frame = 0;
	}

	if (dest) {
		this.newpos.x = dest.x;
		this.newpos.y = dest.y;
	} else {
		this.newpos.x = this.x;
		this.newpos.y = this.y;
	}
}

// TODO Add a direction arg
// TODO Knock back?
damage(ammount: number)
{
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

	if (this.health <= 0) {
		this.setState(this.DEAD);

		if (this.player) {
			this.children = [
				new Actor("eyeball", this.level.def.items["eyeball"], this.level, this.area, this.x, this.y),
				new Actor("eyeball", this.level.def.items["eyeball"], this.level, this.area, this.x, this.y)
			];

			this.children[0].renderOff.x -= 4;
			this.children[1].renderOff.x += 4;

			setTimeout(function() {
				MenuAction("respawn");
			}.bind(this), 3000);
		}
	}
}

talk()
{
	// TODO Add actual logic to control what the actor can say
	if (!this.definition.dialog) {
		return;
	}

	let def	= this.getDefinition(this.STANDING, "S");
	let msg = this.definition.dialog[this.frame % this.definition.dialog.length];
	let src = def.src || this.definition.src;
	let img;

	if (!(img = this.level.images[src])) {
		img = this.level.images[src] = loadImage(src);
	}

	Ask({
		actor:		this,
		msg:		msg,
		spoken:		true
	});
}

canMove(direction?:string, mindistance?:number)
{
	let tile;
	let x	= this.x;
	let y	= this.y;
	let ax;
	let ay;

	if (editor) {
		/* Allow moving anywhere when in editor mode */
		return(true);
	}

	direction = direction || this.facing;

	switch (direction) {
		case 'N': y--; break;
		case 'E': x++; break;
		case 'S': y++; break;
		case 'W': x--; break;
	}

	for (let a = 0, actor; actor = level.actors[a]; a++) {
		if (actor === this || actor.area !== this.area || actor.state === actor.DEAD) {
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

tick()
{
	/* this.frames resets when the state changes, this.ticks does not */
	this.ticks++;
	this.frame++;

	if (this.controls && this.controls.tick) {
		this.controls.tick();
	}

	/* Grab the definition for this character's current action and direction */
	let def = this.getDefinition(this.state, this.facing);


	switch (this.state) {
		case this.BLINKING:
		case this.STANDING:
			if (0 === (this.ticks % 3)) {
				switch (this.state) {
					case this.STANDING:
						if (0 === (WRand() % 40)) {
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

	for (let c = 0, child; child = this.children[c]; c++) {
		child.tick();
	}
}

/* Return true if this actor should be rendered on the specified row */
renderRow(y: number)
{
	if ('S' === this.facing && this.MOVING === this.state) {
		return(y === this.y + 1);
	} else {
		return(y === this.y);
	}
};

lookingAt(): coord
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

render(ctx: CanvasRenderingContext2D, wx, wy)
{
	/* Which tile (relative to the viewport) is the actor on */
	let x		= (this.x * TILE_SIZE) - wx;
	let y		= (this.y * TILE_SIZE) - wy;

	/* Add the offset if the character is moving between tiles */
	x += this.renderOff.x;
	y += this.renderOff.y;

	this.renderState(ctx, this.state, this.facing, this.frame, x, y);

	for (let c = 0, child; child = this.children[c]; c++) {
		child.render(ctx, wx, wy);
	}
};

renderState(ctx: CanvasRenderingContext2D, state: string, facing: string, ticks: number, x: number, y: number)
{
	/* Grab the definition for this character's current action and direction */
	let def	= this.getDefinition(state, facing);
	let src = def.src || this.definition.src;
	let img;

	if (!src) {
		return;
	}

	if (!(img = this.level.images[src])) {
		img = this.level.images[src] = loadImage(src);
	}

	/* How many frames are there for this state? */
	let frames	= 1;
	let rate	= 1;
	let frame;

	if (def && !isNaN(def.frames)) {
		frames = def.frames;
	}
	if (def && !isNaN(def.rate)) {
		rate = def.rate;
	}

	/* Determine which frame to use */
	let sx = def.x;
	let sy = def.y;

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
}

} /* End of Actor class */

