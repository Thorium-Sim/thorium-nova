import { createContext, type ReactNode, useContext, useMemo } from "react";

const CardContext = createContext({ cardName: "allData", cardLoaded: false });

export default function CardProvider({
	children,
	cardName,
	cardLoaded,
}: {
	cardName: string;
	cardLoaded: boolean;
	children: ReactNode;
}) {
	const value = useMemo(
		() => ({ cardName, cardLoaded }),
		[cardName, cardLoaded],
	);
	return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCardContext() {
	return useContext(CardContext);
}
