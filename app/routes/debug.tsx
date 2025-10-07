import { PDFViewer } from "@thorium/components/PDFViewer";
import {
	Button,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
} from "react-aria-components";

export default function () {
	return <div />;
	// return (
	// 		<Editor
	// 			defaultValue={`# Title: Remote Access Code

	// # damageTypes: Electrical, Structural

	// // Variables provided to every report
	// VAR damageType = "Electrical"
	// VAR damageMetric = "instability"
	// VAR secondaryMetric = "cascadeRisk"
	// VAR system = "Warp Engines"
	// VAR playerShip = 1
	// EXTERNAL uppercase(input)

	// // Local variables just used for this report
	// VAR plural = false
	// VAR code = ""

	// The <>{damageType:
	// - "Electrical":
	// ~ plural = true
	// electrical subsystems
	// - else: structure
	// }<> of the {system} {plural:have|has} sustained damage, causing <>{damageMetric:
	// - "efficiency": a loss in efficiency
	// - "instability": commands sent to the system to fail.
	// }

	// ~ code = "{~Alpha|Beta|Gamma|Delta|Zeta|Lambda|Omicron}-{RANDOM(100,999)}-{uppercase(system)}-{~Ansible|Cyber|Matrix|Naidon|Skadov|Memory|Faraday|Bernal|Dyson|Protocol|Vector|Analog|Digital|Buffer|Cache|Crypto|Fragment|System|Duplex|Threading|Hyper|Interlace|Progressive|Simplex|Multiplex|Syntax|Token}"

	// Send the following remote access code to initiate repairs: \`{code}\`

	// * [remoteAccess.send? entity: {playerShip} code: {code}]

	// The report has been completed successfully.

	// -> END

	// === function uppercase(input)
	// ~ return "WARPENGINES"`}
	// 			theme="vs-dark"
	// 			options={{
	// 				minimap: { enabled: false },
	// 				wordWrap: "on",
	// 			}}
	// 		/>
	// 	);
}
