import Menubar from "@thorium/ui/Menubar";
import {Link} from "@remix-run/react";
import * as Cards from "@client/cards";

export default function CardsDevelopment() {
  return (
    <>
      <Menubar>
        <div className="h-full p-4 bg-black/50 backdrop-filter backdrop-blur">
          <h1 className="text-4xl font-bold mb-4">Cards Development</h1>
          <div className="flex flex-wrap flex-col gap-2 items-start">
            {Object.keys(Cards).map(key => (
              <Link key={key} to={key} className="btn btn-primary">
                {key}
              </Link>
            ))}
          </div>
        </div>
      </Menubar>
    </>
  );
}
