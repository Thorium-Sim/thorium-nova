import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

type ThoriumAccountContextProps = {
	account: ThoriumAccount | null;
	login: () => void;
	logout: () => void;
	userCode?: string;
	verificationUrl?: string;
	verifying: boolean;
	refresh: () => void;
};
interface ThoriumAccount {
	user_id: number;
	displayName: string;
	profilePictureUrl: string;
	githubConnection: boolean;
	access_token: string;
	accounts: string[];
}
const ThoriumAccountContext = createContext<ThoriumAccountContextProps>(null!);

export function ThoriumAccountContextProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [account, setAccount] = useLocalStorage<ThoriumAccount | null>(
		"thorium_account",
		null,
	);
	const [verifying, setVerifying] = useState(false);
	const [deviceCode, setDeviceCode] = useState<{
		device_code: string;
		user_code: string;
		expires_in: number;
		interval: number;
		verification_uri: string;
	} | null>(null);

	const value = useMemo(() => {
		function logout() {
			setDeviceCode(null);
			setAccount(null);
		}
		async function refresh(accessToken?: string) {
			if (!account?.access_token && !accessToken) return;
			const user = await fetch(`${process.env.THORIUMSIM_URL}/api/identity`, {
				headers: {
					Authorization: `Bearer ${accessToken || account?.access_token}`,
				},
				credentials: "omit",
			}).then((res) => res.json());
			setAccount({
				...account,
				...user,
				access_token: accessToken || account?.access_token,
			});
		}
		async function login() {
			setVerifying(true);
			// Kick off the login process
			const data = await fetch(
				`${process.env.THORIUMSIM_URL}/oauth/device_request`,
				{
					method: "POST",
					body: JSON.stringify({
						client_id: process.env.THORIUMSIM_CLIENT_ID,
						scope: "identity github:issues",
					}),
					headers: {
						"Content-Type": "application/json",
					},
				},
			).then((res) => res.json());
			if (data.error) {
				setVerifying(false);
				throw new Error(data.error_description);
			}

			setDeviceCode(data);
		}
		return {
			account,
			login,
			logout,
			userCode: deviceCode?.user_code,
			verificationUrl: deviceCode?.verification_uri,
			verifying,
			refresh,
		};
	}, [account, setAccount, deviceCode, verifying]);

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		if (deviceCode) {
			const interval = setInterval(async () => {
				const data = await fetch(
					`${process.env.THORIUMSIM_URL}/oauth/access_token`,
					{
						method: "POST",
						body: JSON.stringify({
							client_id: process.env.THORIUMSIM_CLIENT_ID,
							device_code: deviceCode.device_code,
							grant_type: "device_code",
						}),
						headers: {
							"Content-Type": "application/json",
						},
					},
				).then((res) => res.json());

				if (data.error) {
					if (data.error === "authorization_pending") return;
					if (data.error === "slow_down") {
						setDeviceCode({ ...deviceCode, interval: deviceCode.interval * 2 });
						return;
					}
					if (data.error === "expired_token") {
						setDeviceCode(null);
						setVerifying(false);
						clearInterval(interval);
						return;
					}
					setVerifying(false);
					setDeviceCode(null);
				}
				if (data.access_token) {
					setVerifying(false);
					clearInterval(interval);
					value.refresh(data.access_token);
					setDeviceCode(null);
				}
			}, deviceCode.interval * 1000);

			return () => clearInterval(interval);
		}
	}, [deviceCode, setAccount, value]);

	return (
		<ThoriumAccountContext.Provider value={value}>
			{children}
		</ThoriumAccountContext.Provider>
	);
}

export function useThoriumAccount() {
	return useContext(ThoriumAccountContext);
}
