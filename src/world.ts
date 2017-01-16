var world = {
	viewport: {
		x:					15,
		y:					0,
		minwidth:			24,
		minheight:			15,
		maxwidth:			34,
		maxheight:			19,

		offset:				{
			x:				0,
			y:				0
		},

		width:				0,
		height:				0
	},


	// Tileset is 13x6
	areas: {
		"towncenter": [
			[53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53],
			[53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53],
			[53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53],
			[65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,52,54,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,65,74,74,74,74,65,74,74,65,74,74,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,65,74,74,74,74,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,65,65,65,65,65,65,74,74,74,74,65,65,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,65,65,65,65,65,65,74,74,74,74,65,65,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,65,65,65,65,65,65,65,65,74,74,74,74,74,74,74,74,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,65,74,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,65,65,65,65,65,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
			[74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74]
		]
	},

	layout: [
		[ "townwest",	"towncenter",	"towneast"	],
		[ null,			"townsouth",	null		]
	],

	actors: {
		"blud": {
			x:				28,
			y:				9,
			facing:			"E",
			src:			"images/blud.png",

			moving: {
				N: { x: 3, y: 3, rate: 0.5, frames: 8, ox: 1, oy: 0 },
				E: { x: 3, y: 0, rate: 0.5, frames: 8, ox: 1, oy: 0 },
				S: { x: 3, y: 1, rate: 0.5, frames: 8, ox: 1, oy: 0 },
				W: { x: 3, y: 2, rate: 0.5, frames: 8, ox: 1, oy: 0 }
			},

			standing: {
				N: { x: 0, y: 3 },
				E: { x: 0, y: 0 },
				S: { x: 0, y: 1 },
				W: { x: 0, y: 2 }
			},

			blinking: {
				N: { x: 1, y: 3 },
				E: { x: 1, y: 0 },
				S: { x: 1, y: 1 },
				W: { x: 1, y: 2 }
			},

			dead: {
				S: { x: 0, y: 4, src: "images/blud.png" }
			}
		},

		"arnold": {
			src:			"images/split.png",
			width:			32,

			standing: {
				S: { x: 0, y: 0 },
			},
			dividing: {
				S: { x: 0, y: 0, rate: 1, frames: 18, ox: 1, oy: 0, repeat: false },
			},
			split: {
				S: { x: 17, y: 0 },
			},
		},

		"abby": {
			x:				25,
			y:				10,
			area:			"towncenter",

			facing:			"S",
			src:			"images/npc.png",

			standing: {
				S: { x: 0, y: 0 }
			},

			blinking: {
				S: { x: 0, y: 2 }
			},

			dead: {
				S: { x: 0, y: 4, src: "images/blud.png" }
			},

			talking: {
				S: { x: 0, y: 0, rate: 0.1, frames: 2, ox: 0, oy: 1 }
			},

			dialog: [
				"What's a nice cell like you don't here?",
				"You're cute",
				[
					"Why don't you and I get out of here",
					"and see if we can find a nice quiet",
					"vessel to stroll along?",
					"",
					"Would you like that?"
				].join('\n')
			]
		},

		"saul": {
			x:				9,
			y:				10,
			area:			"towncenter",

			facing:			"S",
			src:			"images/npc.png",

			standing: {
				S: { x: 5, y: 0 }
			},

			blinking: {
				S: { x: 5, y: 2 }
			},

			talking: {
				S: { x: 5, y: 0, rate: 0.1, frames: 2, ox: 0, oy: 1 }
			},

			dead: {
				S: { x: 0, y: 4, src: "images/blud.png" }
			},

			dialog: [
				"Howdy",
				"What do you want?",
				"Why are you bugging me? Go away!"
			]
		},

		"rotavirus": {
			at: [
				{ x: 37, y: 10, area: "towncenter" },
				{ x: 39, y: 10, area: "towncenter" },
				{ x: 10, y: 20, area: "towncenter" },
			],

			src:			"images/enemy.png",

			standing: {
				S: { x: 2, y: 0 }
			},

			stuck: {
				S: { x: 0, y: 0, rate: 0.25, steps: 8, frames: 2, ox: 1, oy: 0 }
			},
			moving: {
				S: { x: 0, y: 0, rate: 0.25, steps: 8, frames: 2, ox: 1, oy: 0 }
			},

			dead: {
				S: { x: 0, y: 4, src: "images/blud.png" }
			}
		},

		"phage": {
			x:				20,
			y:				15,
			facing:			"S",
			area:			"towncenter",
			src:			"images/enemy.png",

			standing: {
				S: { x: 0, y: 1, rate: 0.01, steps: 8, frames: 2, ox: 1, oy: 0 }
			},

			crouch: {
				S: { x: 2, y: 1 }
			},
			jump: {
				S: { x: 3, y: 1 }
			}
		}
	},

	items: {
		"eyeball": {
			src:			"images/blud.png",

			standing: {
				S: { x: 3, y: 5 }
			},

			moving: {
				N: { x: 0, y: 6, rate: 0.5, frames: 6, ox:  1, oy: 0 },
				E: { x: 0, y: 5, rate: 0.5, frames: 6, ox:  1, oy: 0 },
				S: { x: 6, y: 6, rate: 0.5, frames: 6, ox: -1, oy: 0 },
				W: { x: 6, y: 5, rate: 0.5, frames: 6, ox: -1, oy: 0 }
			}
		}
	}
};

