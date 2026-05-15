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
		<div className="card-login flex h-full flex-col items-center justify-center">
			{ship.assets?.logo ? (
				<img
					className="card-login-image mb-8 max-h-72"
					draggable={false}
					src={ship.assets?.logo}
					alt={ship.name}
				/>
			) : null}
			<h2 className="card-login-ship-name mb-4 text-6xl font-bold">{ship.name}</h2>
			<h3 className="card-login-ship-registry mb-8 text-4xl font-bold">{ship.registry}</h3>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					login();
				}}
				className="login-form"
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
				<Button className="btn-primary w-72" type="submit" disabled={loginName.trim().length === 0}>
					Login
				</Button>
			</form>
		</div>
	);
};
export default Login;
