import {createContext, useContext} from "react";

const PlayerShipIdContext = createContext<string>(null!);

export const PlayerShipIdProvider: React.FC<{shipId: string}> = ({
  shipId,
  children,
}) => {
  return (
    <PlayerShipIdContext.Provider value={shipId}>
      {children}
    </PlayerShipIdContext.Provider>
  );
};

export function usePlayerShipId() {
  return useContext(PlayerShipIdContext);
}
