var world = {
	viewport: {
		width:	30,
		height:	16
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
			x:				5,
			y:				0
		}
	]
};

