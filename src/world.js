var world = {
	viewport: {
		x:					0,
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
		}
	},

	rows: [
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

	characters: [
		{
			name:			"blud",
			x:				1,
			y:				1,
			direction:		"E"
		}
	]
};

