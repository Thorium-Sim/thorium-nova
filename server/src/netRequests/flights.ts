import {DataContext} from "../utils/DataContext";
import {getFlights} from "../utils/getFlights";

export const flightsRequests = {
  flights: (context: DataContext) => {
    return getFlights();
  },
};
