import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

export const useIssueTracker = () => {
	const value = useContext(IssueTrackerContext);
	if (!value) throw new Error("useIssueTracker used outside of context provider");
	return value;
};
export const IssueTrackerContext = createContext<{
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}>(null!);
