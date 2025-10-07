import { getAlphabet } from "@thorium/utils/getAlphabet";

const alphabet = Array.from({ length: 26 }).map((_, i) => getAlphabet(i));

export const CodeList = ({ font = "Symbol" }) => {
	return alphabet.map((a) => (
		<div key={a}>
			{a} = <span style={{ fontFamily: font }}>{a.toLowerCase()}</span>
		</div>
	));
};
