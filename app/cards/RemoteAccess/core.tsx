import { clientId, q } from "@thorium/context/AppContext";

export function RemoteAccessCore() {
	const [client] = q.client.get.useNetRequest({ clientId });
	const [codes] = q.remoteAccess.codes.useNetRequest({
		shipId: client.shipId || -1,
	});
	return (
		<div className="flex flex-col gap-1 p-2">
			{codes.map((code) => (
				<div key={code.id} className="flex items-center gap-1">
					<input
						title={`${code.station} - ${code.time}`}
						value={code.code}
						readOnly
						className="flex-1 font-mono bg-transparent border-white/20 border px-2 rounded"
					/>
					<button
						className="btn btn-xs btn-error"
						onClick={() =>
							q.remoteAccess.deny.netSend({ remoteAccessCodeId: code.id })
						}
					>
						Deny
					</button>
					<button
						className="btn btn-xs btn-success"
						onClick={() =>
							q.remoteAccess.accept.netSend({ remoteAccessCodeId: code.id })
						}
					>
						Accept
					</button>
				</div>
			))}
		</div>
	);
}
