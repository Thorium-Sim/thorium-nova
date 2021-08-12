import {DataContext} from "server/src/utils/types";

export const card = () => {
  return (
    <div>
      <h1>Flights</h1>
    </div>
  );
};

export const subscriptions = {
  flightsList: (params: {clientId: string}, context: DataContext) => {
    return [];
  },
};
