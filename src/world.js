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
			edges:			true
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
			y:				1
		}
	]
};

