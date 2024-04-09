import * as React from "react";
import type {
	Coordinates,
	BoundCoordinates,
	TransformationParameters,
	TransformationMatrix,
} from "./math";
import {
	TransformMatrix,
	getTransformedBoundingBox,
	getScaleMultiplier,
	boundCoordinates,
} from "./math";

export const preventDefault = (e: Event) => {
	e.preventDefault();
};

export const captureTextSelection = () => {
	window.addEventListener("selectstart", preventDefault);
};

export const releaseTextSelection = () => {
	window.removeEventListener("selectstart", preventDefault);
};

type OnStateChangeData = {
	x: number;
	y: number;
	scale: number;
	angle: number;
};

type Props = {
	children: React.ReactNode;
	zoomSpeed: number;
	doubleZoomSpeed: number;
	disabled?: boolean;
	autoCenter?: boolean;
	autoCenterZoomLevel?: number;
	disableKeyInteraction?: boolean;
	disableDoubleClickZoom?: boolean;
	disableScrollZoom?: boolean;
	realPinch?: boolean;
	keyMapping?: { [key: string]: { x: number; y: number; z: number } };
	minZoom: number;
	maxZoom: number;
	preventPan: (
		event:
			| React.MouseEvent<HTMLDivElement>
			| React.TouchEvent<HTMLDivElement>
			| MouseEvent,
		x: number,
		y: number,
	) => boolean;
	noStateUpdate: boolean;
	boundaryRatioVertical: number;
	boundaryRatioHorizontal: number;
	enableBoundingBox?: boolean;
	style?: any;
	className?: string;
	initialX?: number;
	initialY?: number;

	onPanStart?: (event: any) => void;
	onPan?: (event: any) => void;
	onPanEnd?: (event: any) => void;
	onStateChange?: (data: OnStateChangeData) => void;
	onDoubleClick?: (event: any) => void;
	onMouseDown?: (event: any) => void;
	onKeyDown?: (event: any) => void;
	onKeyUp?: (event: any) => void;
	onTouchStart?: (event: any) => void;
};

type State = {
	x: number;
	y: number;
	scale: number;
	angle: number;
};

const getTransformMatrixString = (
	transformationMatrix: TransformationMatrix,
) => {
	const { a, b, c, d, x, y } = transformationMatrix;
	return `matrix(${a}, ${b}, ${c}, ${d}, ${x}, ${y})`;
};

class PanZoom extends React.Component<Props, State> {
	static defaultProps = {
		zoomSpeed: 1,
		doubleZoomSpeed: 1.75,
		disabled: false,
		minZoom: 0,
		maxZoom: Number.POSITIVE_INFINITY,
		noStateUpdate: true,
		boundaryRatioVertical: 0.8,
		boundaryRatioHorizontal: 0.8,
		disableDoubleClickZoom: false,
		disableScrollZoom: false,
		preventPan: () => false,
		initialX: 0,
		initialY: 0,
	};

	container = React.createRef<HTMLDivElement>();
	dragContainer = React.createRef<HTMLDivElement>();

	mousePos = {
		x: 0,
		y: 0,
	};
	panning = false;
	touchInProgress = false;
	panStartTriggered = false;

	pinchZoomLength = 0;

	prevPanPosition = {
		x: 0,
		y: 0,
	};

	frameAnimation: number | null = null;
	intermediateFrameAnimation: number | null = null;

	transformMatrixString = `matrix(1, 0, 0, 1, 0, 0)`;
	intermediateTransformMatrixString = `matrix(1, 0, 0, 1, 0, 0)`;

	state: State = {
		x: this.props.initialX || 0,
		y: this.props.initialY || 0,
		scale: 1,
		angle: 0,
	};

	componentDidMount(): void {
		const { autoCenter, autoCenterZoomLevel, minZoom, maxZoom } = this.props;

		if (this.container.current) {
			this.container.current.addEventListener("wheel", this.onWheel, {
				passive: false,
			});
		}

		if (maxZoom < minZoom) {
			throw new Error("[PanZoom]: maxZoom props cannot be inferior to minZoom");
		}
		if (autoCenter) {
			this.autoCenter(autoCenterZoomLevel, false);
		}
		if (this.props.onStateChange) {
			this.props.onStateChange({
				x: this.state.x,
				y: this.state.y,
				scale: this.state.scale,
				angle: this.state.angle,
			});
		}

		const {
			a,
			b,
			c,
			d,
			x: transformX,
			y: transformY,
		} = this.getTransformMatrix(
			this.state.x,
			this.state.y,
			this.state.scale,
			this.state.angle,
		);
		const { boundX, boundY } = this.getBoundCoordinates(
			{ x: transformX, y: transformY },
			{
				angle: this.state.angle,
				scale: this.state.scale,
				offsetX: this.state.x,
				offsetY: this.state.y,
			},
		);
		this.transformMatrixString = getTransformMatrixString({
			a,
			b,
			c,
			d,
			x: boundX,
			y: boundY,
		});

		this.frameAnimation = window.requestAnimationFrame(this.applyTransform);
	}

	componentDidUpdate(prevProps: Props, prevState: State): void {
		if (
			prevProps.autoCenter !== this.props.autoCenter &&
			this.props.autoCenter
		) {
			this.autoCenter(this.props.autoCenterZoomLevel);
		}
		if (
			(prevState.x !== this.state.x ||
				prevState.y !== this.state.y ||
				prevState.scale !== this.state.scale ||
				prevState.angle !== this.state.angle) &&
			this.props.onStateChange
		) {
			this.props.onStateChange({
				x: this.state.x,
				y: this.state.y,
				scale: this.state.scale,
				angle: this.state.angle,
			});
		}
	}

	componentWillUnmount(): void {
		this.cleanMouseListeners();
		this.cleanTouchListeners();
		releaseTextSelection();
		if (this.container.current) {
			this.container.current.removeEventListener("wheel", this.onWheel);
		}
	}

	onDoubleClick = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
		const { onDoubleClick, disableDoubleClickZoom, doubleZoomSpeed } =
			this.props;

		if (typeof onDoubleClick === "function") {
			onDoubleClick(e);
		}

		if (disableDoubleClickZoom) {
			return;
		}

		const offset = this.getOffset(e);
		this.zoomTo(offset.x, offset.y, doubleZoomSpeed);
	};

	onMouseDown = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
		const { preventPan, onMouseDown } = this.props;

		if (typeof onMouseDown === "function") {
			onMouseDown(e);
		}

		if (this.props.disabled) {
			return;
		}

		// Touch events fire mousedown on modern browsers, but it should not
		// be considered as we will handle touch event separately
		if (this.touchInProgress) {
			e.stopPropagation();
			return false;
		}

		const isLeftButton =
			(e.button === 1 && window.event !== null) || e.button === 0;
		if (!isLeftButton) {
			return;
		}

		const offset = this.getOffset(e);

		// check if there is nothing preventing the pan
		if (preventPan?.(e, offset.x, offset.y)) {
			return;
		}

		this.mousePos = {
			x: offset.x,
			y: offset.y,
		};

		// keep the current pan value in memory to allow noStateUpdate panning
		this.prevPanPosition = {
			x: this.state.x,
			y: this.state.y,
		};

		this.panning = true;

		this.setMouseListeners();

		// Prevent text selection
		captureTextSelection();
	};

	onMouseMove = (e: MouseEvent) => {
		if (this.panning) {
			const { noStateUpdate } = this.props;

			// TODO disable if using touch event

			this.triggerOnPanStart(e);

			const offset = this.getOffset(e);
			const dx = offset.x - this.mousePos.x;
			const dy = offset.y - this.mousePos.y;

			this.mousePos = {
				x: offset.x,
				y: offset.y,
			};

			this.moveBy(dx, dy, noStateUpdate);
			this.triggerOnPan(e);
		}
	};

	onMouseUp = (e: MouseEvent) => {
		const { noStateUpdate } = this.props;

		// if using noStateUpdate we still need to set the new values in the state
		if (noStateUpdate) {
			this.setState({ x: this.prevPanPosition.x, y: this.prevPanPosition.y });
		}

		this.triggerOnPanEnd(e);
		this.cleanMouseListeners();
		this.panning = false;
		releaseTextSelection();
	};

	onWheel = (e: WheelEvent) => {
		const { disableScrollZoom, disabled, zoomSpeed, noStateUpdate } =
			this.props;
		if (disableScrollZoom || disabled) {
			return;
		}
		if (e.metaKey || e.ctrlKey) {
			const scale = getScaleMultiplier(e.deltaY, zoomSpeed);
			const offset = this.getOffset(e);
			this.zoomTo(offset.x, offset.y, scale);
		} else {
			const dx = e.deltaX * -1;
			const dy = e.deltaY * -1;
			this.moveBy(dx, dy, noStateUpdate);
			this.triggerOnPan(e);
		}
		e.preventDefault();
	};

	onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const { keyMapping, disableKeyInteraction, onKeyDown } = this.props;

		if (typeof onKeyDown === "function") {
			onKeyDown(e);
		}

		if (disableKeyInteraction) {
			return;
		}

		const keys = {
			ArrowUp: { x: 0, y: -1, z: 0 }, // up
			ArrowDown: { x: 0, y: 1, z: 0 }, // down
			ArrowLeft: { x: -1, y: 0, z: 0 }, // left
			ArrowRight: { x: 1, y: 0, z: 0 }, // right
			"-": { x: 0, y: 0, z: 1 }, // zoom out
			"=": { x: 0, y: 0, z: -1 }, // zoom in
			"+": { x: 0, y: 0, z: -1 }, // zoom in
			...keyMapping,
		};
		const key = e.key as keyof typeof keys;
		const mappedCoords = keys[key];
		if (mappedCoords) {
			const { x, y, z } = mappedCoords;
			e.preventDefault();
			e.stopPropagation();

			if ((x || y) && this.container.current) {
				const containerRect = this.container.current.getBoundingClientRect();
				const offset = Math.min(containerRect.width, containerRect.height);
				const moveSpeedRatio = 0.05;
				const dx = offset * moveSpeedRatio * x;
				const dy = offset * moveSpeedRatio * y;

				this.moveBy(dx, dy);
			}

			if (z) {
				this.centeredZoom(z);
			}
		}
	};

	onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const { disableKeyInteraction, onKeyDown } = this.props;

		if (typeof onKeyDown === "function") {
			onKeyDown(e);
		}

		if (disableKeyInteraction) {
			return;
		}

		if (
			this.prevPanPosition &&
			(this.prevPanPosition.x !== this.state.x ||
				this.prevPanPosition.y !== this.state.y)
		) {
			this.setState({ x: this.prevPanPosition.x, y: this.prevPanPosition.y });
		}
	};

	onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		const { preventPan, onTouchStart, disabled } = this.props;
		if (typeof onTouchStart === "function") {
			onTouchStart(e);
		}

		if (disabled) {
			return;
		}

		if (e.touches.length === 1) {
			// Drag
			const touch = e.touches[0];
			const offset = this.getOffset(touch);

			if (preventPan?.(e, offset.x, offset.y)) {
				return;
			}

			this.mousePos = {
				x: offset.x,
				y: offset.y,
			};

			// keep the current pan value in memory to allow noStateUpdate panning
			this.prevPanPosition = {
				x: this.state.x,
				y: this.state.y,
			};

			this.touchInProgress = true;
			this.setTouchListeners();
		} else if (e.touches.length === 2) {
			// pinch
			this.pinchZoomLength = this.getPinchZoomLength(
				e.touches[0],
				e.touches[1],
			);
			this.touchInProgress = true;
			this.setTouchListeners();
		}
	};

	onToucheMove = (e: TouchEvent) => {
		const { realPinch, noStateUpdate, zoomSpeed } = this.props;
		if (e.touches.length === 1) {
			e.stopPropagation();
			const touch = e.touches[0];
			const offset = this.getOffset(touch);

			const dx = offset.x - this.mousePos.x;
			const dy = offset.y - this.mousePos.y;

			if (dx !== 0 || dy !== 0) {
				this.triggerOnPanStart(e);
			}

			this.mousePos = {
				x: offset.x,
				y: offset.y,
			};

			this.moveBy(dx, dy, noStateUpdate);
			this.triggerOnPan(e);
		} else if (e.touches.length === 2) {
			const finger1 = e.touches[0];
			const finger2 = e.touches[1];
			const currentPinZoomLength = this.getPinchZoomLength(finger1, finger2);

			let scaleMultiplier = 1;

			if (realPinch) {
				scaleMultiplier = currentPinZoomLength / this.pinchZoomLength;
			} else {
				let delta = 0;
				if (currentPinZoomLength < this.pinchZoomLength) {
					delta = 1;
				} else if (currentPinZoomLength > this.pinchZoomLength) {
					delta = -1;
				}
				scaleMultiplier = getScaleMultiplier(delta, zoomSpeed);
			}

			this.mousePos = {
				x: (finger1.clientX + finger2.clientX) / 2,
				y: (finger1.clientY + finger2.clientY) / 2,
			};
			this.zoomTo(this.mousePos.x, this.mousePos.y, scaleMultiplier);
			this.pinchZoomLength = currentPinZoomLength;
			e.stopPropagation();
		}
	};

	onTouchEnd = (e: TouchEvent) => {
		if (e.touches.length > 0) {
			const offset = this.getOffset(e.touches[0]);
			this.mousePos = {
				x: offset.x,
				y: offset.y,
			};

			// when removing a finger we don't go through onTouchStart
			// thus we need to set the prevPanPosition here
			this.prevPanPosition = {
				x: this.state.x,
				y: this.state.y,
			};
		} else {
			const { noStateUpdate } = this.props;
			if (noStateUpdate) {
				this.setState({ x: this.prevPanPosition.x, y: this.prevPanPosition.y });
			}

			this.touchInProgress = false;

			this.triggerOnPanEnd(e);
			this.cleanTouchListeners();
		}
	};

	setMouseListeners = () => {
		document.addEventListener("mousemove", this.onMouseMove);
		document.addEventListener("mouseup", this.onMouseUp);
	};

	cleanMouseListeners = () => {
		document.removeEventListener("mousemove", this.onMouseMove);
		document.removeEventListener("mouseup", this.onMouseUp);

		if (this.frameAnimation) {
			window.cancelAnimationFrame(this.frameAnimation);
			this.frameAnimation = 0;
		}

		if (this.intermediateFrameAnimation) {
			window.cancelAnimationFrame(this.intermediateFrameAnimation);
			this.intermediateFrameAnimation = 0;
		}
	};

	setTouchListeners = () => {
		document.addEventListener("touchmove", this.onToucheMove);
		document.addEventListener("touchend", this.onTouchEnd);
		document.addEventListener("touchcancel", this.onTouchEnd);
	};

	cleanTouchListeners = () => {
		document.removeEventListener("touchmove", this.onToucheMove);
		document.removeEventListener("touchend", this.onTouchEnd);
		document.removeEventListener("touchcancel", this.onTouchEnd);

		if (this.frameAnimation) {
			window.cancelAnimationFrame(this.frameAnimation);
			this.frameAnimation = 0;
		}

		if (this.intermediateFrameAnimation) {
			window.cancelAnimationFrame(this.intermediateFrameAnimation);
			this.intermediateFrameAnimation = 0;
		}
	};

	triggerOnPanStart = (
		e:
			| React.TouchEvent<HTMLDivElement>
			| React.MouseEvent<HTMLDivElement>
			| MouseEvent
			| TouchEvent,
	) => {
		const { onPanStart } = this.props;
		if (
			!this.panStartTriggered &&
			onPanStart &&
			typeof onPanStart === "function"
		) {
			onPanStart(e);
		}
		this.panStartTriggered = true;
	};

	triggerOnPan = (
		e:
			| React.TouchEvent<HTMLDivElement>
			| React.MouseEvent<HTMLDivElement>
			| MouseEvent
			| TouchEvent,
	) => {
		const { onPan } = this.props;
		if (typeof onPan === "function") {
			onPan(e);
		}
	};

	triggerOnPanEnd = (
		e:
			| React.TouchEvent<HTMLDivElement>
			| React.MouseEvent<HTMLDivElement>
			| MouseEvent
			| TouchEvent,
	) => {
		const { onPanEnd } = this.props;
		this.panStartTriggered = false;
		if (typeof onPanEnd === "function") {
			onPanEnd(e);
		}
	};

	getPinchZoomLength = (
		finger1: React.Touch | Touch,
		finger2: React.Touch | Touch,
	): number => {
		return Math.sqrt(
			(finger1.clientX - finger2.clientX) *
				(finger1.clientX - finger2.clientX) +
				(finger1.clientY - finger2.clientY) *
					(finger1.clientY - finger2.clientY),
		);
	};

	getContainer = (): HTMLDivElement => {
		const { current: container } = this.container;
		if (!container) {
			throw new Error("Could not find container DOM element.");
		}
		return container;
	};

	getDragContainer = (): HTMLDivElement => {
		const { current: dragContainer } = this.dragContainer;
		if (!dragContainer) {
			throw new Error("Could not find dragContainer DOM element.");
		}
		return dragContainer;
	};

	autoCenter = (zoomLevel = 1, animate = true) => {
		const container = this.getContainer();
		const dragContainer = this.getDragContainer();
		const { minZoom, maxZoom } = this.props;
		const containerRect = container.getBoundingClientRect();
		const { clientWidth, clientHeight } = dragContainer;
		const widthRatio = containerRect.width / clientWidth;
		const heightRatio = containerRect.height / clientHeight;
		let scale = Math.min(widthRatio, heightRatio) * zoomLevel;

		if (scale < minZoom) {
			console.warn(
				`[PanZoom]: initial zoomLevel produces a scale inferior to minZoom, reverted to default: ${minZoom}. Consider using a zoom level > ${minZoom}`,
			);
			scale = minZoom;
		} else if (scale > maxZoom) {
			console.warn(
				`[PanZoom]: initial zoomLevel produces a scale superior to maxZoom, reverted to default: ${maxZoom}. Consider using a zoom level < ${maxZoom}`,
			);
			scale = maxZoom;
		}

		const x = (containerRect.width - clientWidth * scale) / 2;
		const y = (containerRect.height - clientHeight * scale) / 2;
		let afterStateUpdate = undefined;
		if (!animate) {
			const transition = dragContainer.style.transition;
			dragContainer.style.transition = "none";
			afterStateUpdate = () => {
				setTimeout(() => {
					const dragContainer = this.getDragContainer();
					dragContainer.style.transition = transition;
				}, 0);
			};
		}

		this.prevPanPosition = { x, y };
		this.setState({ x, y, scale, angle: 0 }, afterStateUpdate);
	};

	moveByRatio = (x: number, y: number, moveSpeedRatio = 0.05) => {
		const container = this.getContainer();
		const containerRect = container.getBoundingClientRect();
		const offset = Math.min(containerRect.width, containerRect.height);
		const dx = offset * moveSpeedRatio * x;
		const dy = offset * moveSpeedRatio * y;

		this.moveBy(dx, dy, false);
	};

	moveBy = (dx: number, dy: number, noStateUpdate = true) => {
		const { x, y, scale, angle } = this.state;

		// Allow better performance by not updating the state on every change
		if (noStateUpdate) {
			const { x: prevTransformX, y: prevTransformY } = this.getTransformMatrix(
				this.prevPanPosition.x,
				this.prevPanPosition.y,
				scale,
				angle,
			);
			const {
				a,
				b,
				c,
				d,
				x: transformX,
				y: transformY,
			} = this.getTransformMatrix(
				this.prevPanPosition.x + dx,
				this.prevPanPosition.y + dy,
				scale,
				angle,
			);
			const { boundX, boundY, offsetX, offsetY } = this.getBoundCoordinates(
				{ x: transformX, y: transformY },
				{
					angle,
					scale,
					offsetX: this.prevPanPosition.x + dx,
					offsetY: this.prevPanPosition.y + dy,
				},
			);

			const intermediateX = prevTransformX + (prevTransformX - boundX) / 2;
			const intermediateY = prevTransformY + (prevTransformY - boundY) / 2;

			this.intermediateTransformMatrixString = getTransformMatrixString({
				a,
				b,
				c,
				d,
				x: intermediateX,
				y: intermediateY,
			});
			this.transformMatrixString = getTransformMatrixString({
				a,
				b,
				c,
				d,
				x: boundX,
				y: boundY,
			});

			// get bound x / y coords without the rotation offset
			this.prevPanPosition = {
				x: offsetX,
				y: offsetY,
			};

			// only apply intermediate animation if it is different from the end result
			if (
				this.intermediateTransformMatrixString !== this.transformMatrixString
			) {
				this.intermediateFrameAnimation = window.requestAnimationFrame(
					this.applyIntermediateTransform,
				);
			}

			this.frameAnimation = window.requestAnimationFrame(this.applyTransform);
		} else {
			const { x: transformX, y: transformY } = this.getTransformMatrix(
				x + dx,
				y + dy,
				scale,
				angle,
			);
			const { boundX, boundY } = this.getBoundCoordinates(
				{ x: transformX, y: transformY },
				{ angle, scale, offsetX: x + dx, offsetY: y + dy },
			);

			this.setState({
				x: x + dx - (transformX - boundX),
				y: y + dy - (transformY - boundY),
			});
		}
	};

	zoomAbs = (x: number, y: number, zoomLevel: number) => {
		this.zoomTo(x, y, zoomLevel / this.state.scale);
	};

	zoomTo = (x: number, y: number, ratio: number) => {
		const { minZoom, maxZoom } = this.props;
		const { x: transformX, y: transformY, scale, angle } = this.state;

		let newScale = scale * ratio;
		if (newScale < minZoom) {
			if (scale === minZoom) {
				return;
			}
			ratio = minZoom / scale;
			newScale = minZoom;
		} else if (newScale > maxZoom) {
			if (scale === maxZoom) {
				return;
			}
			ratio = maxZoom / scale;
			newScale = maxZoom;
		}

		const newX = x - ratio * (x - transformX);
		const newY = y - ratio * (y - transformY);

		const { boundX, boundY } = this.getBoundCoordinates(
			{ x: newX, y: newY },
			{ angle, scale, offsetX: newX, offsetY: newY },
		);
		this.prevPanPosition = { x: boundX, y: boundY };
		this.setState({ x: boundX, y: boundY, scale: newScale });
	};

	centeredZoom = (delta: number, zoomSpeed?: number) => {
		const container = this.getContainer();
		const scaleMultiplier = getScaleMultiplier(
			delta,
			zoomSpeed || this.props.zoomSpeed,
		);
		const containerRect = container.getBoundingClientRect();
		this.zoomTo(
			containerRect.width / 2,
			containerRect.height / 2,
			scaleMultiplier,
		);
	};

	zoomIn = (zoomSpeed?: number) => {
		this.centeredZoom(-1, zoomSpeed);
	};

	zoomOut = (zoomSpeed?: number) => {
		this.centeredZoom(1, zoomSpeed);
	};

	reset = () => {
		this.setState({ x: 0, y: 0, scale: 1, angle: 0 });
	};

	getContainerBoundingRect = (): ClientRect => {
		return this.getContainer().getBoundingClientRect();
	};

	getOffset = (
		e: React.MouseEvent<HTMLDivElement> | MouseEvent | React.Touch | Touch,
	): Coordinates => {
		const containerRect = this.getContainerBoundingRect();
		const offsetX = e.clientX - containerRect.left;
		const offsetY = e.clientY - containerRect.top;
		return { x: offsetX, y: offsetY };
	};

	getTransformMatrix = (
		x: number,
		y: number,
		scale: number,
		angle: number,
	): TransformationMatrix => {
		if (!this.dragContainer.current) {
			return { a: scale, b: 0, c: 0, d: scale, x, y };
		}

		const { clientWidth, clientHeight } = this.getDragContainer();
		const centerX = clientWidth / 2;
		const centerY = clientHeight / 2;

		return TransformMatrix(
			{ angle, scale, offsetX: x, offsetY: y },
			{ x: centerX, y: centerY },
		);
	};

	// Apply transform through rAF
	applyTransform = () => {
		this.getDragContainer().style.transform = this.transformMatrixString;
		this.frameAnimation = 0;
	};

	// Apply intermediate transform through rAF
	applyIntermediateTransform = () => {
		this.getDragContainer().style.transform =
			this.intermediateTransformMatrixString;
		this.intermediateFrameAnimation = 0;
	};

	getBoundCoordinates = (
		coordinates: Coordinates,
		transformationParameters: TransformationParameters,
	): BoundCoordinates => {
		const { x, y } = coordinates;
		const {
			enableBoundingBox,
			boundaryRatioVertical,
			boundaryRatioHorizontal,
		} = this.props;
		const { offsetX = 0, offsetY = 0 } = transformationParameters;

		if (!enableBoundingBox) {
			return {
				boundX: x,
				boundY: y,
				offsetX: x,
				offsetY: y,
			};
		}

		const { height: containerHeight, width: containerWidth } =
			this.getContainerBoundingRect();
		const { clientTop, clientLeft, clientWidth, clientHeight } =
			this.getDragContainer();
		const clientBoundingBox = {
			top: clientTop,
			left: clientLeft,
			width: clientWidth,
			height: clientHeight,
		};

		return boundCoordinates(
			x,
			y,
			{ vertical: boundaryRatioVertical, horizontal: boundaryRatioHorizontal },
			getTransformedBoundingBox(transformationParameters, clientBoundingBox),
			containerHeight,
			containerWidth,
			offsetX,
			offsetY,
		);
	};

	render() {
		const {
			children,
			autoCenter,
			autoCenterZoomLevel,
			zoomSpeed,
			doubleZoomSpeed,
			disabled,
			disableDoubleClickZoom,
			disableScrollZoom,
			disableKeyInteraction,
			realPinch,
			keyMapping,
			minZoom,
			maxZoom,
			enableBoundingBox,
			boundaryRatioVertical,
			boundaryRatioHorizontal,
			noStateUpdate,
			onPanStart,
			onPan,
			onPanEnd,
			preventPan,
			style,
			onDoubleClick,
			onMouseDown,
			onKeyDown,
			onKeyUp,
			onTouchStart,
			onStateChange,
			initialX,
			initialY,
			...restPassThroughProps
		} = this.props;
		const { x, y, scale, angle } = this.state;
		const transform = getTransformMatrixString(
			this.getTransformMatrix(x, y, scale, angle),
		);

		if (process.env.NODE_ENV !== "production") {
			function warning(
				invariant: boolean,
				...args: Parameters<typeof console.warn>
			) {
				if (!invariant) console.warn(...args);
			}
			warning(
				onDoubleClick === undefined || typeof onDoubleClick === "function",
				"Expected `onDoubleClick` listener to be a function, instead got a value of `%s` type.",
				typeof onDoubleClick,
			);
			warning(
				onMouseDown === undefined || typeof onMouseDown === "function",
				"Expected `onMouseDown` listener to be a function, instead got a value of `%s` type.",
				typeof onMouseDown,
			);
			warning(
				onKeyDown === undefined || typeof onKeyDown === "function",
				"Expected `onKeyDown` listener to be a function, instead got a value of `%s` type.",
				typeof onKeyDown,
			);
			warning(
				onKeyUp === undefined || typeof onKeyUp === "function",
				"Expected `onKeyUp` listener to be a function, instead got a value of `%s` type.",
				typeof onKeyUp,
			);
			warning(
				onTouchStart === undefined || typeof onTouchStart === "function",
				"Expected `onTouchStart` listener to be a function, instead got a value of `%s` type.",
				typeof onTouchStart,
			);
		}

		return (
			<div
				ref={this.container}
				{...(disableKeyInteraction
					? {}
					: {
							tabIndex: 0, // enable onKeyDown event
					  })}
				onDoubleClick={this.onDoubleClick}
				onMouseDown={this.onMouseDown}
				// React onWheel event listener is broken on Chrome 73
				// The default options for the wheel event listener has been defaulted to passive
				// but this behaviour breaks the zoom feature of PanZoom.
				// Until further research onWheel listener is replaced by
				// this.container.addEventListener('mousewheel', this.onWheel, { passive: false })
				// see Chrome motivations https://developers.google.com/web/updates/2019/02/scrolling-intervention
				//onWheel={this.onWheel}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onTouchStart={this.onTouchStart}
				style={{ cursor: disabled ? "initial" : "pointer", ...style }}
				{...restPassThroughProps}
			>
				<div
					ref={this.dragContainer}
					style={{
						display: "inline-block",
						transformOrigin: "0 0 0",
						transform,
						transition: "all 0.10s linear",
						willChange: "transform",
					}}
				>
					{children}
				</div>
			</div>
		);
	}
}

export default PanZoom;
