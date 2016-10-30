var input;
var dialog			= null;
var TILE_SIZE		= 16;

/*
	This will be true for the first frame only, and can be used for debug
	purposes to avoid printing debug messages at 60fps.
*/
var firstframe		= true;

function canMove(character, x, y)
{
	var tile;

	x += character.x;
	y += character.y;

	try {
		tile = world.rows[y].charAt(x);
		if (!tile || 1 !== tile.length) {
			return(false);
		}
	} catch (e) {
		return(false);
	}

	return(!world.tiles[tile].solid);
}

function startMove(character, direction, x, y, animationOffset)
{
	var		stuck	= false;

	if (!canMove(character, x, y)) {
		/*
			The character isn't allowed to move in this direction, most likely
			because there is a solid object there.

			The character may be allowed to turn in that direction though.
		*/
		if (!character.animation) {
			stuck = true;
		} else {
			return(null);
		}
	}

	if (character.animation) {
		/*
			The character has already started moving in another direction, so
			don't start moving in this direction unless the previous movement
			for the character was in this direction.

			Give a preference to any direction other than the one moved in last
			to allow for a zig-zag when 2 directions are held, and to allow
			sliding against walls by holding 2 directions.
		*/
		if (direction !== character.direction) {
			return(null);
		}
	}

	character.animation = {
		frame:			0,
		dx:				stuck ? 0 : x,
		dy:				stuck ? 0 : y
	};

	if (character.direction !== direction && character.animation &&
		!character.wasMoving
	) {
		/*
			Give a moment to cancel movement while turning from a stand
			still. If the character is already moving then keep the
			momentum going.
		*/
		character.animation.frame -= 4;
	}

	character.direction		= direction;
	character.actionOffset	= animationOffset;

	return(character.animation);
}

function tick(ticks)
{
	if (world.viewport.offset.x !== 0) {
		world.viewport.offset.x += (world.viewport.offset.x > 0) ? -2 : 2;
	}
	if (world.viewport.offset.y !== 0) {
		world.viewport.offset.y += (world.viewport.offset.y > 0) ? -2 : 2;
	}

	for (var c = 0, character; character = world.characters[c]; c++) {
		/* Has the previous animation ended for this character? */
		if (character.animation && character.animation.frame >= 8) {
			/* The animation is complete */
			character.x += character.animation.dx;
			character.y += character.animation.dy;

			delete character.animation;
			character.wasMoving = true;
		} else {
			character.wasMoving = false;
		}

		/*
			Determine the row offset to use when rendering this character.

			If the character is moving from one row to another then it needs to
			render with the row it is moving towards if that row is lower on
			screen than the row it is actually still in.
		*/
		if (character.animation && character.animation.dy > 0) {
			character.ry = character.y + 1;
		} else {
			character.ry = character.y;
		}

		var offset	= 0;
		var offx	= 0;
		var offy	= 0;

		if (character.animation) {
			/* Continue the previous animation */
			var dirs = input.getDirection(false); /* Don't clear pressed state */

			if (!isNaN(character.direction) &&
				character.animation.frame < 0 &&
				!(dirs[character.direction] & input.HELD)
			) {
				/* Cancel the movement */
				delete character.animation;
			} else {
				var f = character.animation.frame;

				if (f < 0) {
					/* Negative frame is used to add a delay for turning */
					f = 0;
				}

				offset = f * TILE_SIZE;
				character.animation.frame++; f++;

				offx = (character.animation.dx * 2 * f);
				offy = (character.animation.dy * 2 * f);
			}
		}

		if (!character.animation) {
			/* Get the current state of the various input devices */
			var dirs	= input.getDirection(true);
			var dir		= undefined;

			/*
				If multiple directions are being pressed then prefer the one
				that was not animated last.
			*/
			if (dirs[input.N]) {
				startMove(character, input.N,  0, -1, 48);
			}
			if (dirs[input.E]) {
				startMove(character, input.E,  1,  0, 0);
			}
			if (dirs[input.S]) {
				startMove(character, input.S,  0,  1, 16);
			}
			if (dirs[input.W]) {
				startMove(character, input.S, -1,  0, 32);
			}

			/* Do we need to scroll the viewport?  */
			if (character.animation) {
				var vx = character.x - world.viewport.x + character.animation.dx;
				var vy = character.y - world.viewport.y + character.animation.dy;

				if (vx < 5 && world.viewport.x > 0) {
					world.viewport.x--;
					world.viewport.offset.x = -TILE_SIZE;
				}
				if ((world.viewport.width - vx) < 5 &&
					world.viewport.x <= world.rows[0].length - world.viewport.width
				) {
					world.viewport.x++;
					world.viewport.offset.x = TILE_SIZE;
				}


				if (vy < 5 && world.viewport.y > 0) {
					world.viewport.y--;
					world.viewport.offset.y = -TILE_SIZE;
				}
				if ((world.viewport.height - vy) < 5 &&
					world.viewport.y <= world.rows.length - world.viewport.height
				) {
					world.viewport.y++;
					world.viewport.offset.y = TILE_SIZE;
				}
			} else {
				// TODO Occasionally change offset to 1...
				offset = 0;
			}
		}

		character.offset = offset;
		character.pos = [
			(TILE_SIZE * (character.x - world.viewport.x)) + offx,
			(TILE_SIZE * (character.y - world.viewport.y)) + offy
		];
	}
}

function tileAt(x, y, deftile)
{
	var tile;
	var row;

	x += world.viewport.x;
	y += world.viewport.y;

	if (!(row = world.rows[y])) {
		return(deftile);
	}

	if (!(tile = row.charAt(x)) || 1 !== tile.length) {
		return(deftile);
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
	for (var y = -1; y <= world.viewport.height; y++) {
		for (var x = -1; x <= world.viewport.width; x++) {
			var tile = tileAt(x, y, null);

			if (!tile || 1 !== tile.length) {
				continue;
			}

			WRand.setSeed(((y + world.viewport.y) * 100) * (x + world.viewport.x));

			if (!world.images[tile]) {
				world.images[tile] = loadImage(world.tiles[tile].src);
			}

			var img		= world.images[tile];
			var offsets	= null;
			var options	= null;

			if (world.tiles[tile].edges) {
				/*
					Pick an appropriate portion of the tile depending on what
					the tiles surrounding this one are.
				*/
				var key = "";
				var edges =	[	tileAt(x, y - 1, tile), tileAt(x + 1, y, tile),
								tileAt(x, y + 1, tile), tileAt(x - 1, y, tile) ];

				/*
					Build a string to represent the edges, with 1 meaning there
					is an edge and 0 meaning there is not, in the order NESW.
				*/
				for (var i = 0; i < edges.length; i++) {
					key += (edges[i] !== tile) ? "1" : "0";
				}

				if (!(options = world.tiles[tile].edges[key])) {
					/* Default to an image used for no edges */
					options = world.tiles[tile].edges["0000"];
				}
			}

			if (options && options.length > 0) {
				/* Pick any one of the available options */
				offsets = options[WRand() % options.length];
			} else {
				/* Pick any tile in the image */
				offsets = [
					WRand() % (img.width  / TILE_SIZE),
					WRand() % (img.height / TILE_SIZE)
				];
			}

			ctx.drawImage(world.images[tile],
					offsets[0] * TILE_SIZE, offsets[1] * TILE_SIZE,
					TILE_SIZE, TILE_SIZE,
					(TILE_SIZE * x) + wx,
					(TILE_SIZE * y) + wy,
					(TILE_SIZE), (TILE_SIZE));

			// TODO Draw any items that are on this spot
		}

		for (var c = 0, character; character = world.characters[c]; c++) {
			if (!character.images) {
				character.images = {};
			}

			if (character.ry !== y + world.viewport.y) {
				continue;
			}

			if (!character.image) {
				character.image = loadImage('images/' + character.name + '.png');
			}

			ctx.drawImage(character.image,
				character.offset + (TILE_SIZE * 2),
				character.actionOffset || 0, TILE_SIZE, TILE_SIZE,
				character.pos[0] + wx, character.pos[1] + wy,
				TILE_SIZE, TILE_SIZE);
		}
	}
}

/*
	Take the position of an actual point on screen and convert them to a
	position in game.
*/
function pointToWorldCoords(point)
{
	// TODO Adjust for the position of the canvas...
	var x = (point[0] / world.scale) - world.viewport.offset.x;
	var y = (point[1] / world.scale) - world.viewport.offset.y;

	x = Math.floor(x / 16);
	y = Math.floor(y / 16);

	x += world.viewport.x;
	y += world.viewport.y;

	return([ x, y ]);
}

/*
	Return the current position of the player's character in the world
*/
function getPlayerPosition()
{
	return([
		world.characters[0].x,
		world.characters[0].y,
	]);
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

	input = new InputHandler(canvas, pointToWorldCoords, getPlayerPosition);

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

	bctx.save();

	var ticksPerSec	= 30; /* animations are 30fps */
	var tickWait	= Math.floor(1000 / ticksPerSec);
	var lastFrame	= 0;
	var frametime	= 0;
	var ticks		= 0;

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


if (!dialog && ticks === 90) {
	console.log('Opening dialog now');

	// Testing
	dialog = new Dialog([
		"Howdy",
		"",
		"This is a simple dialog test. You can press space",
		"to continue. Eventually this will be updated and",
		"will even include options that you can pick from."
	].join('\n'), true, null, function() {
		dialog = new Dialog([
			"Okay, I'll let you get back to the game now."
		].join('\n'), true, null, function() {
			dialog = new Dialog([
				"!!!"
			].join('\n'), true, null, function() {
				dialog = null;
			});

		});

	});
}

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


