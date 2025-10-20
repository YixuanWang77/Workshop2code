let catGif;

function preload() 
{
	catGif = loadImage('Cat.gif'); 
}

function setup()
{
	createCanvas(400, 800);
}

function draw()
{
	// Choose mode: "stretch" | "contain" | "cover"
	const mode = "cover";

	background(255,0,0);

	if (!catGif) return;

	if (mode === "stretch") {
		// Fill canvas, may distort
		image(catGif, 0, 0, width, height);
		return;
	}

	// Preserve aspect ratio for contain/cover
	const imgW = catGif.width;
	const imgH = catGif.height;

	const scale = (mode === "contain")
		? Math.min(width / imgW, height / imgH)  // fit inside
		: Math.max(width / imgW, height / imgH); // fill and crop

	const drawW = imgW * scale;
	const drawH = imgH * scale;
	const x = (width - drawW) / 2;
	const y = (height - drawH) / 2;

	image(catGif, x, y, drawW, drawH);
}
