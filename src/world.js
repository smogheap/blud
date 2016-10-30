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
			src:			"images/floor.png"
		},
		"o": {
			name:			"plasma",
			src:			"images/plasma.png",
			solid:			true,
			edges: {
				/* Entirely enclosed */
				"1111": [ [ 0, 0 ] ],

				/* Open on one side */
				"0111": [ [ 2, 5 ] ],
				"1011": [ [ 0, 3 ] ],
				"1101": [ [ 3, 0 ] ],
				"1110": [ [ 5, 2 ] ],

				/* Corner */
				"1100": [ [ 4, 1 ] ],
				"0110": [ [ 4, 4 ] ],
				"0011": [ [ 1, 4 ] ],
				"1001": [ [ 1, 1 ] ],

				/* Open on opposite sides */
				"1010": [ [ 0, 2 ] ],
				"0101": [ [ 2, 0 ] ],

				/* Edge on a single side */
				"1000": [ [ 2, 1 ] ],
				"0100": [ [ 4, 3 ] ],
				"0010": [ [ 3, 4 ] ],
				"0001": [ [ 1, 2 ] ],

				/* No edges */
				"0000": [ [ 2, 2 ], [ 2, 3 ], [ 3, 2 ], [ 3, 3 ] ]
			}
		}
	},

	rows: [
		"           oooo                                                                 ",
		"             ooooooo                                                            ",
		"             ooooooooooooo                                                      ",
		"    ooo          oooooooooo    ooooo                                            ",
		"    o o o               oooooooooooo         oooooo                             ",
		"    ooo   o              ooooooooooooooo   ooooooooo                            ",
		"                                  oooooo   ooooooooooo                          ",
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

