import Button from "@thorium/ui/Button";
import {Fragment, useEffect, useRef, useState} from "react";
import {useThoriumAccount} from "../context/ThoriumAccountContext";
import {Menu, Transition} from "@headlessui/react";
import {useIssueTracker} from "./IssueTracker";
import {Icon} from "./ui/Icon";
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

function AccountMenu({size = "md"}) {
  const {account, logout} = useThoriumAccount();
  const {setOpen} = useIssueTracker();
  const [noImg, setNoImg] = useState(!account?.profilePictureUrl);
  if (!account) return null;
  return (
    <Menu as="div">
      <Menu.Button className="inline-flex justify-center">
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
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="z-10 absolute right-8 w-56 mt-2 origin-top-right bg-gray-900 divide-y divide-gray-700 rounded-md shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none text-lg">
          <div className="px-1 py-1 ">
            <Menu.Item>
              {({active}) => (
                <button
                  onClick={() => {
                    setOpen(true);
                  }}
                  className={`${
                    active ? "bg-purple-900 text-white" : "text-white"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Icon name="circle-dot" className="mr-2" /> Issue Tracker
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({active}) => (
                <button
                  onClick={() => logout()}
                  className={`${
                    active ? "bg-purple-900 text-white" : "text-white"
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <Icon name="log-out" className="mr-2" /> Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export default function LoginButton({
  buttonClassName = "btn-ghost btn-sm",
  size = "md",
}: {
  buttonClassName?: string;
  size?: string;
}) {
  const {login, account, verificationUrl, verifying} = useThoriumAccount();
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
