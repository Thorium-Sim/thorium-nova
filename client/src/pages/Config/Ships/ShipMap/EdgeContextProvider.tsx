import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

export const EdgeContext = createContext<
  MutableRefObject<Set<(nodeId: number, x: number, y: number) => void>[]>
>(null!);

export const EdgeContextProvider = ({children}: {children: ReactNode}) => {
  const edgeRenderFunctions = useRef<
    Set<(nodeId: number, x: number, y: number) => void>[]
  >([]);

  return (
    <EdgeContext.Provider value={edgeRenderFunctions}>
      {children}
    </EdgeContext.Provider>
  );
};
export function useEdgeRerender(
  from: number,
  to: number,
  fn: (nodeId: number, x: number, y: number) => void
) {
  const callback = useRef(fn);
  useEffect(() => {
    callback.current = fn;
  }, [fn]);
  const edgeRenderFunctions = useContext(EdgeContext);
  useEffect(() => {
    const rerender = callback.current;
    if (!edgeRenderFunctions.current[from]) {
      edgeRenderFunctions.current[from] = new Set();
    }
    if (!edgeRenderFunctions.current[to]) {
      edgeRenderFunctions.current[to] = new Set();
    }
    edgeRenderFunctions.current[from].add(rerender);
    edgeRenderFunctions.current[to].add(rerender);
    return () => {
      edgeRenderFunctions.current[from].delete(rerender);
      edgeRenderFunctions.current[to].delete(rerender);
    };
  }, [from, to]);
}
export function useTriggerEdgeRender(nodeId: number) {
  const edgeRenderFunctions = useContext(EdgeContext);

  return (x: number, y: number) => {
    if (edgeRenderFunctions.current[nodeId]) {
      edgeRenderFunctions.current[nodeId].forEach(f => f(nodeId, x, y));
    }
  };
}
