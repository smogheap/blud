let TILE_SIZE	= 16;
let editor		= false;
let input;
let level;

let hud = loadImage('images/hud.png');

/*
	This will be true for the first frame only, and can be used for debug
	purposes to avoid printing debug messages at 60fps.
*/
let firstframe		= true;

class coord
{
	x: number;
	y: number;
}

function actorAt(x, y)
{
	for (var a = 0, actor; actor = level.actors[a]; a++) {
		if (actor.isAt(x, y)) {
			return(actor);
		}
	}

	return(null);
}

function tick(ticks)
{
	/* Paused? */
	if (input.getButton(input.PAUSE, true) & input.PRESSED) {
		MenuAction("pause");
	}

	if (input.getButton(input.A, true) & input.PRESSED) {
		var pos		= player.lookingAt();
		var actor	= actorAt(pos.x, pos.y);

		if (actor) {
			actor.talk();
		}
	}

	if (input.getButton(input.SELECT, true) & input.PRESSED) {
		player.damage(1000);
	}

	if (!level.tick()) {
		/* Nothing else is active while the level is sliding */
		return(false);
	}
}

function render(ctx)
{
	level.render(ctx);

	if (!editor) {
		/* HUD */
		var dx = 8, dy = 8;
		drawBorder(ctx, dx, dy, 64 + 12, 8 + 12, 'black');

		dx += 6;
		dy += 6;

		/* Scale the player's health to a 64 pixel long bar */
		var health	= player.health * 64 / 100;
		var w		= 64 - health;

		if (health < 8) {
			w = health;
		}

		if (health > 0) {
			ctx.drawImage(hud, 0, 0, health, 8, dx, dy, health, 8);
		}

		if (w > 0) {
			w = Math.min(w, 8);

			ctx.drawImage(hud,
					64, 0,
					w, 8,
					health > 8 ? dx + health - 8 : dx, dy,
					w, 8);
		}
	} else {
		// TODO Draw a row of tiles that can be used at the bottom of the screen
		// TODO Draw a border around the selected tile
		// TODO Allow picking a tile and applying it to the level
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
	var scale		= 1;
	var canvas		= document.createElement('canvas');
	var ctx			= canvas.getContext('2d');
	var buffer		= document.createElement('canvas');
	var bctx		= buffer.getContext('2d');

	document.body.appendChild(canvas);

	input = new InputHandler(canvas);

	var w = 0;
	var h = 0;
	var resizeCanvas = function(force?:boolean)
	{
		if (force || w != window.innerWidth || h != window.innerHeight) {
			w = window.innerWidth;
			h = window.innerHeight;

			for (var i = 1; ; i++) {
				if ((i * TILE_SIZE * world.viewport.minwidth  <= w) &&
					(i * TILE_SIZE * world.viewport.minheight <= h)
				) {
					scale = i;
				} else {
					break;
				}
			}
			world.viewport.width	= Math.floor(w / (scale * TILE_SIZE));
			world.viewport.height	= Math.floor(h / (scale * TILE_SIZE));

			world.viewport.width	= Math.min(world.viewport.width, world.viewport.maxwidth);
			world.viewport.height	= Math.min(world.viewport.height, world.viewport.maxheight);

			console.log("Using viewport size:", world.viewport.width, world.viewport.height);

			w = Math.min(scale * TILE_SIZE * world.viewport.width,  window.innerWidth);
			h = Math.min(scale * TILE_SIZE * world.viewport.height, window.innerHeight);;
			// console.log(scale, w, h, window.innerWidth, window.innerHeight);

			canvas.setAttribute('width',  '' + w);
			canvas.setAttribute('height', '' + h);

			buffer.setAttribute('width',  '' + (world.viewport.width  * TILE_SIZE));
			buffer.setAttribute('height', '' + (world.viewport.height * TILE_SIZE));

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

			level.resize(buffer.width, buffer.height);
		}
	};

	bctx.save();

	var ticksPerSec	= 60;
	var tickWait	= Math.floor(1000 / ticksPerSec);
	var lastFrame	= 0;
	var frametime	= 0;
	var ticks		= 0;
	var area;

	var doAnimationFrame = function doAnimationFrame(time)
	{
		requestAnimationFrame(doAnimationFrame);

		/*
			Poll input devices (mainly gamepads) as frequently as possible
			regardless of the tick rate.
		*/
		input.poll();

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
				0, 0, buffer.width * scale, buffer.height * scale);
	};

	level = new Level(world, function() {
		/* Load the town center */
		level.loadArea("towncenter");
		level.resize(buffer.width, buffer.height);

		requestAnimationFrame(doAnimationFrame);
	});
});


