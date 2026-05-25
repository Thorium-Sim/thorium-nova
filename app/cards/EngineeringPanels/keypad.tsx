import "./keypad.css";

export function Keypad() {
	return (
		<div className="keypad row-span-3">
			<kbd data-key="7"></kbd>
			<kbd data-key="8"></kbd>
			<kbd data-key="9"></kbd>
			<kbd data-key="4"></kbd>
			<kbd data-key="5"></kbd>
			<kbd data-key="6"></kbd>
			<kbd data-key="1"></kbd>
			<kbd data-key="2"></kbd>
			<kbd data-key="3"></kbd>
			<kbd data-key="C"></kbd>
			<kbd data-key="0"></kbd>
			<kbd data-key="→"></kbd>
		</div>
	);
}
