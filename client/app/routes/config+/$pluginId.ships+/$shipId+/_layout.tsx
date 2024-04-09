import { q } from "@client/context/AppContext";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import {
	Outlet,
	useLocation,
	useParams,
	useNavigate,
	useMatch,
	Link,
} from "@remix-run/react";
import { Navigate } from "@client/components/Navigate";

export default function ShipLayout() {
	const { pathname } = useLocation();
	const { shipId, pluginId } = useParams() as {
		shipId: string;
		pluginId: string;
	};
	const navigate = useNavigate();
	const confirm = useConfirm();
	const [ship] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });
	if (!shipId || !ship) return <Navigate to={`/config/${pluginId}/ships`} />;
	if (!pathname.endsWith(shipId)) {
		return (
			<>
				<div className="h-full flex flex-col">
					<SettingsList />
					<Button
						className="w-full btn-outline btn-error"
						disabled={!shipId}
						onClick={async () => {
							if (
								!shipId ||
								!(await confirm({
									header: "Are you sure you want to delete this ship?",
									body: "All content for this ship, including images and other assets, will be gone forever.",
								}))
							)
								return;
							q.plugin.ship.delete.netSend({ pluginId, shipId });
							navigate(`/config/${pluginId}/ships`);
						}}
					>
						Delete Ship
					</Button>
					{/* <Button
            className="w-full btn-outline btn-notice"
            disabled={true}
            onClick={async () => {
              if (!pluginId) return;
              const name = await prompt({
                header: "What is the name of the duplicated plugin?",
              });
              if (!name || typeof name !== "string") return;
              const result = await netSend("pluginShipDuplicate", {
                pluginId: pluginId,
                shipId,
                name,
              });
              if ("error" in result) {
                toast({title:"Error duplicating plugin", body: result.error, color:"error"});
                return;
              }
              navigate(`/config/${result.shipId}`);
            }}
          >
            Duplicate Ship
          </Button> */}
				</div>
				<Outlet />
			</>
		);
	}
	return <Navigate to={`basic`} />;
}

const links = {
	basic: "Basic",
	physics: "Physics",
	assets: "Assets",
	shipMap: "Ship Map",
	systems: "Systems",
	cargo: "Cargo",
};

function SettingsList() {
	const setting = useMatch("config/:pluginId/ships/:shipId/:setting")?.params
		.setting;
	return (
		<div className="mb-2 w-72 overflow-y-auto">
			{Object.entries(links).map(([key, value]) => (
				<Link
					key={key}
					to={key}
					className={`list-group-item ${setting === key ? "selected" : ""}`}
				>
					{value}
				</Link>
			))}
		</div>
	);
}
