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

	// TODO Decide how many rows/columns to render


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
			// TODO Is this character on this row? If the character is moving
			//		then their position may be between rows now and shouldn't
			//		be drawn yet if a portion of the character is on the lower
			//		row.

			// TODO Draw the character
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
			case 37:	window.buttons.left		= true; break;
			case 38:	window.buttons.up		= true; break;
			case 39:	window.buttons.right	= true; break;
			case 40:	window.buttons.down		= true; break;
		}
	});

	window.addEventListener('keyup', function(event)
	{
		switch (event.keyCode) {
			case 37:	delete window.buttons.left;		break;
			case 38:	delete window.buttons.up;		break;
			case 39:	delete window.buttons.right;	break;
			case 40:	delete window.buttons.down;		break;
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
				if (i * 16 * world.viewport.width < w) {
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


