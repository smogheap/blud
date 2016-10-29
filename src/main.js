var buttons = {};

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

function tick()
{
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
			off = character.animation.frame * 16;

			character.animation.frame++;

			offx = (character.animation.dx * 2 * character.animation.frame);
			offy = (character.animation.dy * 2 * character.animation.frame);
		} else {
			if (buttons.up) {
				action = 'north';
				character.animation = { name: action, frame: 0, dx: 0, dy: -1 };
			} else if (buttons.down) {
				action = 'south';
				character.animation = { name: action, frame: 0, dx: 0, dy: 1 };
			} else if (buttons.left) {
				action = 'west';
				character.animation = { name: action, frame: 0, dx: -1, dy: 0 };
			} else if (buttons.right) {
				action = 'east';
				character.animation = { name: action, frame: 0, dx: 1, dy: 0 };
			} else {
				action = 'standing';
			}
		}

		character.action = action;
		character.off = off;
		character.pos = [
			(16 * world.scale * character.x) + (offx * world.scale),
			(16 * world.scale * character.y) + (offy * world.scale)
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

	/* We need the same seed for every frame so the same tiles are used */
	WRand.setSeed(12345);

	/*
		Render each row from the top down, so a row closer to the player can
		draw over the row behind it.
	*/
	for (var y = 0, row; (row = world.rows[y]) && y < world.viewport.height; y++) {
		for (var x = 0, tile; (tile = row.charAt(x)) && 1 == tile.length && x < world.viewport.width; x++) {
			if (tile === ' ') {
				tile = 'x';
			}

			if (!world.images[tile]) {
				world.images[tile] = loadImage('images/' + tile + '.png');
			}

			var img		= world.images[tile];
			var vars	= (img.width / 16);
			var off		= (WRand() % vars) * 16;

			// TODO Detect edges and pick the appropriate alternate based
			//		on the edges

			ctx.drawImage(world.images[tile],
					off, 0, 16, 16,
					16 * world.scale * x,
					16 * world.scale * y,
					16 * world.scale, 16 * world.scale);

			// TODO Draw any items that are on this spot
		}

		for (var c = 0, character; character = world.characters[c]; c++) {
			if (!character.images) {
				character.images = {};
			}

			if (character.ry !== y) {
				continue;
			}

			if (!character.images[character.action]) {
				character.images[character.action] = loadImage('images/' + character.name + '-' + character.action + '.png');
			}

			ctx.drawImage(character.images[character.action],
				character.off, 0, 16, 16,
				character.pos[0], character.pos[1],
				16 * world.scale, 16 * world.scale);

			if (character.animation && character.animation.frame >= 8) {
				/* The animation is complete */
				character.x += character.animation.dx;
				character.y += character.animation.dy;

				delete character.animation;
			}
		}
	}
}

window.addEventListener('load', function()
{
	var canvas		= document.createElement('canvas');
	var ctx			= canvas.getContext('2d');

	document.body.appendChild(canvas);

	window.addEventListener('keydown', function(event)
	{
		switch (event.key.toLowerCase()) {
			case "arrowup":
			case "w":	buttons.up		= true;	break;
			case "arrowleft":
			case "a":	buttons.left	= true;	break;
			case "arrowdown":
			case "s":	buttons.down	= true;	break;
			case "arrowright":
			case "d":	buttons.right	= true;	break;
			default:
				console.log(event);
				break;
		}
	});

	window.addEventListener('keyup', function(event)
	{
		switch (event.key.toLowerCase()) {
			case "arrowup":
			case "w":	delete buttons.up;		break;
			case "arrowleft":
			case "a":	delete buttons.left;	break;
			case "arrowdown":
			case "s":	delete buttons.down;	break;
			case "arrowright":
			case "d":	delete buttons.right;	break;
		}
	});

	var w = 0;
	var h = 0;
	var resizeCanvas = function()
	{
		if (w != window.innerWidth || h != window.innerHeight) {
			w = window.innerWidth;
			h = window.innerHeight;

			for (var i = 1; ; i++) {
				if ((i * 16 * world.viewport.width <= w) &&
					(i * 16 * world.viewport.height <= h)
				) {
					world.scale = i;
				} else {
					break;
				}
			}

			w = world.scale * 16 * world.viewport.width;
			h = world.scale * 16 * world.viewport.height;
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

		if (time - lastFrame < 16) {  /* 60fps max */
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
			tick();
			ticks++;
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


