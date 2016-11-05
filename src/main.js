var input;
var TILE_SIZE	= 16;
var marginX		= 10;
var marginY		= 6;

var actors		= [];
var player		= null;

/*
	This will be true for the first frame only, and can be used for debug
	purposes to avoid printing debug messages at 60fps.
*/
var firstframe		= true;

function actorAt(x, y)
{
	for (var a = 0, actor; actor = actors[a]; a++) {
		if (x === actor.x && y === actor.y) {
			return(actor);
		}

		var rpos = actor.renderPos();

		if (x === rpos[0] && y === rpos[1]) {
			return(actor);
		}
	}

	return(null);
}

function canMove(actor, direction)
{
	var tile;
	var x	= actor.x;
	var y	= actor.y;

	switch (direction) {
		case 'N': y--; break;
		case 'E': x++; break;
		case 'S': y++; break;
		case 'W': x--; break;
	}

	var a;

	if ((a = actorAt(x, y)) && a !== actor)  {
		return(false);
	}

	tile = tileAt(x, y);

	if (!tile || 1 !== tile.length || !world.tiles[tile]) {
		return(false);
	}

	return(!world.tiles[tile].solid);
}

function scrollViewport(x, y, frames)
{
	var vx = x - world.viewport.x;
	var vy = y - world.viewport.y;

	frames = frames || 1;

	if (vx < marginX && world.viewport.x > 0) {
		world.viewport.x--;
		world.viewport.offset.x = -TILE_SIZE;
	}

	if ((world.viewport.width - vx) < marginX &&
		world.viewport.x < world.width - world.viewport.width
	) {
		world.viewport.x++;
		world.viewport.offset.x = TILE_SIZE;
	}

	if (vy < marginY && world.viewport.y > 0) {
		world.viewport.y--;
		world.viewport.offset.y = -TILE_SIZE;
	}

	if ((world.viewport.height - vy) < marginY &&
		world.viewport.y < world.height - world.viewport.height
	) {
		world.viewport.y++;
		world.viewport.offset.y = TILE_SIZE;
	}

	world.viewport.offset.steps = TILE_SIZE / frames;
}

function findNearbyArea(ox, oy)
{
	var name	= null;

	for (var y = 0; y < world.layout.length; y++) {
		for (var x = 0; x < world.layout[y].length; x++) {
			if (world.layout[y][x] === world.area) {
				if (world.layout[y + oy] &&
					world.layout[y + oy][x + ox]
				) {
					name = world.layout[y + oy][x + ox];
				}
				break;
			}
		}
	}

	return(name);
}

/*
	Determine which area the specified coords are linked to and then switch to
	that area if one is found.

	Keep in mind that world.rows includes a 1 tile border all the way arround
	from the edges of the surrounding areas. Stepping onto that border means the
	player is in the new area.

	The player coords are relative to this area though, not the border, so the
	top left corner is actually -1, -1.
*/
function switchArea(x, y)
{
	var ox = 0;
	var oy = 0;

	if (y < 0) {
		/* Top edge of area */
		oy = -1;
	} else if (y >= world.rows.length - 2) {
		/* Bottom edge of area */
		oy = 1;
	}

	if (x < 0) {
		/* Left edge of area */
		ox = -1;
	} else if (x >= world.rows[0].length - 2) {
		/* Right edge of area */
		ox = 1;
	}

	if (0 === ox && 0 === oy) {
		return;
	}

	var name = findNearbyArea(ox, oy);

	if (!name) {
		return;
	}

	loadArea(name);

	/*
		New player position assumes there is one row or column of identical
		tiles shared by the new area and the old.
	*/
	if (oy < 0) {
		/* Move player to bottom of new area */
		player.y = world.height - 1;

		world.viewport.y = world.height - world.viewport.height;
	} else if (oy > 0) {
		/* Move player to top of new area */
		player.y = 0;
		world.viewport.y = 0;
	}

	if (ox < 0) {
		/* Move player to right edge of new area */
		player.x = world.width - 1;
		world.viewport.x = world.width - world.viewport.width;
	} else if (ox > 0) {
		/* Move player to left edge of new area */
		player.x = 0;
		world.viewport.x = 0;
	}

	if (world.viewport.x < 0) {
		world.viewport.x = 0;
	}
	if (world.viewport.y < 0) {
		world.viewport.y = 0;
	}
	scrollViewport(player.x, player.y);
}

function loadArea(name)
{
	var rows = [];

	var	c = world.areas[name];

	/* Set the name before calling findNearbyArea() */
	world.area		= name;
	world.width		= c[0].length;
	world.height	= c.length;

	var n = world.areas[findNearbyArea( 0, -1)];
	var e = world.areas[findNearbyArea( 1,  0)];
	var s = world.areas[findNearbyArea( 0,  1)];
	var w = world.areas[findNearbyArea(-1,  0)];

	/*
		Build the rows for the current area with a border filled out from the
		surrounding areas.
	*/
	if (n) {
		rows.push("-" + n[n.length - 1] + "-");
	} else {
		rows.push(Array(c[0].length + 3).join("-"));
	}

	for (var y = 0; y < c.length; y++) {
		var row = '';

		if (w) {
			row += w[y].charAt(w[y].length - 1);
		} else {
			row += '-';
		}

		row += c[y];

		if (e) {
			row += e[y].charAt(0);
		} else {
			row += '-';
		}

		rows.push(row);
	}

	if (s) {
		rows.push("-" + s[0] + "-");
	} else {
		rows.push(Array(c[0].length + 3).join("-"));
	}

	world.rows = rows;

	for (var a = 0, actor; actor = actors[a]; a++) {
		if (actor.player || (actor.area && actor.area === name)) {
			actor.visible = true;
		} else {
			actor.visible = false;
		}
	}
}

function tick(ticks)
{
	WRand.setSeed((new Date()).getTime());

	if (world.viewport.offset.x !== 0) {
		world.viewport.offset.x += (world.viewport.offset.x > 0) ? -world.viewport.offset.steps : world.viewport.offset.steps;
	}
	if (world.viewport.offset.y !== 0) {
		world.viewport.offset.y += (world.viewport.offset.y > 0) ? -world.viewport.offset.steps : world.viewport.offset.steps;
	}

	/* Paused? */
	if (input.getButton(input.START, true) & input.PRESSED) {
		new Dialog({
			msg:		"Paused",
			choices:	[ "Continue", "About", "Options", "New Game" ],

			closecb: function(selected) {
				switch (selected) {
					default:
					case 0:
						break;

					case 1:
						new Dialog({
							actor: {
								actor:	player,
								action:	player.MOVING,
								facing:	"E",
								rate:	0.5
							},
							msg: [
								"Blud is a game about a blood",
								"cell who finds himself in",
								"one odd situation after",
								"another.",
								"",
								"Blud was created by Micah",
								"Gorrell and Owen Swerkstrom."
							].join('\n')
						});
						break;

					case 2:
						new Dialog({
							msg:		"Options",
							choices:	[ "Remap Controller", "Cancel" ],

							closecb: function(selected) {
								switch (selected) {
									case 0:
										input.remapjs();
										break;

									default:
									case 1:
										break;
								}
							}
						});
						break;

					case 3: /* New Game */
						var arnold		= new Actor("arnold");

						arnold.state	= "standing";

						new Dialog([
							{ actor: arnold, msg: [
								"Once upon a time there was a little",
								"blood cell named Blud, but everyone",
								"called him Arnold."
							].join('\n')},

							{ actor: arnold, msg: [
								"Arnold was,",
								"   to be blunt,",
								"      a bit of a dick."
							].join('\n')},

							{ actor: arnold, msg: [
								"Luckily this story isn't about Arnold."
							].join('\n')},

							{
								actor: {
									actor:		arnold,
									action:		"dividing",
									delay:		20,
									rate:		0.5
								},
								msg: [
									"One day, Arnold divided, as cells",
									"do and a new cell was born. The new",
									"cell was named Blud as well, but",
									"everyone called them...",
								].join('\n')
							},

							{
								msg: [
									"Umm...",
									"Help me out here...",
									"What did they call them?"
								].join('\n'),
								actor: player,
								kb: true,
								closecb: function(name) {
									if (!name) {
										name = "Sue";
									}
									new Dialog([
										{
											actor: player,
											msg: [
												"The new cell was named Blud and",
												"everyone called them " + name + "."
											].join('\n')
										},

										{
											actor: player,
											msg: [
												"This is a story about " + name + "."
											].join('\n')
										},
									]);
								}
							}
						]);
						break;
				}
			}
		});
	}

	if (input.getButton(input.A, true) & input.PRESSED) {
		var pos		= player.lookingAt();
		var actor	= actorAt(pos[0], pos[1]);

		if (actor) {
			actor.talk();
		}
	}

	for (var a = 0, actor; actor = actors[a]; a++) {
		if (actor.visible) {
			actor.tick();
		}
	}
}

function tileAt(x, y, deftile, ignoreVariants)
{
	var tile;
	var row;

	/*
		world.rows has a border of tiles from the surrounding areas, so the
		coords are off by one.
	*/
	x++;
	y++;

	if (!(row = world.rows[y])) {
		return(deftile);
	}

	if (!(tile = row.charAt(x)) || 1 !== tile.length) {
		return(deftile);
	}

	if (!ignoreVariants && world.tiles[tile].variantOf) {
		tile = world.tiles[tile].variantOf;
	}

	return(tile);
}

function render(ctx)
{
	if (!world.images) {
		world.images = {};
	}

	var wx = world.viewport.offset.x;
	var wy = world.viewport.offset.y;

	/*
		Render each row from the top down, so a row closer to the player can
		draw over the row behind it.
	*/
	for (var y = world.viewport.y - 1; y <= world.viewport.y + world.viewport.height; y++) {
		if (y >= world.height) {
			break;
		}

		for (var x = world.viewport.x - 1; x <= world.viewport.x + world.viewport.width; x++) {
			if (x >= world.width) {
				break;
			}

			var tile	= tileAt(x, y, null, true);
			var vedges	= null;

			if (!tile || 1 !== tile.length) {
				continue;
			}

			/*
				Is this a variant of another tile?

				If so swap it out for that tile, but grab the edges string from
				the variant first.
			*/
			if (world.tiles[tile].variantOf) {
				vedges = world.tiles[tile].edges;
				tile = world.tiles[tile].variantOf;
			}

			WRand.setSeed((y * 100) * x);

			var src = world.tiles[tile].src;

			if (src && !world.images[src]) {
				world.images[src] = loadImage(src);
			}

			var img		= src ? world.images[src] : null;
			var offsets	= null;
			var options	= null;

			if (world.tiles[tile].edges) {
				/*
					Pick an appropriate portion of the tile depending on what
					the tiles surrounding this one are.

					Build a string to represent the edges, in the order:
						N,E,S,W,NW,NE,SW,SE

					Look for edges on the tile with all 8 characters, then 6,
					then 4 since the kitty corner values may not matter in most
					cases.
				*/
				var key = "";
				var edges =	[
					tileAt(x, y - 1, tile),		tileAt(x + 1, y, tile),
					tileAt(x, y + 1, tile),		tileAt(x - 1, y, tile),

					tileAt(x - 1, y - 1, tile),	tileAt(x + 1, y - 1, tile),
					tileAt(x - 1, y + 1, tile),	tileAt(x + 1, y + 1, tile)
				];

				for (var i = 0; i < edges.length; i++) {
					if (vedges && "1" === vedges.charAt(i)) {
						key += "1";
					} else {
						key += (edges[i] !== tile) ? "1" : "0";
					}
				}

				options =	world.tiles[tile].edges[key] ||
							world.tiles[tile].edges[key.slice(0, 6)] ||
							world.tiles[tile].edges[key.slice(0, 4)] ||
							world.tiles[tile].edges["0000"];
			}

			if ((!options || !options.length) && world.tiles[tile].options) {
				options = world.tiles[tile].options;
			}

			if (options && options.length > 0) {
				/* Pick any one of the available options */
				offsets = options[WRand() % options.length];
			} else {
				/* Pick any tile in the image */
				offsets = [
					WRand() % ((img ? img.width  : 0) / TILE_SIZE),
					WRand() % ((img ? img.height : 0) / TILE_SIZE)
				];
			}

			if (world.tiles[tile].baseOffset) {
				offsets = [
					offsets[0] + world.tiles[tile].baseOffset[0],
					offsets[1] + world.tiles[tile].baseOffset[1]
				];
			}

			if (img) {
				ctx.drawImage(img,
						offsets[0] * TILE_SIZE, offsets[1] * TILE_SIZE,
						TILE_SIZE, TILE_SIZE,
						(TILE_SIZE * (x - world.viewport.x)) + wx,
						(TILE_SIZE * (y - world.viewport.y)) + wy,
						(TILE_SIZE), (TILE_SIZE));
			}

			// TODO Draw any items that are on this spot
		}

		for (var a = 0, actor; actor = actors[a]; a++) {
			if (!actor.visible) {
				continue;
			}

			var pos = actor.renderPos();

			if (pos.length === 2 && y === pos[1]) {
				actor.render(ctx, wx, wy);
			}
		}
	}
}

function debug(msg)
{
	var		div;

	if (!(div = document.getElementById('debug'))) {
		div = document.createElement('div');

		div.id = 'debug';
		document.body.appendChild(div);
	}

	div.innerText = msg;
}

window.addEventListener('load', function()
{
	var canvas		= document.createElement('canvas');
	var ctx			= canvas.getContext('2d');
	var buffer		= document.createElement('canvas');
	var bctx		= buffer.getContext('2d');

	document.body.appendChild(canvas);

	input = new InputHandler(canvas);

	world.scale = 1;

	var w = 0;
	var h = 0;
	var resizeCanvas = function()
	{
		if (w != window.innerWidth || h != window.innerHeight) {
			w = window.innerWidth;
			h = window.innerHeight;

			for (var i = 1; ; i++) {
				if ((i * TILE_SIZE * world.viewport.minwidth  <= w) &&
					(i * TILE_SIZE * world.viewport.minheight <= h)
				) {
					world.scale = i;
				} else {
					break;
				}
			}
			world.viewport.width	= Math.floor(w / (world.scale * TILE_SIZE)) + 1;
			world.viewport.height	= Math.floor(h / (world.scale * TILE_SIZE)) + 1;

			world.viewport.width	= Math.min(world.viewport.width, world.viewport.maxwidth);
			world.viewport.height	= Math.min(world.viewport.height, world.viewport.maxheight);

			console.log("Using viewport size:", world.viewport.width, world.viewport.height);

			w = Math.min(world.scale * TILE_SIZE * world.viewport.width,  window.innerWidth);
			h = Math.min(world.scale * TILE_SIZE * world.viewport.height, window.innerHeight);;
			// console.log(world.scale, w, h, window.innerWidth, window.innerHeight);

			canvas.setAttribute('width',  w);
			canvas.setAttribute('height', h);

			buffer.setAttribute('width',  world.viewport.width  * TILE_SIZE);
			buffer.setAttribute('height', world.viewport.height * TILE_SIZE);

			/* Restore the initial saved state, and save it again */
			ctx.restore();
			ctx.save();
			bctx.restore();
			bctx.save();

			disableSmoothing(ctx);
			disableSmoothing(bctx);

			/* Store the current actual size so we can detect when it changes */
			w = window.innerWidth;
			h = window.innerHeight;
		}
	};

	/* Load the actors; Only the first gets input */
	actors.push((player = new Actor("blud", input)));
	actors.push(new Actor("abby"));
	actors.push(new Actor("saul"));

	bctx.save();

	var ticksPerSec	= 30; /* animations are 30fps */
	var tickWait	= Math.floor(1000 / ticksPerSec);
	var lastFrame	= 0;
	var frametime	= 0;
	var ticks		= 0;

	/* Load the town center */
	loadArea("towncenter");

	var doAnimationFrame = function doAnimationFrame(time)
	{
		requestAnimationFrame(doAnimationFrame);

		/*
			Poll input devices (mainly gamepads) as frequently as possible
			regardless of the tick rate.
		*/
		input.poll();

		if (time - lastFrame < TILE_SIZE) {  /* 60fps max */
			return;
		}

		if (frametime) {
			frametime += time - lastFrame;
		} else {
			frametime = time - lastFrame;
		}
		lastFrame = time;

		while (frametime >= tickWait) {
			if (dialog && !dialog.closed) {
				dialog.tick(ticks);
			} else {
				tick(ticks);
			}
			ticks++;
			frametime -= tickWait;
			// frametime /= 1.5;
		}

		resizeCanvas();

		/* Clear the canvas */
		bctx.clearRect(0, 0, buffer.width, buffer.height);

		bctx.save();
		render(bctx);

		if (dialog && !dialog.closed) {
			dialog.render(bctx);
		}
		firstframe = false;
		bctx.restore();

		/* Draw (and scale) the image to the main canvas now */
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(buffer,
				0, 0, buffer.width, buffer.height,
				0, 0, buffer.width * world.scale, buffer.height * world.scale);
	};
	requestAnimationFrame(doAnimationFrame);
});


