export const randomColor = () => {
	// const hlsColors = [
	// 	"hsla(210, 100%, 20%, 1.00)", // Blue
	// 	"hsl(120, 100%, 20%)", // Green
	// 	"hsl(0, 100%, 20%)", // Red
	// 	"hsl(45, 100%, 20%)", // Yellow
	// 	"hsl(270, 100%, 50%)", // Purple
	// 	"hsl(15, 100%, 20%)", // Orange
	// 	"hsl(180, 100%, 20%)", // Teal
	// 	"hsl(300, 100%, 20%)", // Pink
	// 	"hsl(75, 100%, 20%)", // Lime
	// 	"hsl(195, 100%, 20%)", // Cyan
	// ];

	// return hlsColors[Math.floor(Math.random() * hlsColors.length)];
	return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
};

export const getContrast = (hslColor: string) => {
	const hslMatch = hslColor.match(
		/hsla?\(\s*(\d+),\s*(\d+)%,\s*(\d+)%\s*(?:,\s*([0-9.]+)\s*)?\)/,
	);
	console.log("hslColor", hslColor, hslMatch);
	if (!hslMatch) {
		return getContrastHex(hslColor);
	}

	const h = Number.parseInt(hslMatch[1]!, 10);
	const s = Number.parseInt(hslMatch[2]!, 10) / 100;
	const l = Number.parseInt(hslMatch[3]!, 10) / 100;

	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			let tempT = t;
			if (tempT < 0) tempT += 1;
			if (tempT > 1) tempT -= 1;
			if (tempT < 1 / 6) return p + (q - p) * 6 * tempT;
			if (tempT < 1 / 2) return q;
			if (tempT < 2 / 3) return p + (q - p) * (2 / 3 - tempT) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		r = hue2rgb(p, q, h / 360 + 1 / 3);
		g = hue2rgb(p, q, h / 360);
		b = hue2rgb(p, q, h / 360 - 1 / 3);
	}

	const r255 = Math.round(r * 255);
	const g255 = Math.round(g * 255);
	const b255 = Math.round(b * 255);

	// Calculate luminance
	const luminance = (0.299 * r255 + 0.587 * g255 + 0.114 * b255) / 255;

	return luminance > 0.5 ? "black" : "white";
};

export const getContrastHex = (hexColor: string) => {
	if (!/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) {
		return "black";
	}

	let r: number;
	let g: number;
	let b: number;

	if (hexColor.length === 4) {
		r = Number.parseInt(hexColor[1]! + hexColor[1], 16);
		g = Number.parseInt(hexColor[2]! + hexColor[2], 16);
		b = Number.parseInt(hexColor[3]! + hexColor[3], 16);
	} else if (hexColor.length === 7) {
		r = Number.parseInt(hexColor.slice(1, 3), 16);
		g = Number.parseInt(hexColor.slice(3, 5), 16);
		b = Number.parseInt(hexColor.slice(5, 7), 16);
	} else {
		throw new Error("Invalid HEX color length");
	}

	// Calculate luminance
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	return luminance > 0.5 ? "black" : "white";
};
