import Button from "@thorium/ui/Button";
import {useEffect, useRef} from "react";
import {useThoriumAccount} from "../context/ThoriumAccountContext";

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
    `
  );

  newWindow?.focus();
  return newWindow;
};

export default function LoginButton() {
  const {login, logout, account, verificationUrl, verifying} =
    useThoriumAccount();
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
      <Button
        className={`w-max btn-ghost btn-sm ${verifying ? "loading" : ""}`}
        onClick={() => {
          if (account) {
            logout();
          } else {
            login();
          }
        }}
      >
        {verifying ? "Verifying..." : account ? "Logout" : "Login to Thorium"}
      </Button>
      {account && (
        <img
          className="avatar w-10 h-10 rounded-full border border-gray-500"
          src={account.profilePictureUrl}
          alt={account.displayName}
        />
      )}
    </div>
  );
}
