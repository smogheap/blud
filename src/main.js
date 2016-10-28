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

function render(ctx)
{
	if (!world.images) {
		world.images = {};
	}

	/* We need the same seed for every frame so the same tiles are used */
	WRand.setSeed(12345);

	/* Determine which vertical row each character is on for this frame */
	for (var c = 0, character; character = world.characters[c]; c++) {
		if (character.animation && character.animation.dy > 0) {
			character.ry = 1;
		} else {
			character.ry = 0;
		}
	}

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
				// TODO Load an image for tile
				world.images[tile] = loadImage('images/' + tile + '.png');
			}

			var img		= world.images[tile];
			var vars	= (img.width / 16);
			var off		= (WRand() % vars) * 16;


			// TODO If this tile has alternate images pick one
			// TODO Detect edges and pick the appropriate alternate based
			//		on the edges


			// TODO Draw the tile

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

			if (character.y + character.ry !== y) {
				continue;
			}

			var name;
			var off		= 0;
			var offx	= 0;
			var offy	= 0;

			// TODO Adjust for frame rate...
			if (character.animation) {
				/* Continue the previous animation */
				name = character.animation.name;

				off = character.animation.frame * 16;

				character.animation.frame++;

				offx = (character.animation.dx * 2 * character.animation.frame);
				offy = (character.animation.dy * 2 * character.animation.frame);
			} else {
				if (buttons.up) {
					name = 'north';
					character.animation = { name: name, frame: 0, dx: 0, dy: -1 };
				} else if (buttons.down) {
					name = 'south';
					character.animation = { name: name, frame: 0, dx: 0, dy: 1 };
				} else if (buttons.left) {
					name = 'west';
					character.animation = { name: name, frame: 0, dx: -1, dy: 0 };
				} else if (buttons.right) {
					name = 'east';
					character.animation = { name: name, frame: 0, dx: 1, dy: 0 };
				} else {
					name = 'standing';
				}
			}

			if (!character.images[name]) {
				character.images[name] = loadImage('images/' + character.name + '-' + name + '.png');
			}

			ctx.drawImage(character.images[name],
				off, 0, 16, 16,
				(16 * world.scale * character.x) + (offx * world.scale),
				(16 * world.scale * character.y) + (offy * world.scale),
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

	ctx.mozImageSmoothingEnabled		= false;
	ctx.webkitImageSmoothingEnabled		= false;
	ctx.msImageSmoothingEnabled			= false;
	ctx.imageSmoothingEnabled			= false;

	window.addEventListener('keydown', function(event)
	{
		switch (event.keyCode) {
			case 37:	buttons.left	= true; break;
			case 38:	buttons.up		= true; break;
			case 39:	buttons.right	= true; break;
			case 40:	buttons.down	= true; break;
		}
	});

	window.addEventListener('keyup', function(event)
	{
		switch (event.keyCode) {
			case 37:	delete buttons.left;	break;
			case 38:	delete buttons.up;		break;
			case 39:	delete buttons.right;	break;
			case 40:	delete buttons.down;	break;
		}
	});

	document.body.appendChild(canvas);

	var w = 0;
	var h = 0;
	var resizeCanvas = function()
	{
		if (w != window.innerWidth || h != window.innerHeight) {
			w = window.innerWidth;
			h = window.innerHeight;

			for (var i = 1; ; i++) {
				if ((i * 16 * world.viewport.width < w) &&
					(i * 16 * world.viewport.height < h)
				) {
					world.scale = i;
				} else {
					break;
				}
			}
			w = world.scale * 16 * world.viewport.width;
			h = world.scale * 16 * world.viewport.height;

			canvas.setAttribute('width',  w);
			canvas.setAttribute('height', h);

			/* Restore the initial saved state, and save it again */
			ctx.restore();
			ctx.save();
		}
	};

	ctx.save();

	var renderWrapper = function renderWrapper(time)
	{
		var thrust;
		var rocket;

		requestAnimationFrame(renderWrapper);
		resizeCanvas();

		/* Clear the canvas */
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		render(ctx);
		ctx.restore();
	};
	requestAnimationFrame(renderWrapper);
});


