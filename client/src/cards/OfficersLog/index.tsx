import * as React from "react";
import Button from "@thorium/ui/Button";
import {toast} from "client/src/context/ToastContext";
import {fromDate} from "dot-beat-time";
import {q} from "@client/context/AppContext";

export default function OfficersLog() {
  const [client] = q.client.get.useNetRequest();
  const [officersLog] = q.officersLog.get.useNetRequest();

  const [stardate, setStardate] = React.useState(new Date());
  const [logEntry, setLogEntry] = React.useState<string>("");
  const [selectedEntry, setSelectedEntry] = React.useState<number | null>();
  const textRef = React.useRef<HTMLTextAreaElement>(null);
  const entry = officersLog.find(e => e.timestamp === selectedEntry);
  return (
    <div className="mx-auto max-w-5xl flex h-full py-4 gap-8">
      <div className="flex flex-col h-full gap-4">
        <h2 className="text-4xl font-bold h-10">Officers Log</h2>
        <ul className="panel panel-alert flex-1">
          {officersLog
            .concat()
            .reverse()
            .map((log, i) => (
              <li
                key={`${log.timestamp}-${i}`}
                className={`list-group-item ${
                  selectedEntry === log.timestamp ? "selected" : ""
                }`}
                onClick={() => setSelectedEntry(log.timestamp)}
              >
                {fromDate(new Date(log.timestamp), true)}
              </li>
            ))}
        </ul>
        <Button
          className="btn-info"
          onClick={() => {
            setSelectedEntry(null);
            setStardate(new Date());
            textRef.current?.focus();
          }}
        >
          New Log Entry
        </Button>
      </div>
      <div className="flex-1 flex flex-col h-full gap-4">
        <h3 className="text-2xl font-bold h-10 flex justify-between items-end">
          <span>Log of Officer: {client.loginName}</span>
          <span>
            Stardate:{" "}
            {fromDate(
              entry?.timestamp ? new Date(entry?.timestamp) : stardate,
              true
            )}
          </span>
        </h3>
        <textarea
          ref={textRef}
          className="textarea textarea-alert flex-1 text-xl"
          onChange={e => setLogEntry(e.target.value)}
          readOnly={!!entry}
          value={entry?.message || logEntry}
        ></textarea>
        <div className="flex gap-8">
          <Button
            className="btn-error flex-1"
            onClick={() => {
              setSelectedEntry(null);
              setLogEntry("");
              textRef.current?.focus();
            }}
          >
            Clear
          </Button>
          <Button
            className="btn-success flex-1"
            disabled={!!entry}
            onClick={async () => {
              if (logEntry.trim().length === 0) {
                toast({
                  title: "Error creating officers log entry",
                  body: "Please enter a log message.",
                  color: "error",
                });
                return;
              }
              await q.officersLog.add.netSend({
                message: logEntry,
                timestamp: stardate.getTime(),
              });
              setLogEntry("");
              setStardate(new Date());
              setSelectedEntry(stardate.getTime());
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
