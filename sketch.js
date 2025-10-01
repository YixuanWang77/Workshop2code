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
	background(255,0,0);
	image(catGif, 0, 0);
}
