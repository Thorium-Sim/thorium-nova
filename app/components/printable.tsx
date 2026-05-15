import { Fragment } from "react";
import ReactDOM from "react-dom";

import "./printable.css";

export default function Printable(props: { preview?: boolean; children: React.ReactNode }) {
	// Render printable outside the root React element
	return (
		<Fragment>
			{props.preview && props.children}
			{ReactDOM.createPortal(<div className="printable">{props.children}</div>, document.body)}
		</Fragment>
	);
}
