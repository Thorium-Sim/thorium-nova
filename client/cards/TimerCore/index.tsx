import React from "react";
import {Duration} from "luxon";

class Timer extends Component {
  state = {
    timer: "00:00:00",
    sync:
      (window.localStorage.getItem("thorium_syncTime") || "false") === "true",
  };
  componentDidMount() {
    this.subscription = this.props.client
      .subscribe({
        query: TIMESYNC_SUB,
        variables: {
          simulatorId: this.props.simulator.id,
        },
      })
      .subscribe({
        next: ({data: {syncTime}}) => {
          this.state.sync &&
            this.setState(
              {timer: syncTime.time, stopped: !syncTime.active},
              () => {
                clearTimeout(this.timer);
                this.updateTimer();
              },
            );
        },
        error(err) {
          console.error("err", err);
        },
      });
  }
  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe();
    clearTimeout(this.timer);
  }
  updateTimer = () => {
    if (
      this.state.stopped ||
      this.state.timer === "00:00:00" ||
      this.state.timer === "0:0:0"
    ) {
      return;
    }
    const [hours, minutes, seconds] = this.state.timer.split(":");
    if (
      isNaN(parseInt(hours)) ||
      isNaN(parseInt(seconds)) ||
      isNaN(parseInt(minutes))
    ) {
      this.setState({
        timer: "00:00:00",
      });
      return;
    }
    const dur = Duration.fromObject({
      hours: parseInt(hours),
      minutes: parseInt(minutes),
      seconds: parseInt(seconds),
    })
      .minus(1000)
      .normalize()
      .toFormat("hh:mm:ss");
    this.setState({
      timer: dur,
    });
    this.timer = setTimeout(this.updateTimer, 1000);
  };
  setTimer = () => {
    const seconds = prompt("Enter the number of seconds:", 0);
    if (!seconds && seconds !== 0) return;
    const minutes = prompt("Enter the number of minutes:", 0);
    if (!minutes && minutes !== 0) return;
    const hours = prompt("Enter the number of hours:", 0);
    if (!hours && hours !== 0) return;

    clearTimeout(this.timer);
    this.timer = null;
    const mutation = gql`
      mutation SyncTimer($time: String, $active: Boolean, $simulatorId: ID!) {
        syncTimer(time: $time, active: $active, simulatorId: $simulatorId)
      }
    `;
    this.state.sync &&
      this.props.client.mutate({
        mutation,
        variables: {
          time: `${hours}:${minutes}:${seconds}`,
          active: true,
          simulatorId: this.props.simulator.id,
        },
      });
    this.setState(
      {timer: `${hours}:${minutes}:${seconds}`, stopped: false},
      () => {
        this.updateTimer();
      },
    );
  };
  toggleTimer = () => {
    const {stopped} = this.state;
    if (stopped) {
      this.setState(
        {
          stopped: false,
        },
        () => {
          this.updateTimer();
        },
      );
    } else {
      clearTimeout(this.timer);
      this.timer = null;
      this.setState({
        stopped: true,
      });
    }
    const mutation = gql`
      mutation SyncTimer($time: String, $active: Boolean, $simulatorId: ID!) {
        syncTimer(time: $time, active: $active, simulatorId: $simulatorId)
      }
    `;
    this.state.sync &&
      this.props.client.mutate({
        mutation,
        variables: {
          time: this.state.timer,
          active: stopped,
          simulatorId: this.props.simulator.id,
        },
      });
  };
  sendToSensors = () => {
    const [hours, minutes, seconds] = this.state.timer.split(":");
    const dur = Duration.fromObject({
      hours: parseInt(hours),
      minutes: parseInt(minutes),
      seconds: parseInt(seconds),
    }).normalize();
    const data = `Estimated time to arrival calculated: Approximately ${
      dur.hours > 0 ? `${dur.hours} hour${dur.hours === 1 ? "" : "s"}, ` : ""
    }${
      dur.minutes > 0
        ? `${dur.minutes} minute${dur.minutes === 1 ? "" : "s"}, `
        : ""
    }${dur.seconds} second${dur.seconds === 1 ? "" : "s"} at current speed.`;
    publish("sensorData", data);
  };
  render() {
    const {timer, stopped} = this.state;
    return (
      <div className="core-timer" style={{display: "flex"}}>
        <div
          style={{
            color: "black",
            float: "left",
            flex: 1,
            backgroundColor: "rgb(251, 254, 61)",
            border: "1px solid rgb(210, 203, 67)",
            height: "16px",
            whiteSpace: "pre",
            textAlign: "center",
          }}
          onClick={this.setTimer}
        >
          {timer}
        </div>
        <Button
          color={stopped ? "primary" : "danger"}
          size="sm"
          style={{height: "16px", float: "left", lineHeight: "12px"}}
          onClick={this.toggleTimer}
        >
          {stopped ? "Start" : "Stop"}
        </Button>
        <Button
          color={"success"}
          size="sm"
          style={{height: "16px", lineHeight: "12px"}}
          onClick={this.sendToSensors}
        >
          Send to Sensors
        </Button>
        <label>
          <input
            type="checkbox"
            checked={this.state.sync}
            onChange={e => {
              this.setState({sync: e.target.checked});
              window.localStorage.setItem("thorium_syncTime", e.target.checked);
            }}
          />
          Sync Cores
        </label>
      </div>
    );
  }
}

export default Timer;
