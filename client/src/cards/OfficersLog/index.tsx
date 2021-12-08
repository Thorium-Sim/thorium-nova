import useCardData from "client/src/context/useCardData";
import {fromDate} from "dot-beat-time";
export default function OfficersLog() {
  const {officersLog} = useCardData<"OfficersLog">();

  return (
    <div>
      <h2>Officers Log</h2>
      <ul>
        {officersLog.map((log, i) => (
          <li key={`${log.timestamp}-${i}`}>
            {fromDate(new Date(log.timestamp), true)} - {log.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
