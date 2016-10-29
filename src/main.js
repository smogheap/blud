var Input;
var TILE_SIZE		= 16;

function loadImage(src)
{
	var img = new Image();

	img.mozImageSmoothingEnabled		= false;
	img.webkitImageSmoothingEnabled		= false;
	img.msImageSmoothingEnabled			= false;
	img.imageSmoothingEnabled			= false;

	img.src = src;

	return(img);
}

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

function tick(ticks)
{
	if (world.viewport.offset.x !== 0) {
		world.viewport.offset.x += (world.viewport.offset.x > 0) ? -2 : 2;
	}
	if (world.viewport.offset.y !== 0) {
		world.viewport.offset.y += (world.viewport.offset.y > 0) ? -2 : 2;
	}

	for (var c = 0, character; character = world.characters[c]; c++) {
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

		var off		= 0;
		var offx	= 0;
		var offy	= 0;
		var action;

		if (character.animation) {
			/* Continue the previous animation */
			action = character.animation.name;
			off = character.animation.frame * TILE_SIZE;

			character.animation.frame++;

			offx = (character.animation.dx * 2 * character.animation.frame);
			offy = (character.animation.dy * 2 * character.animation.frame);
		} else {
			/* Get the current state of the various input devices */
			var dirs = Input.getDirection();

			action = 'standing';

			/*
				If multiple directions are being pressed then prefer the one
				that was not animated last.
			*/
			if (dirs[Input.N] && canMove(character, 0, -1)) {
				action = 'north';
				character.animation = { name: action, frame: 0, dx: 0, dy: -1 };
			}

			if (dirs[Input.S] && canMove(character, 0, 1) &&
				(!character.animation || action === character.action)
			) {
				action = 'south';
				character.animation = { name: action, frame: 0, dx: 0, dy: 1 };
			}

			if (dirs[Input.W] && canMove(character, -1, 0) &&
				(!character.animation || action === character.action)
			) {
				action = 'west';
				character.animation = { name: action, frame: 0, dx: -1, dy: 0 };
			}

			if (dirs[Input.E] && canMove(character, 1, 0) &&
				(!character.animation || action === character.action)
			) {
				action = 'east';
				character.animation = { name: action, frame: 0, dx: 1, dy: 0 };
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
			}
		}

		character.action = action;
		character.off = off;
		character.pos = [
			(TILE_SIZE * world.scale * (character.x - world.viewport.x)) + (offx * world.scale),
			(TILE_SIZE * world.scale * (character.y - world.viewport.y)) + (offy * world.scale)
		];

		if (character.animation && character.animation.frame >= 8) {
			/* The animation is complete */
			character.x += character.animation.dx;
			character.y += character.animation.dy;

			delete character.animation;
		}
	}
}

function render(ctx)
{
	if (!world.images) {
		world.images = {};
	}

	var wx = world.viewport.offset.x * world.scale;
	var wy = world.viewport.offset.y * world.scale;

	/*
		Render each row from the top down, so a row closer to the player can
		draw over the row behind it.
	*/
	for (var y = -1; y <= world.viewport.height; y++) {
		var row = world.rows[y + world.viewport.y];

		if (!row) {
			continue;
		}

		for (var x = -1; x <= world.viewport.width; x++) {
			var tile = row.charAt(x + world.viewport.x);

			WRand.setSeed(((y + world.viewport.y) * 100) + x + world.viewport.x);

			if (!tile || 1 !== tile.length) {
				continue;
			}

			if (!world.images[tile]) {
				world.images[tile] = loadImage(world.tiles[tile].src);
			}

			var img		= world.images[tile];
			var vars	= (img.width / TILE_SIZE);
			var off		= (WRand() % vars) * TILE_SIZE;

			// TODO Detect edges and pick the appropriate alternate based
			//		on the edges

			ctx.drawImage(world.images[tile],
					off, 0, TILE_SIZE, TILE_SIZE,
					(TILE_SIZE * world.scale * x) + wx,
					(TILE_SIZE * world.scale * y) + wy,
					TILE_SIZE * world.scale, TILE_SIZE * world.scale);

			// TODO Draw any items that are on this spot
		}

		for (var c = 0, character; character = world.characters[c]; c++) {
			if (!character.images) {
				character.images = {};
			}

			if (character.ry !== y + world.viewport.y) {
				continue;
			}

			if (!character.images[character.action]) {
				character.images[character.action] = loadImage('images/' + character.name + '-' + character.action + '.png');
			}

			ctx.drawImage(character.images[character.action],
				character.off, 0, TILE_SIZE, TILE_SIZE,
				character.pos[0] + wx, character.pos[1] + wy,
				TILE_SIZE * world.scale, TILE_SIZE * world.scale);
		}
	}
}

/*
	Take the position of an actual point on screen and convert them to a
	position in game.
*/
function pointToWorldCoords(point)
{
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

window.addEventListener('load', function()
{
	var canvas		= document.createElement('canvas');
	var ctx			= canvas.getContext('2d');

	document.body.appendChild(canvas);

	Input = new InputHandler(canvas, pointToWorldCoords, getPlayerPosition);

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

			w = world.scale * TILE_SIZE * world.viewport.width;
			h = world.scale * TILE_SIZE * world.viewport.height;
			// console.log(world.scale, w, h, window.innerWidth, window.innerHeight);

			canvas.setAttribute('width',  w);
			canvas.setAttribute('height', h);

			/* Restore the initial saved state, and save it again */
			ctx.restore();
			ctx.save();

			ctx.mozImageSmoothingEnabled		= false;
			ctx.webkitImageSmoothingEnabled		= false;
			ctx.msImageSmoothingEnabled			= false;
			ctx.imageSmoothingEnabled			= false;

			/* Store the current actual size so we can detect when it changes */
			w = window.innerWidth;
			h = window.innerHeight;
		}
	};

	ctx.save();

	var ticksPerSec	= 30;
	var tickWait	= Math.floor(1000 / ticksPerSec);
	var lastFrame	= 0;
	var frametime	= 0;

	var doAnimationFrame = function doAnimationFrame(time)
	{
		var ticks = 0;

		requestAnimationFrame(doAnimationFrame);

		/*
			Poll input devices (mainly gamepads) as frequently as possible
			regardless of the tick rate.
		*/
		Input.poll();

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
			// console.log('tick');
			tick(ticks++);
			frametime -= tickWait;
			// frametime /= 1.5;
		}

		resizeCanvas();

		/* Clear the canvas */
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		// console.log('render');
		render(ctx);
		ctx.restore();
	};
	requestAnimationFrame(doAnimationFrame);
});


