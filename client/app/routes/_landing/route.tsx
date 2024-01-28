import LoginButton from "@client/components/LoginButton";
import Credits from "./Credits";
import QuoteOfTheDay from "./QuoteOfTheDay";
import {WelcomeButtons} from "./WelcomeButtons";
import {WelcomeLogo} from "./WelcomeLogo";
import {Outlet} from "@remix-run/react";
export default function MainPage() {
  return (
    <>
      <div className="welcome h-full p-12 grid grid-cols-2 grid-rows-2">
        <WelcomeLogo />
        <Credits className="row-start-2 col-start-2" />

        <WelcomeButtons className="col-start-1 row-start-2" />
        <QuoteOfTheDay />
        <LoginButton />
      </div>
      <Outlet />
    </>
  );
}
