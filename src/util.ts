/* pollyfill for requestAnimationFrame */
(function() {
    var lastTime	= 0;
    var vendors		= ['webkit', 'moz'];

    for (var x = 0, vendor; (vendor = vendors[x]) && !window.requestAnimationFrame; x++) {
        window.requestAnimationFrame =
				window[vendor + 'RequestAnimationFrame'];

        window.cancelAnimationFrame =
				window[vendor + 'CancelAnimationFrame'] ||
				window[vendor + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime	= new Date().getTime();
            var timeToCall	= Math.max(0, 16 - (currTime - lastTime));
            var id			= window.setTimeout(function()
				{
					callback(currTime + timeToCall);
				}, timeToCall);

            lastTime = currTime + timeToCall;
            return id;
        } as any;
	}

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
	}
}());

window.addEventListener('load', function() {
	/* Add a class to body if we are on a device that has a touchscreen */
	if ('ontouchstart' in window) {
		document.body.classList.add('touchscreen');
	}
});

function disableSmoothing(ctx)
{
	ctx.mozImageSmoothingEnabled		= false;
	// ctx.webkitImageSmoothingEnabled		= false; /* Chrome gives an annoying warning */
	ctx.msImageSmoothingEnabled			= false;
	ctx.imageSmoothingEnabled			= false;
}

interface ImageLoadedCB {
	(image: HTMLImageElement): void;
}

function loadImage(src: string, cb?: ImageLoadedCB): HTMLImageElement
{
	var img = new Image();

	disableSmoothing(img);

	if (cb) {
		img.onload = function() {
			cb(img);
		};
	}

	img.src = src;
	return(img);
}

interface ImagesLoadedCB {
	(images: HTMLImageElement[]): void;
}

function loadImages(src: string[], cb?: ImagesLoadedCB): void
{
	let loaded	= 0;
	let images	= [];

	for (let i = 0; i < src.length; i++) {
		loadImage(src[i], (img) => {
			loaded++;

			images[i] = img;

			if (loaded === src.length) {
				cb(images);
			}
		});
	}
}

