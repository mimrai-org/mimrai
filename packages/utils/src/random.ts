export const randomColor = () => {
	// const hlsColors = [
	// 	"hsla(210, 100%, 20%, 1.00)", // Blue
	// 	"hsl(120, 100%, 20%)", // Green
	// 	"hsl(0, 100%, 20%)", // Red
	// 	"hsl(45, 100%, 20%)", // Yellow
	// 	"hsl(270, 100%, 20%)", // Purple
	// 	"hsl(15, 100%, 20%)", // Orange
	// 	"hsl(180, 100%, 20%)", // Teal
	// 	"hsl(300, 100%, 20%)", // Pink
	// 	"hsl(75, 100%, 20%)", // Lime
	// 	"hsl(195, 100%, 20%)", // Cyan
	// ];

	// return hlsColors[Math.floor(Math.random() * hlsColors.length)];
	return `hsl(${Math.floor(Math.random() * 360)}, 100%, 20%)`;
};
