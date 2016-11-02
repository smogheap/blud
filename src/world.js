var world = {
	viewport: {
		x:					15,
		y:					0,
		minwidth:			24,
		minheight:			14,
		maxwidth:			34,
		maxheight:			19,

		offset:				{
			x:				0,
			y:				0
		}
	},

	tiles: {
		" ": {
			name:			"ground",
			src:			"images/blud.png",

			/* This number is added to all offsets defined for this tile */
			baseOffset:		[ 1, 6 ],
			options: [
				[ 0, 0 ], [ 1, 0 ], [ 2, 0 ], [ 3, 0 ],
				[ 0, 1 ], [ 1, 1 ], [ 2, 1 ], [ 3, 1 ],
			]
		},
		"o": {
			name:			"plasma",
			src:			"images/blud.png",
			solid:			true,

			/* This number is added to all offsets defined for this tile */
			baseOffset:		[ 14, 3 ],

			edges: {
				/* Entirely enclosed */
				"1111": [ [ 0, 0 ] ],

				/* Open on one side */
				"0111": [ [ 2, 5 ] ],
				"1011": [ [ 0, 3 ] ],
				"1101": [ [ 3, 0 ] ],
				"1110": [ [ 5, 2 ] ],

				"1100": [ [ 4, 1 ] ],
				"0110": [ [ 4, 4 ] ],
				"0011": [ [ 1, 4 ] ],
				"1001": [ [ 1, 1 ] ],

				/* Open on opposite sides */
				"0101": [ [ 1, 8 ] ],
				"1010": [ [ 2, 7 ] ],

				/* Edge on a single side */
				"1000": [ [ 2, 1 ] ],
				"0100": [ [ 4, 3 ] ],
				"0010": [ [ 3, 4 ] ],
				"0001": [ [ 1, 2 ] ],

				/* Kitty corners */
				"000010": [ [ 1, 3 ] ],
				"000001": [ [ 4, 2 ] ],
				"000011": [ [ 3, 1 ] ],
				"000101": [ [ 4, 8 ] ],
				"000111": [ [ 4, 8 ] ],
				"010010": [ [ 1, 9 ] ],
				"010011": [ [ 1, 9 ] ],
				"001101": [ [ 1, 10 ] ],
				"001111": [ [ 1, 10 ] ],
				"011010": [ [ 4, 10 ] ],
				"011011": [ [ 4, 10 ] ],
				"001011": [ [ 3, 7 ] ],
				// "001010":
				// "001001":

				/* No edges */
				"0000": [ [ 2, 2 ], [ 2, 3 ], [ 3, 2 ], [ 3, 3 ] ]
			}
		},

		"C": {
			name:			"fat",
			src:			"images/fat.png",
			solid:			true,

			/* This number is added to all offsets defined for this tile */
			baseOffset:		[ 0, 0 ],

			edges: {
				"1111": [ [ 0, 0 ] ],
				"1011": [ [ 1, 0 ] ],
				"1010": [ [ 2, 0 ] ],
				"1110": [ [ 3, 0 ] ],

				"1101": [ [ 0, 1 ] ],
				"1001": [ [ 1, 1 ] ],
				"1000": [ [ 2, 1 ] ],
				"1100": [ [ 3, 1 ] ],

				"0101": [ [ 0, 2 ] ],
				"0001": [ [ 1, 2 ] ],
				"0000": [ [ 2, 2 ] ],
				"0100": [ [ 3, 2 ] ],

				"0111": [ [ 0, 3 ] ],
				"0011": [ [ 1, 3 ] ],
				"0010": [ [ 2, 3 ] ],
				"0110": [ [ 3, 3 ] ],
			}
		},

		"l": {
			name:			"fatleft",
			solid:			true,

			/*
				This uses the tiles defined by "C" above, but with a west edge
				always on regardless of the edges that are detected.
			*/
			variantOf:		"C",
			"edges":		"0001"
		},
		"r": {
			name:			"fatright",
			solid:			true,

			/*
				This uses the tiles defined by "C" above, but with a west edge
				always on regardless of the edges that are detected.
			*/
			variantOf:		"C",
			"edges":		"0100"
		}

	},

	rows: [
		"oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
		"oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
		"oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
		"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		"CCCCCCCCCCr       lCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		"CCCCCCCCCCrlCCC   lCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		"CCCCCCCCCCrlCCClCrlCCCCCCCCCCCCCCCCCooCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
		"           lCCClCr                ooooooo                                       ",
		"               lCr                oooooooo                                      ",
		"                                  oooooooo                                      ",
		"                                 oooooooo                                       ",
		"                                oooooooo                                        ",
		"                                oooooooo                                        ",
		"                                oooooooo                                        ",
		"                                 oooooooo                                       ",
		"                                 oooooooo                                       ",
		"                                  ooooooo                                       ",
		"                                  ooooooo                                       ",
		"                                  ooooooo                                       ",
		"                                  ooooooo                                       ",
		"                                  ooooooo                                       ",
		"                                  ooooooo                                       ",
	],

	testrows2: [
		"C                                                                               ",
		"oC                                                                              ",
		"ooC                                                                             ",
		"oooC                                                                            ",
		"ooooC                                                                           ",
		"oooooC                                                                          ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooo                                                                         ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooC                                                                         ",
		"ooooooCooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
		"oooooCCooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
		"ooooCCCooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
		"oooCCCC                                                                         ",
		"ooCCCCC                                                                         ",
		"oCCCCCC                                                                         ",
		"CCCCCC                                                                          ",
		"CCCCC                                                                           ",
		"CCCC                                                                            ",
		"CCC                                                                             ",
		"CC                                                                              ",
		"C                                                                               ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                "
	],

	testrows: [
		"           oooo                                                                 ",
		"             ooooooo                                                            ",
		"             ooooooooooooo                                                      ",
		" ooo ooo         oooooooooo    ooooo                                            ",
		" o o o o o              oooooooooooo         oooooo                             ",
		" ooo ooo   o             ooooooooooooooo   ooooooooo                            ",
		" ooo                              oooooo   ooooooooooo                          ",
		"       o     o     oo              ooooo   ooooooooooooooooo                    ",
		"     oooo  oooo  ooooo                        oooooooooooooooooooooo            ",
		"     ooooo o  oo o   oo                           ooooooooooooooooooo           ",
		"    ooooo oo  o oo   o                             ooooooooooooooooooooooooooooo",
		"     oooo  oooo  ooooo                              oooooooooooooooooooooooooooo",
		"      o     o     oo                                    oooooooooooooooooooooooo",
		"                                                          oo oooooooooo    ooooo",
		"                                                              ooooooooo    ooooo",
		"                                                                    ooo    ooooo",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"                                                                                ",
		"      ooooooo                                                                   ",
		"    ooooooooooooooo                                                             ",
		"  ooooooooooooooooooooo                                                         ",
		" oooooooooooooooooooooooooo      ooo                                            ",
		"oooooooooooooooooooooooooooooooooooooooo                                        ",
		"ooooooooooooooooooooooooooooooooooooo                                           ",
		"ooooooooooooooooooooooooooooooooo                                               ",
		"oooooooooooooooooooooooooooooo                                                  ",
		"oooooooooooooooooooooooooooooooo                                                ",
		"ooooooooooooooooooooooooooooooooooooo                                           "
	],

	actors: {
		"blud": {
			x:				29,
			y:				9,
			facing:			"E",
			src:			"images/blud.png",

			moving: {
				N: { x: 3, y: 3, frames: 8, ox: 1, oy: 0 },
				E: { x: 3, y: 0, frames: 8, ox: 1, oy: 0 },
				S: { x: 3, y: 1, frames: 8, ox: 1, oy: 0 },
				W: { x: 3, y: 2, frames: 8, ox: 1, oy: 0 }
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
			}
		},

		"abby": {
			x:				28,
			y:				10,
			facing:			"S",
			src:			"images/blud.png",

			standing: {
				N: { x: 0, y: 4 },
				E: { x: 0, y: 4 },
				S: { x: 0, y: 4 },
				W: { x: 0, y: 4 }
			},

			blinking: {
				N: { x: 0, y: 5 },
				E: { x: 0, y: 5 },
				S: { x: 0, y: 5 },
				W: { x: 0, y: 5 }
			}
		},

		"saul": {
			x:				9,
			y:				10,
			facing:			"S",
			src:			"images/blud.png",

			standing: {
				N: { x: 5, y: 4 },
				E: { x: 5, y: 4 },
				S: { x: 5, y: 4 },
				W: { x: 5, y: 4 }
			},

			blinking: {
				N: { x: 5, y: 5 },
				E: { x: 5, y: 5 },
				S: { x: 5, y: 5 },
				W: { x: 5, y: 5 }
			},

			dialog: [
				"Howdy",
				"What do you want?",
				"Why are you bugging me? Go away!"
			]
		}
	}
};

