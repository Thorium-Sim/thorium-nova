import React from "react";
import {Duration} from "luxon";
import {
  useTimersSubscription,
  useTimerCreateMutation,
  useTimerPauseMutation,
  useTimerRemoveMutation,
} from "../../generated/graphql";
import {Box, Button, IconButton, List, ListItem} from "@chakra-ui/core";
import {usePrompt} from "../../components/Dialog";
import {css} from "@emotion/core";

const Timer: React.FC = () => {
  const {data} = useTimersSubscription();
  const [create] = useTimerCreateMutation();
  const [remove] = useTimerRemoveMutation();
  const [pause] = useTimerPauseMutation();

  const prompt = usePrompt();

  async function handleCreate() {
    const label = (await prompt({
      header: "What is the timer label?",
      defaultValue: "Generic Timer",
    })) as string;
    const seconds = (await prompt({
      header: "Enter the number of seconds:",
      defaultValue: "0",
    })) as string;
    if (!seconds || isNaN(parseFloat(seconds))) return;

    const minutes = (await prompt({
      header: "Enter the number of minutes:",
      defaultValue: "0",
    })) as string;
    if (!minutes || isNaN(parseFloat(minutes))) return;

    const hours = (await prompt({
      header: "Enter the number of hours:",
      defaultValue: "0",
    })) as string;
    if (!hours || isNaN(parseFloat(hours))) return;

    if (seconds + minutes + hours === "000") return;
    const time = `${hours.padStart(2, "0")}:${minutes.padStart(
      2,
      "0",
    )}:${seconds.padStart(2, "0")}`;

    create({variables: {label, time}});
  }
  return (
    <Box>
      <List>
        {data?.timers.map(t => (
          <ListItem
            key={t.id}
            display="flex"
            alignItems="center"
            css={css`
              font-variant-numeric: tabular-nums;
            `}
          >
            {t.components.timer.label}: {t.components.timer.time}
            <Button
              size="xs"
              ml={1}
              variant="ghost"
              variantColor={t.components.timer.paused ? "blue" : "orange"}
              onClick={() =>
                pause({
                  variables: {id: t.id, pause: !t.components.timer.paused},
                })
              }
            >
              {t.components.timer.paused ? "Resume" : "Pause"}
            </Button>
            <IconButton
              size="xs"
              aria-label="Delete Timer"
              icon="delete"
              variant="ghost"
              variantColor="red"
              ml={1}
              onClick={() => remove({variables: {id: t.id}})}
            />
          </ListItem>
        ))}
      </List>
      <Button size="sm" variantColor="green" onClick={handleCreate}>
        New Timer
      </Button>
    </Box>
  );
};

export default Timer;
