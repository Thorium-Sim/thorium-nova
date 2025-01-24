import LoginButton from "@thorium/components/LoginButton";
import Credits from "./Credits";
import QuoteOfTheDay from "./QuoteOfTheDay";
import { WelcomeButtons } from "./WelcomeButtons";
import { WelcomeLogo } from "./WelcomeLogo";
import { Outlet } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
export default function MainPage() {
	return (
		<>
			<div className="welcome h-full p-12 grid grid-cols-2 grid-rows-2">
				<WelcomeLogo />
				<Credits className="row-start-2 col-start-2" />

				<WelcomeButtons className="col-start-1 row-start-2" />
				<ClientOnly>{() => <QuoteOfTheDay />}</ClientOnly>
				<LoginButton />
			</div>
			<Outlet />
		</>
	);
}
