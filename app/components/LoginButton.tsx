import Button from "@thorium/ui/Button";
import {
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
	Button as RAButton,
} from "react-aria-components";
import { Fragment, useEffect, useRef, useState } from "react";
import { useThoriumAccount } from "../context/ThoriumAccountContext";
import { useIssueTracker } from "./IssueTracker";
import { Icon } from "./ui/Icon";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
// https://stackoverflow.com/a/16861050/4697675
const popupCenter = ({
	url,
	title,
	w,
	h,
}: {
	url: string;
	title: string;
	w: number;
	h: number;
}) => {
	// Fixes dual-screen position                             Most browsers      Firefox
	const dualScreenLeft =
		window.screenLeft !== undefined ? window.screenLeft : window.screenX;
	const dualScreenTop =
		window.screenTop !== undefined ? window.screenTop : window.screenY;

	const width = window.innerWidth
		? window.innerWidth
		: document.documentElement.clientWidth
			? document.documentElement.clientWidth
			: window.screen.width;
	const height = window.innerHeight
		? window.innerHeight
		: document.documentElement.clientHeight
			? document.documentElement.clientHeight
			: window.screen.height;

	const systemZoom = width / window.screen.availWidth;
	const left = (width - w) / 2 / systemZoom + dualScreenLeft;
	const top = (height - h) / 2 / systemZoom + dualScreenTop;
	const newWindow = window.open(
		url,
		title,
		`
    scrollbars=yes,
    width=${w / systemZoom}, 
    height=${h / systemZoom}, 
    top=${top}, 
    left=${left}
    `,
	);

	newWindow?.focus();
	return newWindow;
};

function AccountMenu({ size = "md" }) {
	const { account, logout } = useThoriumAccount();
	const { setOpen } = useIssueTracker();
	const [noImg, setNoImg] = useState(!account?.profilePictureUrl);
	if (!account) return null;
	return (
		<MenuTrigger>
			<RAButton className="inline-flex justify-center">
				{noImg ? (
					"Thorium Account"
				) : (
					<img
						draggable={false}
						className={`avatar ${
							size === "sm" ? "w-8 h-8" : "w-10 h-10"
						} rounded-full border border-gray-500`}
						src={account.profilePictureUrl}
						alt={account.displayName}
						onError={() => setNoImg(true)}
					/>
				)}
			</RAButton>
			<Popover className={popoverTransitionClasses}>
				<Menu className="z-10 w-56 mt-2 px-1 py-1 bg-gray-900 divide-y divide-gray-700 rounded-md shadow-lg ring-1 ring-gray-300/5 focus:outline-none text-lg">
					<MenuItem
						className="text-white group flex rounded-md items-center w-full px-2 py-2 text-sm data-[isFocused]:bg-purple-900"
						onAction={() => {
							setOpen(true);
						}}
					>
						<Icon name="circle-dot" className="mr-2" /> Issue Tracker
					</MenuItem>
					<MenuItem
						className="text-white group flex rounded-md items-center w-full px-2 py-2 text-sm data-[isFocused]:bg-purple-900"
						onAction={() => logout()}
					>
						<Icon name="log-out" className="mr-2" /> Logout
					</MenuItem>
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}

export default function LoginButton({
	buttonClassName = "btn-ghost btn-sm",
	size = "md",
}: {
	buttonClassName?: string;
	size?: string;
}) {
	const { login, account, verificationUrl, verifying } = useThoriumAccount();
	const linkRef = useRef<HTMLAnchorElement>(null);
	const windowRef = useRef<Window | null>(null);
	useEffect(() => {
		if (verificationUrl) {
			if (!windowRef.current) {
				windowRef.current = popupCenter({
					url: verificationUrl,
					title: "Verify your account",
					w: 500,
					h: 500,
				});
			}
			// linkRef.current?.click();
		}
	}, [verificationUrl]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Close as soon as account is set
	useEffect(() => {
		if (windowRef.current) {
			windowRef.current.close();
			windowRef.current = null;
		}
	}, [account]);
	return (
		<div className="flex self-start place-self-end items-center">
			<a
				ref={linkRef}
				href={verificationUrl}
				target="thorium-account"
				className="opacity-0"
			>
				{" "}
			</a>
			{!account || verifying ? (
				<Button
					className={`w-max ${buttonClassName} ${verifying ? "loading" : ""}`}
					onClick={() => {
						login();
					}}
				>
					{verifying ? "Verifying..." : "Login to Thorium"}
				</Button>
			) : null}
			{account && <AccountMenu size={size} />}
		</div>
	);
}
