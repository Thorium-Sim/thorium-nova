import useCardData from "client/src/context/useCardData";

export function Pilot() {
  const cardData = useCardData<"Pilot">();

  return (
    <div className="flex justify-center items-center h-full">
      <h1 className="text-6xl font-bold">Pilot</h1>
      <pre>{JSON.stringify(cardData, null, 2)}</pre>
    </div>
  );
}
