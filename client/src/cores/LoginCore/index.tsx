import {useNetRequest} from "client/src/context/useNetRequest";

export function LoginCore() {
  const clients = useNetRequest("flightClients");
  return (
    <div className="prose prose-invert w-full mx-auto">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Station</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
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
