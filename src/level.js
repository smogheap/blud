function findNearbyArea(ox, oy, area)
{
	var name	= null;

	area = area || world.area;

	for (var y = 0; y < world.layout.length; y++) {
		for (var x = 0; x < world.layout[y].length; x++) {
			if (world.layout[y][x] === area) {
				if (world.layout[y + oy] &&
					world.layout[y + oy][x + ox]
				) {
					name = world.layout[y + oy][x + ox];
				}
				break;
			}
		}
	}

	return(name);
}

/*
	Determine which area the specified coords are linked to and then switch to
	that area if one is found.

	Keep in mind that world.rows includes a 1 tile border all the way arround
	from the edges of the surrounding areas. Stepping onto that border means the
	player is in the new area.

	The player coords are relative to this area though, not the border, so the
	top left corner is actually -1, -1.
*/
function switchArea(x, y)
{
	var ox = 0;
	var oy = 0;

	if (y < 0) {
		/* Top edge of area */
		oy = -1;
	} else if (y >= world.rows.length - 2) {
		/* Bottom edge of area */
		oy = 1;
	}

	if (x < 0) {
		/* Left edge of area */
		ox = -1;
	} else if (x >= world.rows[0].length - 2) {
		/* Right edge of area */
		ox = 1;
	}

	if (0 === ox && 0 === oy) {
		return;
	}

	var name = findNearbyArea(ox, oy);

	if (!name) {
		return;
	}

	loadArea(name);

	/*
		New player position assumes there is one row or column of identical
		tiles shared by the new area and the old.
	*/
	if (oy < 0) {
		/* Move player to bottom of new area */
		player.y = world.height - 1;

		world.viewport.y = world.height - world.viewport.height;
	} else if (oy > 0) {
		/* Move player to top of new area */
		player.y = 0;
		world.viewport.y = 0;
	}

	if (ox < 0) {
		/* Move player to right edge of new area */
		player.x = world.width - 1;
		world.viewport.x = world.width - world.viewport.width;
	} else if (ox > 0) {
		/* Move player to left edge of new area */
		player.x = 0;
		world.viewport.x = 0;
	}

	if (world.viewport.x < 0) {
		world.viewport.x = 0;
	}
	if (world.viewport.y < 0) {
		world.viewport.y = 0;
	}
	scrollViewport(player.x, player.y);

	/* Save the direction so we can slide the screen that way */
	world.scroll = { x: -ox, y: -oy };
}

function tileAt(x, y, deftile, ignoreVariants, rows, tiles)
{
	var tile;

	rows = rows || world.rows;
	tiles = tiles || world.tiles;

	/*
		world.rows has a border of tiles from the surrounding areas, so the
		coords are off by one.
	*/
	x++;
	y++;

	if (!rows[y] || !rows[y][x] || !(tile = rows[y][x][0])) {
		return(deftile);
	}

	if (!ignoreVariants && tiles[tile].variantOf) {
		tile = tiles[tile].variantOf;
	}

	return(tile);
}

function squareAt(x, y, rows)
{
	var rows = rows || world.rows;

	/*
		world.rows has a border of tiles from the surrounding areas, so the
		coords are off by one.
	*/
	x++;
	y++;

	if (rows[y]) {
		return(rows[y][x]);
	}

	return(null);
}

function loadArea(name)
{
	if (!world.areas[name]) {
		return;
	}

	world.rows		= world.areas[name];
	world.area		= name;

	/* Do not include the border in the width/height */
	world.width		= world.rows[0].length - 2;
	world.height	= world.rows.length - 2;

	/* Hide/show the appropriate NPCs */
	for (var a = 0, actor; actor = actors[a]; a++) {
		if (actor.player || (actor.area && actor.area === name)) {
			actor.visible = true;
		} else {
			actor.visible = false;
		}
	}
}

function loadAreaData(name)
{
	var rows = [];

	var	c = world.areas[name];

	if (!c) {
		return;
	}

	var n = world.areas[findNearbyArea( 0, -1, name)];
	var e = world.areas[findNearbyArea( 1,  0, name)];
	var s = world.areas[findNearbyArea( 0,  1, name)];
	var w = world.areas[findNearbyArea(-1,  0, name)];
	var row;

	/*
		Build the rows for the current area with a border filled out from the
		surrounding areas.
	*/
	row = [];
	for (var x = -1; x <= c[0].length; x++) {
		var tmp;

		if (n && (tmp = n[n.length - 1].charAt(x))) {
			row.push(tmp);
		} else {
			row.push('-');
		}
	}
	rows.push(row);

	for (var y = 0; y < c.length; y++) {
		row = [];

		row.push(w ? w[y].charAt(w[y].length - 1) : '-');
		for (var x = 0; x < c[y].length; x++) {
			row.push(c[y].charAt(x));
		}
		row.push(e ? e[y].charAt(0) : '-');

		rows.push(row);
	}

	row = [];
	for (var x = -1; x <= c[0].length; x++) {
		var tmp;

		if (s && (tmp = s[0].charAt(x))) {
			row.push(tmp);
		} else {
			row.push('-');
		}
	}
	rows.push(row);

	return(rows);
}

/*
	The areas are defined as arrays of strings to make them easier to edit
	but this isn't very efficient, and requires calling charAt() constantly
	which creates new String objects, and causes the garbage collector to
	go nuts.

	So, convert the areas to arrays of arrays of numbers instead. This means
	we also have to convert the tiles list.

	This also loads a border surrounding the area from the tiles surrounding it
	that is used when calculating which tiles can be walked on.
*/
function calculateLevelData()
{
	/*
		Insert a dummy value in the tiles array because it is easier to check
		the validity of a tile value with 'if (tile)' than 'if (!isNaN(tile))'
	*/
	var newtiles	= [ {} ];
	var newareas	= {};
	var tilenames	= Object.keys(world.tiles);
	var areanames	= Object.keys(world.areas);
	var tilemap		= {};

	WRand.setSeed((new Date()).getTime());

	/* Move the tiles into an indexed array */
	for (var i = 0, tile; tile = tilenames[i]; i++) {
		tilemap[tile] = newtiles.length;
		newtiles.push(world.tiles[tile]);
	}

	/* Adjust the variantOf values */
	for (var i = 0; i < newtiles.length; i++) {
		var v;

		if ((v = newtiles[i].variantOf)) {
			newtiles[i].variantOf = tilemap[v];
		}
	}

	for (var a = 0, name; name = areanames[a]; a++) {
		/*
			Convert the area into an array of arrays (from an array of strings)
			and load the border (from surrounding areas).
		*/
		var data	= loadAreaData(name);

		/* Replace the tile names with an index */
		for (var y = 0; y < data.length; y++) {
			for (var x = 0; x < data[y].length; x++) {
				data[y][x] = [ tilemap[data[y][x]] ];
			}
		}

		/*
			Calculate the appropriate variant of a tile to used based on the
			tiles surrounding it. This is used for things like edges on
			water/walls etc.
		*/
		var key, edges = [], vedges, options, tile, offsets;

		newareas[name] = [];

		for (var y = 0; y < data.length; y++) {
			newareas[name][y] = [];

			for (var x = 0; x < data[y].length; x++) {
				tile = data[y][x][0];

				/*
					Is this a variant of another tile?

					If so swap it out for that tile, but grab the edges string
					from the variant first.
				*/
				if (newtiles[tile].variantOf) {
					vedges = newtiles[tile].edges;
					tile = newtiles[tile].variantOf;
				} else {
					vedges = null;
				}

				options = null;
				if (newtiles[tile].edges) {
					/*
						Pick an appropriate portion of the tile depending on what
						the tiles surrounding this one are.

						Build a string to represent the edges, in the order:
							N,E,S,W,NW,NE,SW,SE

						Look for edges on the tile with all 8 characters, then 6,
						then 4 since the kitty corner values may not matter in most
						cases.
					*/
					key = "";

					/* Coords are off by one due to the border */
					edges[0] = tileAt(x + 0 - 1, y - 1 - 1, tile, false, data, newtiles);
					edges[1] = tileAt(x + 1 - 1, y + 0 - 1, tile, false, data, newtiles);
					edges[2] = tileAt(x + 0 - 1, y + 1 - 1, tile, false, data, newtiles);
					edges[3] = tileAt(x - 1 - 1, y + 0 - 1, tile, false, data, newtiles);
					edges[4] = tileAt(x - 1 - 1, y - 1 - 1, tile, false, data, newtiles);
					edges[5] = tileAt(x + 1 - 1, y - 1 - 1, tile, false, data, newtiles);
					edges[6] = tileAt(x - 1 - 1, y + 1 - 1, tile, false, data, newtiles);
					edges[7] = tileAt(x + 1 - 1, y + 1 - 1, tile, false, data, newtiles);

					for (var i = 0; i < edges.length; i++) {
						if (vedges && "1" === vedges.charAt(i)) {
							key += "1";
						} else {
							key += (edges[i] !== tile) ? "1" : "0";
						}
					}

					options =	newtiles[tile].edges[key] ||
								newtiles[tile].edges[key.slice(0, 6)] ||
								newtiles[tile].edges[key.slice(0, 4)] ||
								newtiles[tile].edges["0000"];
				}

				if ((!options || !options.length) && newtiles[tile].options) {
					options = newtiles[tile].options;
				}

				if (options && options.length > 0) {
					/* Pick any one of the available options */
					offsets = options[WRand() % options.length];
				} else {
					/* Pick any tile in the image */
					var src = newtiles[tile].src;

					if (src && !world.images[src]) {
						world.images[src] = loadImage(src);
					}

					img = src ? world.images[src] : null;

					offsets = [
						WRand() % ((img ? img.width  : 0) / TILE_SIZE),
						WRand() % ((img ? img.height : 0) / TILE_SIZE)
					];
				}

				if (newtiles[tile].baseOffset) {
					offsets = [
						offsets[0] + newtiles[tile].baseOffset[0],
						offsets[1] + newtiles[tile].baseOffset[1]
					];
				}

				/*
					Final value we keep for each tile is the tile index, and the
					x and y offset in that tile's image.
				*/
				newareas[name][y][x] = [data[y][x][0], offsets[0], offsets[1]];
			}
		}
	}

	world.areas = newareas;
	world.tiles = newtiles;
}

function loadLevelData(cb)
{
	var tilenames	= Object.keys(world.tiles);
	var count		= 1;
	var src;

	if (!world.images) {
		world.images = {};
	}

	var imageLoaded = function() {
		count--;

		if (0 === count) {
			calculateLevelData();
			cb();
		}
	};

	for (var i = 0, tile; tile = tilenames[i]; i++) {
		if ((src = world.tiles[tile].src)) {
			count++;
			world.images[src] = loadImage(src, imageLoaded);
		}
	}

	/* Final time to account for the extra item in count */
	imageLoaded();
}


