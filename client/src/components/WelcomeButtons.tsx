import {NavLink} from "react-router-dom";
import {useClientData} from "../context/useCardData";
import Button from "@thorium/ui/Button";
import {Disclosure} from "@headlessui/react";
import {netSend} from "../context/netSend";

export const WelcomeButtons = ({className}: {className?: string}) => {
  const client = useClientData();

  return (
    <div
      className={`${className} flex flex-col justify-end self-end space-y-4 max-w-md h-full`}
    >
      {client.flight ? (
        <>
          <NavLink className="btn btn-primary btn-outline" to="/flight">
            Go To Flight Lobby
          </NavLink>
          {process.env.NODE_ENV !== "production" && (
            <NavLink className="btn btn-info btn-outline" to="/cards">
              Go To Card Development
            </NavLink>
          )}
          <Button
            className="btn btn-error btn-outline"
            onClick={() => netSend("flightStop")}
          >
            Stop Flight
          </Button>
        </>
      ) : (
        <>
          <NavLink className="btn btn-primary btn-outline" to="/flight/quick">
            Start Flight
          </NavLink>
          <Disclosure>
            <Disclosure.Button className="btn btn-info btn-outline">
              Load a Saved Flight
            </Disclosure.Button>
            <Disclosure.Panel
              className="text-white list-none max-h-full overflow-y-auto"
              as="ul"
            >
              {client.flights.length ? (
                client.flights.map(f => (
                  <li className="list-group-item" key={f.name}>
                    <strong>{f.name}</strong>
                    <br />
                    <small>{new Date(f.date).toLocaleDateString()}</small>
                  </li>
                ))
              ) : (
                <>
                  <li className="list-group-item">No Saved Flights</li>
                </>
              )}
            </Disclosure.Panel>
          </Disclosure>

          <Button className="btn btn-warning btn-outline">Join a Server</Button>
          <NavLink className="btn btn-alert btn-outline" to="/config">
            Configure Plugins
          </NavLink>
          <NavLink className="btn btn-info btn-outline" to="/docs">
            How-to Guides
          </NavLink>
        </>
      )}
    </div>
  );
};
