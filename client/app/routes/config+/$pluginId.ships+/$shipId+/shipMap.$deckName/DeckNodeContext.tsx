import {
  type 
  Dispatch,
  type 
  ReactNode,
  type 
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import {createContext} from "react";

const DeckNodeContext = createContext<{
  nodeState: readonly [number | null, Dispatch<SetStateAction<number | null>>];
  edgeState: readonly [number | null, Dispatch<SetStateAction<number | null>>];
}>(null!);
export function DeckNodeContextProvider({children}: {children: ReactNode}) {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const value = useMemo(
    () => ({
      nodeState: [selectedNode, setSelectedNode] as const,
      edgeState: [selectedEdge, setSelectedEdge] as const,
    }),
    [selectedNode, selectedEdge]
  );
  return (
    <DeckNodeContext.Provider value={value}>
      {children}
    </DeckNodeContext.Provider>
  );
}

export function useDeckNode() {
  const value = useContext(DeckNodeContext);
  if (!value)
    throw new Error(
      "useDeckNode must be used within a DeckNodeContextProvider"
    );
  return value;
}
