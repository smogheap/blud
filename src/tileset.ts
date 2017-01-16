enum TileKind
{
	floor		= 1,	/* Can be walked on								*/
	wall,				/* Solid										*/
	water,				/* Plasma/water									*/
	ladder				/* Treated like floor but with slower animation	*/
}

class Tile
{
	kind:		TileKind;
	solid:		boolean;
	img?:		HTMLImageElement;

	offset:		coord;
	options?:	coord[];

	edges:		{ [key: string]: coord[]; };

	constructor(options)
	{
		this.kind		= options.kind		|| TileKind.floor;
		this.offset		= options.offset	|| [ 0, 0 ];
		this.options	= options.options	|| [];
		this.edges		= options.edges		|| null;

		switch (this.kind) {
			default:
			case TileKind.floor:
			case TileKind.ladder:
				this.solid = false;
				break;

			case TileKind.wall:
			case TileKind.water:
				this.solid = true;
				break;
		}

		if (options.img) {
			this.img	= options.img;
		} else if (options.src) {
			loadImage(options.src, (img) => {
				this.img = img;
			});
		}
	}

	render(ctx, x: number, y: number, edges?: boolean[])
	{
		let options	= null;
		let option;
		let sx, sy;

		/* Find the appropriate version based on the edge data */
		if (edges && this.edges) {
			/*
				Pick an appropriate portion of the tile depending on what the
				tiles surrounding this one are.

				Build a string to represent the edges, in the order:
					N,E,S,W,NW,NE,SW,SE

				Look for edges on the tile with all 8 characters, then 6, then 4
				since the kitty corner values may not matter in most cases.

				Building this key and using it is slow, but tile render is only
				used when an area is being baked and NOT every frame so it is
				okay.
			*/
			let key = "";

			for (let i = 0; i < edges.length; i++) {
				key += edges[i] ? "1" : "0";
			}

			options =	this.edges[key] ||
						this.edges[key.slice(0, 6)] ||
						this.edges[key.slice(0, 4)] ||
						this.edges["0000"];
		}

		if (!options || 0 === options.length) {
			options	= this.options || [[ 0, 0 ]];
		}

		if (options.length > 1) {
			option = options[WRand() % options.length];
		} else {
			option = options[0];
		}

		option = option || [ 0, 0 ];

		sx = this.offset[0] + option[0];
		sy = this.offset[1] + option[1];

		if (this.img) {
			ctx.drawImage(this.img,
					sx * TILE_SIZE, sy * TILE_SIZE,
					TILE_SIZE, TILE_SIZE,

					TILE_SIZE * x, TILE_SIZE * y,
					TILE_SIZE, TILE_SIZE);
		} else {
			ctx.fillRect(
					TILE_SIZE * x,
					TILE_SIZE * y,
					TILE_SIZE, TILE_SIZE);
		}
	}
} /* end Tile class */

class TileSet
{
	tiles:		Tile[]	= [];
	width:		number	= 0;
	height:		number	= 0;

	private images		= [];

	// TODO Show a dialog to select a tile...

	constructor(name, cb)
	{
		// TODO Find a good way to provide extra detail about the tileset. There
		//		are lots of hardcoded things for the main tileset right now.

		loadImages([
			"tilesets/" + name + "/tiles.png",
			"tilesets/" + name + "/plasma.png"
		], ((images: HTMLImageElement[]) => {
			this.images = images;
			this.tiles = [];

			let image	= images[0];
			let plasma	= images[1];

			/*
				Load the tiles starting in the top left, going to the right and
				wrapping when the edge is reached.

				This allows adding additional tiles to the bottom of the image
				without changing the indexes.
			*/
			this.width	= image.width	/ TILE_SIZE;
			this.height	= image.height	/ TILE_SIZE;

			for (let y = 0; y < this.height; y++) {
				for (let x = 0; x < this.width; x++) {
					/* Most tiles in this tileset are walls */
					let kind	= TileKind.wall;

					if (x == 0 && y == 5) {
						/* Special case tile for plasma/water with edge definitions */
						this.tiles.push(new Tile({
							offset:		[ 0, 0 ],
							img:		plasma,
							kind:		TileKind.water,

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
								"0101": [ [ 2, 0 ] ],
								"1010": [ [ 0, 2 ] ],

								/* Edge on a single side */
								"1000": [ [ 2, 1 ] ],
								"0100": [ [ 4, 3 ] ],
								"0010": [ [ 3, 4 ] ],
								"0001": [ [ 1, 2 ] ],

								/* No edges */
								"0000": [ [ 2, 2 ], [ 2, 3 ], [ 3, 2 ], [ 3, 3 ] ]
							}

						}));
						continue;
					} else if (y == 5) {
						/* The bottom row (aside from the far left) is not solid */
						// TODO Do something about the other tiles that look like ground
						//		in this tileset...
						kind = TileKind.floor;
					}

					this.tiles.push(new Tile({
						offset:		[ x, y ],
						img:		image,
						kind:		kind
					}));
				}
			}

			if (cb) {
				cb();
			}
		}).bind(this));
	}

	pick(options?: DialogOptions)
	{
		if (!options) {
			options = {
				msg: "Pick a tile"
			};
		}

		/* Include an extra 6 pixels on all sides for the border */
		options.width  = this.images[0].width  + 12;
		options.height = this.images[0].height + 12;

		options.inputcb = ((dialog: Dialog) => {
			if (input.getButton(input.BACK, true) & input.PRESSED) {
				dialog.selected = -1;
				dialog.close();
			}

			if (input.getButton(input.CONTINUE, true) & input.PRESSED) {
				dialog.close();
			}

			let dirs = input.getDirection(true);

			if (dirs[input.N] & input.PRESSED) {
				dialog.selected -= this.width;
			}

			if (dirs[input.E] & input.PRESSED) {
				dialog.selected++;
			}

			if (dirs[input.S] & input.PRESSED) {
				dialog.selected += this.width;
			}

			if (dirs[input.W] & input.PRESSED) {
				dialog.selected--;
			}

			while (dialog.selected < 0) {
				dialog.selected += this.width * this.height;
			}

			while (dialog.selected >= this.width * this.height) {
				dialog.selected -= this.width * this.height;
			}
		}).bind(this);

		options.drawcb = ((dialog: Dialog, ctx: CanvasRenderingContext2D) => {
			drawBorder(ctx, 0, 0,
				ctx.canvas.width, ctx.canvas.height, '#666666');

			let x = TILE_SIZE * ((dialog.selected) % this.width);
			let y = TILE_SIZE * (Math.floor(dialog.selected / this.width));

			/* Draw the base image with all the tiles */
			ctx.drawImage(this.images[0], 6, 6);

			/* Draw a border as a selection indicator */
			drawBorder(ctx, x, y,
				TILE_SIZE + 12, TILE_SIZE + 12);

			/* Redraw the tile that the border wrote over */
			ctx.drawImage(this.images[0],
				x + 0, y + 0, TILE_SIZE, TILE_SIZE,
				x + 6, y + 6, TILE_SIZE, TILE_SIZE);

		}).bind(this);

		return(Ask(options));
	}
}

