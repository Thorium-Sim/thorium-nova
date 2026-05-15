import { q } from "@thorium/context/AppContext";

export function LoginCore() {
	const [clients] = q.loginCore.clients.useNetRequest();
	return (
		<div className="prose prose-invert mx-auto w-full">
			<table>
				<thead>
					<tr>
						<th>Client</th>
						<th>Station</th>
						<th>Name</th>
					</tr>
				</thead>
				<tbody>
					{clients.map((client) => (
						<tr key={client.clientId}>
							<td>{client.name}</td>
							<td>{client.stationId}</td>
							<td>{client.loginName}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
