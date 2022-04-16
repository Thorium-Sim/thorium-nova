import useCardData from "client/src/context/useCardData";

export function LoginCore() {
  const data = useCardData<"LoginCore">();
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
          {data.clients.map(client => (
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
