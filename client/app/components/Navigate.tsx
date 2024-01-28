import {useEffect} from "react";
import {useNavigate} from "@remix-run/react";

export function Navigate({to, replace}: {to: string; replace?: boolean}) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, {replace});
  }, [navigate, to, replace]);
  return null;
}
