function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const cleaned = hex.replace("#", "");
	const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
	const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
	const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l: l * 100 };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Reads the border-color of a themed button class directly from the loaded
 * processed.css stylesheet rules. No DOM elements are created.
 */
export function getThemeButtonBorderColor(
	btnClass: string,
	fallback: string,
): string {
	const selector = `.theme-container .btn.${btnClass}`;
	for (const sheet of document.styleSheets) {
		try {
			for (const rule of sheet.cssRules) {
				if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
					const border = rule.style.getPropertyValue("border");
					const match = border.match(/#[0-9a-fA-F]{6}/);
					if (match) return match[0];
				}
			}
		} catch {
			// Skip cross-origin stylesheets
		}
	}
	return fallback;
}

/**
 * Derives a dark stroke/back color from a front color.
 * Same hue, desaturate by 9, darken by 38.
 */
export function deriveDarkerThemeColor(hex: string): string {
	const { h, s, l } = hexToHsl(hex);
	return hslToHex(h, Math.max(0, s - 9), Math.max(0, l - 38));
}
