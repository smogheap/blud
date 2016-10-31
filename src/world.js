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
			options: [
				[ 1, 6 ], [ 2, 6 ], [ 3, 6 ], [ 4, 6 ],
				[ 1, 7 ], [ 2, 7 ], [ 3, 7 ], [ 4, 7 ],
			]
		},
		"o": {
			name:			"plasma",
			src:			"images/blud.png",
			solid:			true,
			edges: {
				/* Entirely enclosed */
				"1111": [ [ 14,  3 ] ],

				/* Open on one side */
				"0111": [ [ 16,  8 ] ],
				"1011": [ [ 14,  6 ] ],
				"1101": [ [ 17,  3 ] ],
				"1110": [ [ 19,  5 ] ],

				"1100": [ [ 18,  4 ] ],
				"0110": [ [ 18,  7 ] ],
				"0011": [ [ 15,  7 ] ],
				"1001": [ [ 15,  4 ] ],

				/* Open on opposite sides */
				"0101": [ [ 15,  11 ] ],
				"1010": [ [ 16,  10 ] ],

				/* Edge on a single side */
				"1000": [ [ 16,  4 ] ],
				"0100": [ [ 18,  6 ] ],
				"0010": [ [ 17,  7 ] ],
				"0001": [ [ 15,  5 ] ],

				/* Kitty corners */
				"000010": [ [ 15,  6 ] ],
				"000001": [ [ 18,  5 ] ],
				"000011": [ [ 17,  4 ] ],
				// "000101": [ [ ] ],
				// "010010": [ [ ] ],
				"001101": [ [ 15, 13 ] ],
				"001111": [ [ 15, 13 ] ],
				"011010": [ [ 18, 13 ] ],
				"011011": [ [ 18, 13 ] ],

				/* No edges */
				"0000": [ [ 16, 5 ], [ 16, 6 ], [ 17, 5 ], [ 17, 6 ] ]
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
		"       o                           ooooo   ooooooooooooooooo                    ",
		"     oooo                                     oooooooooooooooooooooo            ",
		"     ooooo                                        ooooooooooooooooooo           ",
		"    ooooo                                          ooooooooooooooooooooooooooooo",
		"     oooo                                           oooooooooooooooooooooooooooo",
		"      o                                                 oooooooooooooooooooooooo",
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
			direction:		1
		}
	]
};

