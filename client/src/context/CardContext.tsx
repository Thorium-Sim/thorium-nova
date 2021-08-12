import {createContext, ReactNode, useContext, useMemo} from "react";

const CardContext = createContext({cardName: "default"});

export default function CardProvider({
  children,
  cardName,
}: {
  cardName: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({cardName}), [cardName]);
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCardContext() {
  return useContext(CardContext);
}
