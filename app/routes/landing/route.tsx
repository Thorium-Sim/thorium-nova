import LoginButton from "@thorium/components/LoginButton";
import { Outlet } from "react-router";
import { ClientOnly } from "remix-utils/client-only";

import Credits from "./Credits";
import QuoteOfTheDay from "./QuoteOfTheDay";
import { WelcomeButtons } from "./WelcomeButtons";
import { WelcomeLogo } from "./WelcomeLogo";
export default function MainPage() {
	return (
		<>
			<div className="welcome grid h-full grid-cols-2 grid-rows-2 p-12">
				<WelcomeLogo />
				<Credits className="col-start-2 row-start-2" />

				<WelcomeButtons className="col-start-1 row-start-2" />
				<ClientOnly>{() => <QuoteOfTheDay />}</ClientOnly>
				<LoginButton />
			</div>
			<Outlet />
		</>
	);
}
