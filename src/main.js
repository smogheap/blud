var TILE_SIZE	= 16;
var input;
var level;

var hud = loadImage('images/hud.png');

/*
	This will be true for the first frame only, and can be used for debug
	purposes to avoid printing debug messages at 60fps.
*/
var firstframe		= true;

function actorAt(x, y)
{
	for (var a = 0, actor; actor = actors[a]; a++) {
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
						var arnold		= new Actor(world, "arnold", level);

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
		var actor	= actorAt(pos.x, pos.y);

		if (actor) {
			actor.talk();
		}
	}

	if (!level.tick()) {
		/* Nothing else is active while the level is sliding */
		return(false);
	}
}

function render(ctx)
{
	level.render(ctx);

	/* HUD */
	var dx = 10, dy = 10;
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
	var resizeCanvas = function(force)
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

		/* Load the actors; Only the first gets input */
		(player = new Actor(world, "blud", level));
		new Actor(world, "abby", level);
		new Actor(world, "saul", level);

		new Actor(world, "rotavirus", level, "towncenter", 37, 10);
		new Actor(world, "rotavirus", level, "towncenter", 39, 10);
		new Actor(world, "rotavirus", level, "towncenter", 10, 20);

		/* The level is responsible for rendering the actors */
		for (var a = 0, actor; actor = actors[a]; a++) {
			level.addChild(actor);
		}

		requestAnimationFrame(doAnimationFrame);
	});
});


