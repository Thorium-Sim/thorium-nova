import * as React from "react";
import {q} from "@client/context/AppContext";
import Button from "@thorium/ui/Button";

const alertLevelText = [
  {
    number: 5,
    text:
      "This alert condition is used when the ship is at normal running status. The crew is on standard duty and the ship is in no danger.",
  },
  {
    number: 4,
    text:
      "This alert condition is used when the station has a minor problem. All crew except damage control is on standard duty.",
  },
  {
    number: 3,
    text:
      "This alert condition is used when the ship needs to be ready for a crisis. All off duty personnel are put on stand by status.",
  },
  {
    number: 2,
    text:
      "This alert condition is used when the ship is in a dangerous situation, but is safe for the moment. All crew members are put on duty.",
  },
  {
    number: 1,
    text:
      "This alert condition is used when the ship is in danger or under attack. All crew members are put on duty at battle stations.",
  },
];

export function AlertLevel() {
    const [ship] = q.ship.get.useNetRequest();
    let [description, setDescription] = React.useState("");

    const updateLevel = (newLevel: string) => {
      q.alertLevel.update.netSend({
        level: newLevel
      });
    }
    const displayDesc = (level: number) => {
      alertLevelText.forEach((e) => {
        if (e.number === level) {
          setDescription(e.text);
        }
      });
    }
    const clearDesc = () => {
      setDescription("");
    }
    return (
        <div className="flex flex-row h-full gap-4">
          <div className="flex-1">
            <div className="flex flex-col justify-between h-full gap-4">
              <Button 
                className="btn-primary flex-1"
                type="button"
                onClick={() => updateLevel("5")}
                onMouseEnter={() => displayDesc(5)}
                onMouseLeave={() => clearDesc()}
              >
                Alert Condition 5
              </Button>
              <Button
                className="btn-success flex-1"
                type="button"
                onClick={() => updateLevel("4")}
                onMouseEnter={() => displayDesc(4)}
                onMouseLeave={() => clearDesc()}
              >
                Alert Condition 4
              </Button>
              <Button
                className="btn-warning flex-1"
                type="button"
                onClick={() => updateLevel("3")}
                onMouseEnter={() => displayDesc(3)}
                onMouseLeave={() => clearDesc()}
              >
                Alert Condition 3
              </Button>
              <Button
                className="btn-secondary flex-1"
                type="button"
                onClick={() => updateLevel("2")}
                onMouseEnter={() => displayDesc(2)}
                onMouseLeave={() => clearDesc()}
              >
                Alert Condition 2
              </Button>
              <Button
                className="btn-error flex-1"
                type="button"
                onClick={() => updateLevel("1")}
                onMouseEnter={() => displayDesc(1)}
                onMouseLeave={() => clearDesc()}
              >
                Alert Condition 1
              </Button>
            </div>
          </div>
          <div className="form-control flex flex-1 h-64">
            <textarea className="textarea h-full w-full" value={description} disabled></textarea>
          </div>
        </div>
    );
};