import { useEffect } from "react";
import { useNavigate } from "react-router";

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
	const navigate = useNavigate();
	useEffect(() => {
		navigate(to, { replace });
	}, [navigate, to, replace]);
	return null;
}
