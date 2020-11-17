import {css} from "@emotion/core";
import {
  useFlightSubscription,
  useFlightStopMutation,
  useFlightPauseMutation,
  useFlightResumeMutation,
  useFlightResetMutation,
} from "client/generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {useConfirm} from "../Dialog";
import Button from "../ui/button";

const FlightMenubar: React.FC = () => {
  const {t} = useTranslation();
  const {data, loading} = useFlightSubscription();
  const [end] = useFlightStopMutation();
  const [pause] = useFlightPauseMutation();
  const [resume] = useFlightResumeMutation();
  const [reset] = useFlightResetMutation();

  const confirm = useConfirm();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!data?.flight && !loading) {
      navigate("/");
    }
  }, [data?.flight, navigate]);
  return (
    <div
      className="absolute top-0 left-0 w-screen p-2 pointer-events-none"
      css={css`
        * {
          pointer-events: all;
        }
      `}
    >
      <div className="flex gap-2 pointer-events-none">
        <Button
          variant="ghost"
          variantColor="danger"
          size="sm"
          onClick={async () => {
            if (
              await confirm({
                header: t("Are you sure you want to end this flight?"),
                body: t(
                  "The state of this flight will be stored and can be accessed later."
                ),
              })
            ) {
              await end();
              navigate("/");
            }
          }}
        >
          {t("End")}
        </Button>
        {data?.flight?.paused ? (
          <Button
            variant="ghost"
            variantColor="success"
            size="sm"
            onClick={() => resume()}
          >
            {t("Resume")}
          </Button>
        ) : (
          <Button
            variant="ghost"
            variantColor="warning"
            size="sm"
            onClick={() => pause()}
          >
            {t("Pause")}
          </Button>
        )}
        <Button
          variant="ghost"
          variantColor="info"
          size="sm"
          onClick={async () => {
            if (
              await confirm({
                header: t("Are you sure you want to reset this flight?"),
                body: t(
                  "This flight will revert to the point right after it was created."
                ),
              })
            ) {
              reset();
            }
          }}
        >
          {t("Reset")}
        </Button>
      </div>
    </div>
  );
};
const FlightLobby = () => {
  // TODO: Add a menubar with features only available to the game host.
  // Things like pause/unpause, stop flight, and reset flight
  const {t} = useTranslation();
  return (
    <div className="p-8 py-12 h-full flex flex-col bg-blackAlpha-500">
      <FlightMenubar />
      <h2 className="font-bold text-4xl">{t("Flight Lobby")}</h2>
    </div>
  );
};

export default FlightLobby;
