import App from "server/app";
import {gqlCall} from "server/helpers/gqlCall";
import Flight from "../flight";

describe("Timer Resolver", () => {
  beforeEach(() => {
    App.activeFlight = new Flight();
  });
  afterEach(() => {
    App.activeFlight = null;
  });
  it("should create a new timer", async () => {
    const timers = await gqlCall({
      query: `query Timers {
  timers {
    id
    timer {
      label
      time
      paused
    }
  }
}`,
    });
    expect(timers.data?.timers.length).toEqual(0);
    const newTimer = await gqlCall({
      query: `mutation NewTimer($label:String!, $time:String!) {
timerCreate(label:$label, time:$time) {
  id
  timer {
    label
    time
    paused
  }
}
}`,
      variables: {label: "Test Timer", time: "00:05:00"},
    });
    const moreTimers = await gqlCall({
      query: `query Timers {
  timers {
    id
    timer {
      label
      time
      paused
    }
  }
}`,
    });

    expect(moreTimers.data?.timers[0]).toEqual(newTimer.data?.timerCreate);
  });
  it("pauses active timers", async () => {
    const newTimer = await gqlCall({
      query: `mutation NewTimer($label:String!, $time:String!) {
timerCreate(label:$label, time:$time) {
  id
  timer {
    label
    time
    paused
  }
}
}`,
      variables: {label: "Test Timer", time: "00:05:00"},
    });
    const id = newTimer.data?.timerCreate.id;
    expect(newTimer.data?.timerCreate.paused).toBeFalsy();
    const pauseTimer = await gqlCall({
      query: `mutation PauseTimer($id:ID!) {
        timerPause(id:$id, pause:true) {
          id
          timer {
            paused
          }
        }
      }`,
      variables: {id},
    });

    expect(pauseTimer.data?.timerPause.id).toEqual(id);
    expect(pauseTimer.data?.timerPause.timer.paused).toBeTruthy();

    const pauseTimer2 = await gqlCall({
      query: `mutation PauseTimer($id:ID!) {
        timerPause(id:$id, pause:false) {
          id
          timer {
            paused
          }
        }
      }`,
      variables: {id},
    });

    expect(pauseTimer2.data?.timerPause.id).toEqual(id);
    expect(pauseTimer2.data?.timerPause.timer.paused).toBeFalsy();
  });
  it("deletes timers", async () => {
    const newTimer = await gqlCall({
      query: `mutation NewTimer($label:String!, $time:String!) {
timerCreate(label:$label, time:$time) {
  id
  timer {
    label
    time
    paused
  }
}
}`,
      variables: {label: "Test Timer", time: "00:05:00"},
    });
    const id = newTimer.data?.timerCreate.id;
    const timer = await gqlCall({
      query: `query Timer($id:ID!) {
      timer(id:$id) {
        id
      }
    }`,
      variables: {id},
    });
    expect(timer.data?.timer.id).toEqual(id);
    await gqlCall({
      query: `mutation TimerDelete($id:ID!) {
      timerRemove(id:$id)
    }`,
      variables: {id},
    });
    const secondTimer = await gqlCall({
      query: `query Timer($id:ID!) {
        timer(id:$id) {
          id
      }
    }`,
      variables: {id},
    });
    expect(secondTimer.data?.timer).toBeFalsy();
  });
});
