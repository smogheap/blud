class Level
{

def:		any;
area?:		string;
cake:		any;
cakeCtx:	any;

rows?:		any;
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

tileset		= null;

constructor(definition, loadedcb)
{
	this.def		= definition;

	let loadCount	= 1;
	let src;

	let imageLoaded = function()
	{
		loadCount--;

		if (0 === loadCount) {
			console.log('Level loaded');

			/* All images have now been loaded */
			this.prepareLevelData();

			if (loadedcb) {
				loadedcb();
			}
		}
	}.bind(this);

	/* Load the tileset */
	loadCount++;
	this.tileset = new TileSet('main', imageLoaded);

	/* Preload all images for actors */
	for (let i = 0, actor; actor = this.def.actors[i]; i++) {
		if ((src = actor.definition.src)) {
			loadCount++;
			this.images[src] = loadImage(src, imageLoaded);
		}
	}

	console.log(`Loading level with ${loadCount} resources`);

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

/* Return the index of the tile at the specified position in this area */
indexAt(x: number, y: number, deftile?: number): number
{
	let tile;

	if (isNaN(deftile)) {
		deftile = -1;
	}

	/*
		this.rows has a border of tiles from the surrounding areas, so the
		coords are off by one.
	*/
	if (!this.rows[y - 1] || isNaN(tile = this.rows[y - 1][x - 1])) {
		return(deftile);
	}

	return(tile);
}

tileAt(x: number, y: number)
{
	let tile = this.indexAt(x, y, -1);

	return(this.tileset.tiles[tile]);
}

setTile(x: number, y: number, tile: number)
{
	if (isNaN(tile) || tile < 0) {
		return;
	}

	/*
		this.rows has a border of tiles from the surrounding areas, so the
		coords are off by one.
	*/
	this.rows[y - 1][x - 1] = tile;

	/*
		The tiles around this one need to be redrawn as well because they may
		now have different edge data.
	*/
	for (let y2 = y - 1; y2 <= y + 1; y2++) {
		for (let x2 = x - 1; x2 <= x + 1; x2++) {
			this.bakeTile(this.cakeCtx, x2, y2);
		}
	}
}

solidAt(x, y)
{
	let tile;

	if ((tile = this.tileAt(x, y))) {
		return(tile.solid);
	}

	/*
		If there is no tile then consider it solid to prevent going out of
		bounds.
	*/
	return(true);
}

private loadAreaData(name)
{
	let rows = [];
	let tmp;

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
		The first row is built using the last row of data from the area to the
		north of this area.
	*/
	row = [];
	for (let x = -1; x <= c[0].length; x++) {
		if (n && n.length > 0 && !isNaN(tmp = n[n.length - 1][x])) {
			row.push(tmp);
		} else {
			row.push(-1);
		}
	}
	rows.push(row);

	/*
		Most of the rows are built with the data from this area with one extra
		tile at the start and end from the areas to the west and east.
	*/
	for (let y = 0; y < c.length; y++) {
		row = [];

		if (w && w.length > y) {
			row.push(w[y][w[y].length - 1]);
		} else {
			row.push(-1);
		}

		for (let x = 0; x < c[y].length; x++) {
			row.push(c[y][x]);
		}

		if (e && e.length > y) {
			row.push(e[y][0]);
		} else {
			row.push(-1);
		}

		rows.push(row);
	}

	/*
		The last row is built using the first row of data from the area to the
		south of this area.
	*/
	row = [];
	for (let x = -1; x <= c[0].length; x++) {
		if (s && s.length > 0 && !isNaN(tmp = s[0][x])) {
			row.push(tmp);
		} else {
			row.push(-1);
		}
	}
	rows.push(row);

	return(rows);
}

/*
	Load the level data, and insert an extra tile border all the way around
	using data from the surrounding areas. This border will not be rendered but
	can be used for collision checks.
*/
private prepareLevelData()
{
	let newareas		= {};
	let areanames		= Object.keys(this.def.areas);
	let tilemap			= {};

	for (let a = 0, name; name = areanames[a]; a++) {
		/* Insert the border from the surrounding areas */
		newareas[name] = this.loadAreaData(name);
	}

	this.areas = newareas;
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

bakeTile(ctx, x: number, y: number)
{
	let tile;

	if (!(tile = this.tileAt(x, y))) {
		return;
	}
	let idx = this.indexAt(x, y);

	/*
		Calculate the appropriate variant of the tile to be used based
		on the tiles surrounding it, if this tile supports it.
	*/
	if (tile.edges) {
		let edges = [
			idx !== this.indexAt(x + 0, y - 1),
			idx !== this.indexAt(x + 1, y + 0),
			idx !== this.indexAt(x + 0, y + 1),
			idx !== this.indexAt(x - 1, y + 0),
			idx !== this.indexAt(x - 1, y - 1),
			idx !== this.indexAt(x + 1, y - 1),
			idx !== this.indexAt(x - 1, y + 1),
			idx !== this.indexAt(x + 1, y + 1)
		];

		tile.render(ctx, x, y, edges);
	} else {
		tile.render(ctx, x, y, null);
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

	for (let y = -1; y <= this.height; y++) {
		for (let x = -1; x <= this.width; x++) {
			this.bakeTile(ctx, x, y);
		}
	}

	this.cake		= canvas;
	this.cakeCtx	= ctx;
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

} /* End level class */

