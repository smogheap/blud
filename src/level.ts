class Level
{
	def:		any;
	area?:		string;
	cake:		any;

	rows?:		any;
	tiles?:		any;
	areas?:		any;
	slide?:		any;

	width?:		number;
	height?:	number;

	images		= {};
	slideFrames	= 30;
	marginX		= TILE_SIZE * 10;
	marginY		= TILE_SIZE * 6;

	viewport	= { x: 0, y: 0, w: 100, h: 100 };
	playerpos	= { x: 0, y: 0 };

	children	= [];
	actors		= [];

	constructor(definition, loadedcb)
	{
		this.def		= definition;

		let tilenames	= Object.keys(this.def.tiles);
		let loadCount	= 1;
		let src;

		let imageLoaded = function()
		{
			loadCount--;

			if (0 === loadCount) {
				/* All images have now been loaded */
				this.prepareLevelData();

				if (loadedcb) {
					loadedcb();
				}
			}
		}.bind(this);

		/* Preload all images for tiles */
		for (let i = 0, tile; tile = tilenames[i]; i++) {
			if ((src = this.def.tiles[tile].src)) {
				loadCount++;
				this.images[src] = loadImage(src, imageLoaded);
			}
		}

		/* Preload all images for actors */
		for (let i = 0, actor; actor = this.def.actors[i]; i++) {
			if ((src = actor.definition.src)) {
				loadCount++;
				this.images[src] = loadImage(src, imageLoaded);
			}
		}

		/* Final time to account for the extra item in count */
		imageLoaded();
	}

	addChild(child)
	{
		if (!child.area) {
			child.area = this.area;
		}
		this.children.push(child);
	}

	resize(w: number, h: number)
	{
		this.viewport.w = w;
		this.viewport.h = h;

		this.scrollTo(true);
	}

	tileAt(x, y, deftile?: any, ignoreVariants?: boolean, rows?: any, tiles?: any)
	{
		let tile;

		rows	= rows	|| this.rows;
		tiles	= tiles	|| this.tiles;

		/*
			this.rows has a border of tiles from the surrounding areas, so the
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

	squareAt(x, y, rows?: any[])
	{
		rows = rows || this.rows;

		/*
			this.rows has a border of tiles from the surrounding areas, so the
			coords are off by one.
		*/
		x++;
		y++;

		if (rows[y]) {
			return(rows[y][x]);
		}

		return(null);
	}

	private loadAreaData(name)
	{
		let rows = [];

		let	c = this.def.areas[name];

		if (!c) {
			return;
		}

		let n = this.def.areas[this.findNearbyArea( 0, -1, name)];
		let e = this.def.areas[this.findNearbyArea( 1,  0, name)];
		let s = this.def.areas[this.findNearbyArea( 0,  1, name)];
		let w = this.def.areas[this.findNearbyArea(-1,  0, name)];
		let row;

		/*
			Build the rows for the current area with a border filled out from the
			surrounding areas.
		*/
		row = [];
		for (let x = -1; x <= c[0].length; x++) {
			let tmp;

			if (n && (tmp = n[n.length - 1].charAt(x))) {
				row.push(tmp);
			} else {
				row.push('-');
			}
		}
		rows.push(row);

		for (let y = 0; y < c.length; y++) {
			row = [];

			row.push(w ? w[y].charAt(w[y].length - 1) : '-');
			for (let x = 0; x < c[y].length; x++) {
				row.push(c[y].charAt(x));
			}
			row.push(e ? e[y].charAt(0) : '-');

			rows.push(row);
		}

		row = [];
		for (let x = -1; x <= c[0].length; x++) {
			let tmp;

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
		The level definition defines each area as an array of strings to make
		them easier to edit by hand, but that isn't very efficent to reference
		while rendering.

		Convert the areas into arrays of arrays of numbers instead, and convert
		the tiles to an indexed array.

		This also gives us a chance to load a border around each area 1 tile
		wide based on the edges of the surrounding areas. This border will not
		be rendered but can be used for collision checking.
	*/
	private prepareLevelData()
	{
		/*
			Insert a dummy value in the tiles array because it is easier to
			check the validity of a tile value with 'if (tile)' than
			'if (!isNaN(tile))'
		*/
		let newtiles:any[]	= [ {} ];
		let newareas		= {};
		let tilenames		= Object.keys(this.def.tiles);
		let areanames		= Object.keys(this.def.areas);
		let tilemap			= {};

		/* Set the seed */
		WRand((new Date()).getTime());

		/* Move the tiles into an indexed array */
		for (let i = 0, tile; tile = tilenames[i]; i++) {
			tilemap[tile] = newtiles.length;
			newtiles.push(this.def.tiles[tile]);
		}

		/* Adjust the variantOf values */
		for (let i = 0; i < newtiles.length; i++) {
			let v;

			if ((v = newtiles[i].variantOf)) {
				newtiles[i].variantOf = tilemap[v];
			}
		}

		for (let a = 0, name; name = areanames[a]; a++) {
			/*
				Convert the area into an array of arrays (from an array of
				strings) and load the border (from surrounding areas).
			*/
			let data	= this.loadAreaData(name);

			/* Replace the tile names with an index */
			for (let y = 0; y < data.length; y++) {
				for (let x = 0; x < data[y].length; x++) {
					data[y][x] = [ tilemap[data[y][x]] ];
				}
			}

			/*
				Calculate the appropriate variant of a tile to used based on the
				tiles surrounding it. This is used for things like edges on
				water/walls etc.
			*/
			let key, edges = [], vedges, options, tile, offsets;

			newareas[name] = [];

			for (let y = 0; y < data.length; y++) {
				newareas[name][y] = [];

				for (let x = 0; x < data[y].length; x++) {
					tile = data[y][x][0];

					/*
						Is this a variant of another tile?

						If so swap it out for that tile, but grab the edges
						string from the variant first.
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
							Pick an appropriate portion of the tile depending on
							what the tiles surrounding this one are.

							Build a string to represent the edges, in the order:
								N,E,S,W,NW,NE,SW,SE

							Look for edges on the tile with all 8 characters,
							then 6, then 4 since the kitty corner values may not
							matter in most cases.
						*/
						key = "";

						/* Coords are off by one due to the border */
						edges[0] = this.tileAt(x + 0 - 1, y - 1 - 1, tile, false, data, newtiles);
						edges[1] = this.tileAt(x + 1 - 1, y + 0 - 1, tile, false, data, newtiles);
						edges[2] = this.tileAt(x + 0 - 1, y + 1 - 1, tile, false, data, newtiles);
						edges[3] = this.tileAt(x - 1 - 1, y + 0 - 1, tile, false, data, newtiles);
						edges[4] = this.tileAt(x - 1 - 1, y - 1 - 1, tile, false, data, newtiles);
						edges[5] = this.tileAt(x + 1 - 1, y - 1 - 1, tile, false, data, newtiles);
						edges[6] = this.tileAt(x - 1 - 1, y + 1 - 1, tile, false, data, newtiles);
						edges[7] = this.tileAt(x + 1 - 1, y + 1 - 1, tile, false, data, newtiles);

						for (let i = 0; i < edges.length; i++) {
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
						let src = newtiles[tile].src;

						let img = src ? this.images[src] : null;

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
						Final value we keep for each tile is the tile index, and
						the x and y offset in that tile's image.
					*/
					newareas[name][y][x] = [data[y][x][0], offsets[0], offsets[1]];
				}
			}
		}

		for (let i = 0; i < newtiles.length; i++) {
			if (newtiles[i].src) {
				newtiles[i].img = this.images[newtiles[i].src];
			}
		}

		this.areas = newareas;
		this.tiles = newtiles;
	}

	findNearbyArea(ox, oy, area?: string)
	{
		let name	= null;

		area = area || this.area;

		for (let y = 0; y < this.def.layout.length; y++) {
			for (let x = 0; x < this.def.layout[y].length; x++) {
				if (this.def.layout[y][x] === area) {
					if (this.def.layout[y + oy] &&
						this.def.layout[y + oy][x + ox]
					) {
						name = this.def.layout[y + oy][x + ox];
					}
					return(name);
				}
			}
		}

		return(null);
	}

	/*
		Determine which area the specified coords are linked to and then switch
		to that area if one is found.

		Keep in mind that this.rows includes a 1 tile border all the way arround
		from the edges of the surrounding areas. Stepping onto that border means
		the player is in the new area.

		The player coords are relative to this area though, not the border, so
		the top left corner is actually -1, -1.
	*/
	switchArea(x, y, player)
	{
		let name;
		let ox = 0;
		let oy = 0;

		switch (typeof x) {
			case 'number':
				if (y < 0) {
					/* Top edge of area */
					oy = -1;
				} else if (y >= this.rows.length - 2) {
					/* Bottom edge of area */
					oy = 1;
				}

				if (x < 0) {
					/* Left edge of area */
					ox = -1;
				} else if (x >= this.rows[0].length - 2) {
					/* Right edge of area */
					ox = 1;
				}

				if (0 === ox && 0 === oy) {
					return(false);
				}
				name = this.findNearbyArea(ox, oy);
				break;

			case 'string':
				name = x;
				break;
		}

		if (!name || !this.areas[name]) {
			return(false);
		}

		/*
			Prepare an image to display containing both the old and new area to
			allow sliding from one to the other.
		*/
		let canvas	= document.createElement('canvas');
		let ctx		= canvas.getContext('2d');

		canvas.setAttribute('width',	'' + (this.viewport.w * (ox === 0 ? 1 : 2)));
		canvas.setAttribute('height',	'' + (this.viewport.h * (oy === 0 ? 1 : 2)));
		disableSmoothing(ctx);

		ctx.save();
		ctx.translate(	ox < 0 ? this.viewport.w : 0,
						oy < 0 ? this.viewport.h : 0);
		this.render(ctx);
		ctx.restore();

		/* Now actually load the new area */
		if (!this.loadArea(name)) {
			return(false);
		}

		/* And position everything properly */
		if (player) {
			if (oy < 0) {
				/* Move player to bottom of new area */
				player.newpos.y = player.y = this.height - 1;
			} else if (oy > 0) {
				/* Move player to top of new area */
				player.newpos.y = player.y = 0;
			}

			if (ox < 0) {
				/* Move player to right edge of new area */
				player.newpos.x = player.x = this.width - 1;
			} else if (ox > 0) {
				/* Move player to left edge of new area */
				player.newpos.x = player.x = 0;
			}

			player.tick();
			this.scrollTo(true,
				(player.x * TILE_SIZE) + player.renderOff.x,
				(player.y * TILE_SIZE) + player.renderOff.y);

			/* The player has moved to the new area */
			player.area = name;
		}

		/* and render the new area to the temporary image */
		ctx.save();
		ctx.translate(	ox > 0 ? this.viewport.w : 0,
						oy > 0 ? this.viewport.h : 0);
		this.render(ctx);
		ctx.restore();

		this.slide = {
			cake:		canvas,
			area:		name,
			player:		player,

			// x:			ox > 0 ? 0 : this.viewport.w,
			// y:			oy > 0 ? 0 : this.viewport.h,
			x:			0,
			y:			0,
			ox:			ox,
			oy:			oy,

			viewport: {
				x:		this.viewport.x,
				y:		this.viewport.y
			}
		};

		/*
			Ensure we have done at least one tick or the slide will not be setup
			properly. Since switchArea is usually called from an actor it is often
			after the level's normal tick.
		*/
		this.tick();

		return(true);
	}

	loadArea(name)
	{
		if (!name || !this.areas[name]) {
			return(false);
		}

		this.rows		= this.areas[name];
		this.area		= name;

		/* Do not include the border in the width/height */
		this.width		= this.rows[0].length - 2;
		this.height		= this.rows.length - 2;

		this.bake();

		/* Load the new set of actors */
		this.actors		= [];

		if (!player) {
			player = new Actor("blud", this.def.actors["blud"], this, name);
		}
		player.area = name;
		this.actors.push(player);

		let ids = Object.keys(this.def.actors);
		for (let i = 0, id; id = ids[i]; i++) {
			let def	= this.def.actors[id];

			if (id === "blud") {
				/* The player was added above */
				continue;
			}

			if (def.area && def.area !== name) {
				continue;
			}

			if (def.area && !isNaN(def.x) && !isNaN(def.y)) {
				this.actors.push(new Actor(id, def, this, name));
			}

			if (def.at) {
				for (let x = 0; x < def.at.length; x++) {
					if (def.at[x].area !== name) {
						continue;
					}

					this.actors.push(new Actor(id, def, this, name, def.at[x].x, def.at[x].y));
				}
			}
		}

		return(true);
	}

	/*
		Adjust the offset to ensure that the specified position (usually the
		player) is visible when the level is rendered.

		coords are in pixels, not tiles.
	*/
	scrollTo(instant, x?: number, y?: number)
	{
		if (this.slide) {
			/* Don't attempt to scroll while the level is sliding a new area in */
			return;
		}

		if (!isNaN(x) && !isNaN(y)) {
			this.playerpos.x = x;
			this.playerpos.y = y;

			/* This will be moved during tick() */
			if (!instant) {
				return;
			}
		} else {
			x = this.playerpos.x;
			y = this.playerpos.y;
		}

		let minX = this.viewport.x + this.marginX;
		let maxX = this.viewport.x + this.viewport.w - this.marginX;
		let minY = this.viewport.y + this.marginY;
		let maxY = this.viewport.y + this.viewport.h - this.marginY;

		// console.log("x:", x, minX, maxX);
		// console.log("y:", y, minY, maxY);

		if (minX < maxX) {
			if (x < minX) {
				if (instant) {
					this.viewport.x -= minX - x;
				} else {
					this.viewport.x--;
				}
			}

			if (x >= maxX) {
				if (instant) {
					this.viewport.x += x - maxX;
				} else {
					this.viewport.x++
				}
			}
		}

		if (minY < maxY) {
			if (y < minY) {
				if (instant) {
					this.viewport.y -= minY - y;
				} else {
					this.viewport.y--;
				}
			}

			if (y >= maxY) {
				if (instant) {
					this.viewport.y += y - maxY;
				} else {
					this.viewport.y++
				}
			}
		}
		// console.log('now at:', this.viewport.x, this.viewport.y);


		if (this.viewport.x < 0) {
			this.viewport.x = 0;
		}
		if (this.viewport.x >= (this.width * TILE_SIZE) - this.viewport.w) {
			this.viewport.x = (this.width * TILE_SIZE) - this.viewport.w;
		}

		if (this.viewport.y < 0) {
			this.viewport.y = 0;
		}
		if (this.viewport.y >= (this.height * TILE_SIZE) - this.viewport.h) {
			this.viewport.y = (this.height * TILE_SIZE) - this.viewport.h;
		}
	}

	/* Build an image containing the entire loaded area */
	bake()
	{
		let canvas	= document.createElement('canvas');
		let ctx		= canvas.getContext('2d');

		canvas.setAttribute('width',	'' + (this.width  * TILE_SIZE));
		canvas.setAttribute('height',	'' + (this.height * TILE_SIZE));
		disableSmoothing(ctx);

		ctx.fillStyle = 'black';

		let square, img;

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (!(square = this.squareAt(x, y))) {
					continue;
				}

				/*
					Use this.tileAt instead of this.squareAt here because it will
					load the variant if needed.
				*/
				img = this.tiles[this.tileAt(x, y)].img;

				if (img) {
					ctx.drawImage(img,
							square[1] * TILE_SIZE,
							square[2] * TILE_SIZE,
							TILE_SIZE, TILE_SIZE,

							TILE_SIZE * x,
							TILE_SIZE * y,
							TILE_SIZE, TILE_SIZE);
				} else {
					ctx.fillRect(
							TILE_SIZE * x,
							TILE_SIZE * y,
							TILE_SIZE, TILE_SIZE);
				}
			}
		}

		this.cake = canvas;
	}

	tick()
	{
		if (this.slide) {
			this.slide.x += this.slide.ox * (this.viewport.w / this.slideFrames);
			this.slide.y += this.slide.oy * (this.viewport.h / this.slideFrames);

			/*
				The viewport is used for rendering the actors at the correct
				position, so it needs to be updated during the slide.
			*/
			this.viewport.x = this.slide.viewport.x + this.slide.x;
			this.viewport.y = this.slide.viewport.y + this.slide.y;

			if (Math.abs(this.slide.x) >= this.viewport.w ||
				Math.abs(this.slide.y) >= this.viewport.h
			) {
				/* done */
				let player = this.slide.player;

				this.area = this.slide.area;
				this.slide = null;

				if (player) {
					this.scrollTo(true,
						(player.x * TILE_SIZE) + player.renderOff.x,
						(player.y * TILE_SIZE) + player.renderOff.y);
				}
			} else {
				/* Nothing else should be active while the slide is in progress */
				return(false);
			}
		}

		this.scrollTo(false);

		/* Update the children (NPCs, other non-static objects) */
		for (let c = 0, child; child = this.children[c]; c++) {
			if (child.player || !child.area || child.area === this.area) {
				child.tick();
			}
		}

		for (let c = 0, child; child = this.actors[c]; c++) {
			if (child.player || !child.area || child.area === this.area) {
				if (!editor || child === player) {
					child.tick();
				}
			}
		}

		return(true);
	}

	render(ctx)
	{
		if (this.slide) {
			/* Sliding from one area to another */
			let x = Math.abs(this.slide.ox) * Math.floor(this.slide.x);
			let y = Math.abs(this.slide.oy) * Math.floor(this.slide.y);

			if (x < 0) {
				x += this.viewport.w;
			}
			if (y < 0) {
				y += this.viewport.h;
			}

			ctx.drawImage(this.slide.cake,
				x, y,
				this.viewport.w, this.viewport.h,
				0, 0,
				this.viewport.w, this.viewport.h);
		} else if (this.cake) {
			/* Here is one I prepared earlier... */
			ctx.drawImage(this.cake,
				this.viewport.x, this.viewport.y,
				this.viewport.w, this.viewport.h,
				0, 0,
				this.viewport.w, this.viewport.h);

			/* Draw the children (NPCs, other non-static objects) */
			for (let c = 0, child; child = this.children[c]; c++) {
				if (!child.area || child.area === this.area) {
					child.render(ctx, this.viewport.x, this.viewport.y);
				}
			}

			for (let c = 0, child; child = this.actors[c]; c++) {
				if (!child.area || child.area === this.area) {
					if (!editor || child === player) {
						child.render(ctx, this.viewport.x, this.viewport.y);
					}
				}
			}
		}
	}
}

