import { createContext, use, type ReactNode } from "react";

const DefinedVariableContext = createContext<string[]>([]);

export function DefinedVariableProvider({
	variables,
	children,
}: {
	variables: string[];
	children: ReactNode;
}) {
	const vars = [...useDefinedVariables(), ...variables].filter((a, i, arr) => arr.indexOf(a) === i);

	return <DefinedVariableContext value={vars}>{children}</DefinedVariableContext>;
}

export function useDefinedVariables() {
	return use(DefinedVariableContext);
}
