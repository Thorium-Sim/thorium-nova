import useCardData from "client/src/context/useCardData";

export function Pilot() {
  const cardData = useCardData<"Pilot">();

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-6xl font-bold">Pilot</h1>
      <pre className="flex-1 overflow-y-auto">
        {JSON.stringify(cardData, null, 2)}
      </pre>
    </div>
  );
}
