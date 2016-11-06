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

		// TODO Check the position the character is moving to (regardless of the
		//		direction it is moving)?
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

	if (!tile || !world.tiles[tile]) {
		return(false);
	}

	return(!world.tiles[tile].solid);
}

function scrollViewport(x, y, frames)
{
	var vx = x - world.viewport.x;
	var vy = y - world.viewport.y;

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

	world.viewport.offset.steps = Math.floor(TILE_SIZE / (frames || 1));
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
	if (input.getButton(input.PAUSE, true) & input.PRESSED) {
		new Dialog({
			msg:		"Paused",
			choices:	[ "Continue", "About", "Options", "New Game" ],

			closecb: function(selected) {
				/*
					Clear any additional pause events that may have happened
					while the game was paused.
				*/
				input.getButton(input.PAUSE, true);

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
							{ actor: player, msg: [
								"Once upon a time there was a little",
								"blood cell named Blud, but everyone",
								"called him Arnold."
							].join('\n')},

							{ actor: player, msg: [
								"Arnold was,",
								"   to be blunt,",
								"      a bit of a dick."
							].join('\n')},

							{ actor: player, msg: [
								"Luckily this story isn't about Arnold."
							].join('\n')},

							{
								actor: {
									actor:		arnold,
									action:		"dividing",
									delay:		20,
									rate:		0.25
								},
								msg: [
									"One day, Arnold divided, as cells",
									"do and a new cell was born. The new",
									"cell was named Blud as well, but",
									"everyone called it...",
								].join('\n')
							},

							{
								msg: [
									"Uh, Help me out here...",
									"What did they call the",
									"new cell?"
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

function render(ctx)
{
	if (!world.images) {
		world.images = {};
	}

	var wx = world.viewport.offset.x;
	var wy = world.viewport.offset.y;
	var square, tile, src, img;

	/*
		Render each row from the top down, so a row closer to the player can
		draw over the row behind it.
	*/
	for (var y = world.viewport.y - 1; y <= world.viewport.y + world.viewport.height; y++) {
		for (var x = world.viewport.x - 1; x <= world.viewport.x + world.viewport.width; x++) {
			if (y >= world.height || x >= world.width) {
				break;
			}

			if (!(square = squareAt(x, y))) {
				continue;
			}
			tile = tileAt(x, y);
			src = world.tiles[tile].src;

			if (src && !world.images[src]) {
				world.images[src] = loadImage(src);
			}

			img = src ? world.images[src] : null;

			if (img) {
				ctx.drawImage(img,
						square[1] * TILE_SIZE, square[2] * TILE_SIZE,
						TILE_SIZE, TILE_SIZE,
						(TILE_SIZE * (x - world.viewport.x)) + wx,
						(TILE_SIZE * (y - world.viewport.y)) + wy,
						(TILE_SIZE), (TILE_SIZE));
			}

			// TODO Draw any items that are on this spot
		}

		for (var a = 0, actor; actor = actors[a]; a++) {
			if (!actor.visible || !actor.renderRow(y)) {
				continue;
			}

			actor.render(ctx, wx, wy);
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
	var oldarea		= null;

	document.body.appendChild(canvas);

	input = new InputHandler(canvas);

	world.scale = 1;

	var w = 0;
	var h = 0;
	var resizeCanvas = function(force)
	{
		if (force || w != window.innerWidth || h != window.innerHeight) {
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
			world.viewport.width	= Math.floor(w / (world.scale * TILE_SIZE));
			world.viewport.height	= Math.floor(h / (world.scale * TILE_SIZE));

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

	var ticksPerSec	= 60;
	var tickWait	= Math.floor(1000 / ticksPerSec);
	var lastFrame	= 0;
	var frametime	= 0;
	var ticks		= 0;
	var area;

	var doAnimationFrame = function doAnimationFrame(time)
	{
		/*
			Poll input devices (mainly gamepads) as frequently as possible
			regardless of the tick rate.
		*/
		input.poll();

		if (time - lastFrame < TILE_SIZE) {  /* 60fps max */
			requestAnimationFrame(doAnimationFrame);
			return;
		}

		if (frametime) {
			frametime += time - lastFrame;
		} else {
			frametime = time - lastFrame;
		}
		lastFrame = time;

		while (frametime >= tickWait) {
			if (!oldarea) {
				if (dialog && !dialog.closed) {
					dialog.tick(ticks);
				} else {
					tick(ticks);
				}
			}

			ticks++;
			frametime -= tickWait;
			// frametime /= 1.5;
		}

		if (area != world.area) {
			area = world.area;

			/* Setup a slide from one area to a new one */
			oldarea	= {
				image:		buffer,
				x:			0,
				y:			0
			};
			buffer	= document.createElement('canvas');
			bctx	= buffer.getContext('2d');

			resizeCanvas(true);
			render(bctx);
		}

		if (!oldarea) {
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
		}

		/* Draw (and scale) the image to the main canvas now */
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(buffer,
				0, 0, buffer.width, buffer.height,

				oldarea ? oldarea.x - (world.scroll.x * world.scale * buffer.width)  : 0,
				oldarea ? oldarea.y - (world.scroll.y * world.scale * buffer.height) : 0,

				buffer.width * world.scale, buffer.height * world.scale);

		if (oldarea) {
			ctx.drawImage(oldarea.image,
					0, 0, buffer.width, buffer.height,

					oldarea ? oldarea.x : 0,
					oldarea ? oldarea.y : 0,

					buffer.width * world.scale, buffer.height * world.scale);

			var slidespeed = 24;
			oldarea.x += slidespeed * world.scroll.x;
			oldarea.y += slidespeed * world.scroll.y;

			if (Math.abs(oldarea.x) >= (buffer.width  * world.scale) ||
				Math.abs(oldarea.y) >= (buffer.height * world.scale)
			) {
				/* Done */
				oldarea = null;
			}
		}

		requestAnimationFrame(doAnimationFrame);
	};

	loadLevelData(function() {
		/* Load the town center */
		loadArea((area = "towncenter"));

		requestAnimationFrame(doAnimationFrame);
	});
});


