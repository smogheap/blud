function MenuAction(name: any, value?: string)
{
	let p = null;

	if ('object' === typeof name) {
		var keys	= Object.keys(name);

		for (let i = 0; i < keys.length; i++) {
			MenuAction(keys[i], name[keys[i]]);
		}
	}

	switch (name) {
		case "continue":
			break;

		case "pause":
			if (!editor) {
				p = Ask({
					msg:		"Paused",

					choices: {
						"continue":		"Continue",
						"edit":			"Edit",
						"about":		"About",
						"options":		"Options",
						"newgame":		"New Game",

						"picktile":		"Tile Picker"
					}
				});
			} else {
				p = Ask({
					msg:		"Paused",

					choices: {
						"continue":		"Continue",
						"edit":			"Play"
					}
				});
			}
			break;

		case "edit":
			editor = !editor;
			break;

		case "about":
			p = Ask({
				actor: {
					actor:	player,
					action:	player.MOVING,
					facing:	"E",
					rate:	0.5
				},
				msg: [
					"Blud is a game about a blood cell who finds himself in",
					"one odd situation after another.\n\n",

					"Blud was created by Micah Gorrell and Owen Swerkstrom."
				].join(' ')
			});
			break;

		case "options":
			p = Ask({
				msg:		"Options",
				choices: {
					"remap":	"Remap Controller",
					"continue":	"Cancel"
				}
			});
			break;

		case "remap":
			input.remapjs();
			break;

		case "newgame":
			var arnold		= new Actor("arnold", world.actors["arnold"], level);

			arnold.state	= "standing";

			p = Ask([
				{
					actor:			player,
					msg: [
						"Once upon a time there was a little blood cell named",
						"Blud, but everyone called him Arnold."
					].join(' ')
				},
				{
					actor:			player,
					msg: [
						"Arnold was,",
						"   to be blunt,",
						"      a bit of a dick."
					].join('\n')
				},
				{
					actor:			player,
					msg:			"Luckily this story isn't about Arnold."
				},
				{
					actor: {
						actor:		arnold,
						action:		"dividing",
						delay:		20,
						rate:		0.25
					},
					msg: [
						"One day, Arnold divided, as cells do and a new cell",
						"was born. The new cell was named Blud as well, but",
						"everyone called them...",
					].join(' ')
				},
				{
					msg: [
						"Uh, Help me out here...",
						"What did they call the new cell?"
					].join('\n'),

					actor:			player,
					kb:				true,
					key:			"nameplayer"
				}
			]);
			break;

		case "respawn":
			player.health = 100;
			player.setState(player.STANDING);

			var arnold		= new Actor("arnold", world.actors["arnold"], level);
			arnold.state	= "standing";

			p = Ask([
				{
					actor: player,
					msg: "Uh, I thought this game was about " + player.name +
							"... but " + player.name + " is dead."
				},

				{
					actor: player,
					msg: "Luckily this story isn't really about " + player.name + "."
				},

				{
					actor: {
						actor:		arnold,
						action:		"dividing",
						delay:		20,
						rate:		0.25
					},
					msg: [
						"Remember Arnold?\n\nArnold divided again",
						"and a new cell was born. The new cell",
						"was named Blud as well, but everyone",
						"called them...",
					].join(' ')
				},

				{
					msg: [
						"Uh, Help me out here...",
						"What did they call the new cell?"
					].join('\n'),

					actor:			player,
					kb:				true,
					key:			"nameplayer"
				}
			]);
			break;

		case "nameplayer":
			if (!value) {
				value = player.name;
			} else {
				player.name = value;
			}

			p = Ask([
				{
					actor: player,
					msg: "The new cell was named Blud and everyone called them " + value + "."
				},

				{
					actor: player,
					msg: "This is a story about " + value + "."
				}
			]);
			break;

		case "picktile":
			if (level && level.tileset) {
				p = level.tileset.pick();
			} else {
				Ask({
					msg: "No tileset loaded"
				});
			}
			break;
	}

	if (p) {
		p.then(MenuAction)
		.catch(() => {
			;
		});
	}
}

