import { clientId, q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import { useState } from "react";

const Login = () => {
	const { ship } = useStation();
	const [loginName, setLoginName] = useState("");
	// TODO: Support logging in with a ThoriumSim account
	const login = () => {
		if (loginName.trim().length > 0) {
			// TODO: Play a sound effect when the user logs in
			q.client.login.netSend({ name: loginName, clientId });
		}
	};
	if (!ship) throw new Error("Station is not assigned to a ship.");
	return (
		<div className="card-login flex flex-col items-center justify-center h-full">
			{ship.assets?.logo ? (
				<img
					className="card-login-image max-h-72 mb-8"
					draggable={false}
					src={ship.assets?.logo}
					alt={ship.name}
				/>
			) : null}
			<h2 className="card-login-ship-name text-6xl font-bold mb-4">
				{ship.name}
			</h2>
			<h3 className="card-login-ship-registry text-4xl font-bold mb-8">
				{ship.registry}
			</h3>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					login();
				}}
			>
				<Input
					fixed
					label="Login Name"
					className="w-72"
					onChange={(e) => setLoginName(e.target.value)}
					autoComplete="off"
					autoCorrect="off"
					value={loginName}
				/>
				<Button
					className="w-72 btn-primary"
					type="submit"
					disabled={loginName.trim().length === 0}
				>
					Login
				</Button>
			</form>
		</div>
	);
};
export default Login;
