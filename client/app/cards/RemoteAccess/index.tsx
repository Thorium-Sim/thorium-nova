import { q } from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import { useEffect, useState } from "react";

export function RemoteAccess() {
	const [isSent, setIsSent] = useState(false);
	useEffect(() => {
		if (isSent) {
			const timeout = setTimeout(() => {
				setIsSent(false);
			}, 1000);

			return () => clearTimeout(timeout);
		}
	}, [isSent]);

	return (
		<form
			className="flex items-end gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				setIsSent(true);
				q.remoteAccess.send.netSend({ code: e.currentTarget.code.value });
				e.currentTarget.code.value = "";
			}}
		>
			<Input
				label="Remote Access Code"
				className="flex-1 font-mono"
				name="code"
				autoCapitalize="off"
				autoCorrect="off"
				autoFocus
			/>
			<Button
				className={`btn-primary btn-sm ${
					isSent ? "btn-success" : "btn-primary"
				}`}
			>
				{isSent ? "Sent" : "Send"}
			</Button>
		</form>
	);
}
