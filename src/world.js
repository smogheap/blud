var world = {
	viewport: {
		x:					20,
		y:					5,
		width:				30,
		height:				16,

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
			solid:			true
		}
	},

	rows: [
		"           oooo                                                                 ",
		"             ooooooo                                                            ",
		"             ooooooooooooo                                                      ",
		"                 oooooooooo    ooooo                                            ",
		"                        oooooooooooo         oooooo                             ",
		"                         ooooooooooooooo   ooooooooo                            ",
		"                                  oooooo   ooooooooooo                          ",
		"                                   ooooo   ooooooooooooooooo                    ",
		"                                              oooooooooooooooooooooo            ",
		"                                                  ooooooooooooooooooo           ",
		"                                                   ooooooooooooooooooooooooooooo",
		"                                                    oooooooooooooooooooooooooooo",
		"                                                        oooooooooooooooooooooooo",
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
			x:				25,
			y:				10
		}
	]
};

