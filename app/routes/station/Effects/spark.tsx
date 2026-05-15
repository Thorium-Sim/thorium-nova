import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useEffect, useRef } from "react";

import SimplexNoise from "./simplexNoise";

/**
 * Vector
 */
class Vector {
	constructor(
		public x = 0,
		public y = 0,
	) {}
	static sub(a: Vector, b: Vector) {
		return new Vector(a.x - b.x, a.y - b.y);
	}
	sub(v: Vector) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	static add(a: Vector, b: Vector) {
		return new Vector(a.x + b.x, a.y + b.y);
	}
	add(v: Vector) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	set(x: number | Vector, y?: number) {
		if (typeof x === "object") {
			y = x.y;
			x = x.x;
		}
		this.x = x || 0;
		this.y = y || 0;
		return this;
	}

	scale(s: number) {
		this.x *= s;
		this.y *= s;
		return this;
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalize() {
		const len = Math.sqrt(this.x * this.x + this.y * this.y);
		if (len) {
			this.x /= len;
			this.y /= len;
		}
		return this;
	}

	angle() {
		return Math.atan2(this.y, this.x);
	}

	distanceTo(v: Vector) {
		const dx = v.x - this.x;
		const dy = v.y - this.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	distanceToSq(v: Vector) {
		const dx = v.x - this.x;
		const dy = v.y - this.y;
		return dx * dx + dy * dy;
	}

	clone() {
		return new Vector(this.x, this.y);
	}
}

/**
 * Lightning
 */
class Lightning {
	color = "rgba(200,200, 255, 1)";
	speed = 0.05;
	amplitude = 2;
	lineWidth = 6;
	blur = 100;
	blurColor = "128, 128, 255";
	points: Vector[] = [];
	off = 0;
	// @ts-expect-error
	// oxlint-disable-next-line typescript/no-redundant-type-constituents
	_simplexNoise: SimplexNoise | null = new SimplexNoise();
	_timeoutId: ReturnType<typeof setTimeout> | null = null;
	// Case by child
	parent: Lightning | null = null;
	startStep = 0;
	endStep = 0;
	children: Lightning[] = [];

	constructor(
		public startPoint = new Vector(),
		public endPoint = new Vector(),
		public step = 45,
	) {}
	length() {
		return this.startPoint.distanceTo(this.endPoint);
	}

	setChildNum(num: number) {
		const children = this.children;
		let child: Lightning;
		let i: number;

		const len = this.children.length;

		if (len > num) {
			for (i = num; i < len; i++) {
				children[i].dispose();
			}
			children.splice(num, len - num);
		} else {
			for (i = len; i < num; i++) {
				child = new Lightning();
				child._setAsChild(this);
				children.push(child);
			}
		}
	}

	update() {
		const startPoint = this.startPoint;
		const endPoint = this.endPoint;

		if (this.parent) {
			if (this.endStep > this.parent.step) {
				this._updateStepsByParent();
			}

			startPoint.set(this.parent.points[this.startStep]);
			endPoint.set(this.parent.points[this.endStep]);
		}

		const length = this.length();
		const normal = Vector.sub(endPoint, startPoint)
			.normalize()
			.scale(length / this.step);
		const radian = normal.angle();
		const sinv = Math.sin(radian);
		const cosv = Math.cos(radian);

		this.points = [];
		const points = this.points;
		this.off += random(this.speed, this.speed * 0.2);
		const off = this.off;
		let waveWidth = (this.parent ? length * 1.5 : length) * this.amplitude;
		if (waveWidth > 750) waveWidth = 750;

		for (let i = 0, len = this.step + 1; i < len; i++) {
			const n = i / 60;
			const av = waveWidth * this._noise(n - off) * 0.5;
			const ax = sinv * av;
			const ay = cosv * av;

			const bv = waveWidth * this._noise(n + off) * 0.5;
			const bx = sinv * bv;
			const by = cosv * bv;

			const m = Math.sin(Math.PI * (i / (len - 1)));

			const x = startPoint.x + normal.x * i + (ax - bx) * m;
			const y = startPoint.y + normal.y * i - (ay - by) * m;

			points.push(new Vector(x, y));
		}

		const children = this.children;

		for (let i = 0, len = children.length; i < len; i++) {
			const child = children[i];
			child.color = this.color;
			child.speed = this.speed * 1.35;
			child.amplitude = this.amplitude;
			child.lineWidth = this.lineWidth * 0.75;
			child.blur = this.blur;
			child.blurColor = this.blurColor;
			children[i].update();
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		const points = this.points;
		const children = this.children;
		// Blur
		const drawBlur = () => {
			for (let i = 0, len = points.length; i < len; i++) {
				const p = points[i];
				const d = len > 1 ? p.distanceTo(points[i === len - 1 ? i - 1 : i + 1]) : 0;
				ctx.moveTo(p.x + d, p.y);
				ctx.arc(p.x, p.y, d, 0, Math.PI * 2, false);
			}
		};
		if (this.blur) {
			ctx.save();
			ctx.globalCompositeOperation = "lighter";
			ctx.fillStyle = "rgba(0,0,0,1)";
			ctx.shadowBlur = this.blur;
			ctx.shadowColor = `rgb(${this.blurColor})`;
			ctx.beginPath();
			drawBlur();
			ctx.fill();
			ctx.globalCompositeOperation = "lighter";
			ctx.fillStyle = `rgba(${this.blurColor},0.1)`;
			ctx.shadowBlur = 0;
			ctx.beginPath();
			drawBlur();
			ctx.fill();
			ctx.restore();
		}

		ctx.save();
		ctx.lineWidth = random(this.lineWidth, 0.5);
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		for (let i = 0, len = points.length; i < len; i++) {
			const p = points[i];
			ctx[i === 0 ? "moveTo" : "lineTo"](p.x, p.y);
		}
		ctx.stroke();
		ctx.restore();
		ctx.closePath();
		// Draw children
		for (let i = 0, len = this.children.length; i < len; i++) {
			children[i].draw(ctx);
		}
	}

	dispose() {
		if (this._timeoutId) {
			clearTimeout(this._timeoutId);
		}
		this._simplexNoise = null;
	}

	_noise(v: number) {
		const octaves = 6;
		const fallout = 0.5;
		let amp = 1;
		let f = 1;
		let sum = 0;
		let i: number;

		if (!this._simplexNoise) {
			return 0;
		}
		for (i = 0; i < octaves; ++i) {
			amp *= fallout;
			sum += amp * (this._simplexNoise.noise2D(v * f, 0) + 1) * 0.5;
			f *= 2;
		}

		return sum;
	}

	_setAsChild(lightning: Lightning) {
		this.parent = lightning;

		const setTimer = () => {
			this._updateStepsByParent();
			this._timeoutId = setTimeout(setTimer, randint(1500));
		};

		this._timeoutId = setTimeout(setTimer, randint(1500));
	}

	_updateStepsByParent() {
		if (!this.parent) return;
		const parentStep = this.parent.step;
		this.startStep = randint(parentStep - 2);
		this.endStep = this.startStep + randint(parentStep - this.startStep - 2) + 2;
		this.step = this.endStep - this.startStep;
	}
}

// Helpers

function random(max: number, min?: number) {
	if (typeof max !== "number") {
		return Math.random();
	}
	if (typeof min !== "number") {
		min = 0;
	}
	return Math.random() * (max - min) + min;
}

function randint(max: number, min?: number) {
	if (!max) return 0;
	return random(max + 1, min) | 0;
}

// Initialize
export default function Spark() {
	const ref = useRef<HTMLCanvasElement>(null);
	const lightningRef = useRef(new Lightning());
	const counterRef = useRef(0);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	useEffect(() => {
		if (!ref.current) return;
		ref.current.width = window.innerWidth;
		ref.current.height = window.innerHeight;
		ctxRef.current = ref.current.getContext("2d");

		lightningRef.current.startPoint.set(
			random(window.innerWidth, 0),
			random(window.innerHeight, 0),
		);
		lightningRef.current.endPoint.set(random(window.innerWidth, 0), random(window.innerHeight, 0));
		lightningRef.current.setChildNum(3);
	}, []);
	useAnimationFrame(() => {
		if (!ref.current || !ctxRef.current) return;
		const canvasContext = ctxRef.current;
		const lightning = lightningRef.current;

		canvasContext.save();
		canvasContext.clearRect(0, 0, ref.current.width, ref.current.height);
		canvasContext.restore();

		lightning.step = Math.ceil(lightning.length() / 10);
		if (lightning.step < 5) lightning.step = 5;

		lightning.update();
		lightning.draw(canvasContext);

		if (counterRef.current > Math.random() * 300 + 30) {
			counterRef.current = 0;
			lightningRef.current.startPoint.set(
				random(window.innerWidth, 0),
				random(window.innerHeight, 0),
			);
			lightningRef.current.endPoint.set(
				random(window.innerWidth, 0),
				random(window.innerHeight, 0),
			);
		}
		counterRef.current++;
	});

	return (
		<canvas
			ref={ref}
			style={{
				zIndex: 10000,
				position: "fixed",
				top: "0px",
				left: "0px",
			}}
		/>
	);
}
