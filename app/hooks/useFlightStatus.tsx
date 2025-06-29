import { q } from "@thorium/context/AppContext";

/**
 * Custom hook for accessing flight status information.
 * 
 * @description
 * Provides a convenient interface for accessing flight state including
 * whether a flight is active, paused, and basic flight information.
 * 
 * @returns {FlightStatusReturn} Flight status data and helper flags
 * 
 * @example
 * ```typescript
 * const { isActive, isPaused, flightName } = useFlightStatus();
 * 
 * if (isPaused) {
 *   console.log("Flight is paused");
 * }
 * ```
 * 
 * @see {@link q.flight.active} - Server procedure for flight data
 * @since 1.0.0
 */
export function useFlightStatus() {
  const [flight] = q.flight.active.useNetRequest();
  
  return {
    /**
     * Whether a flight is currently active (loaded).
     */
    isActive: !!flight,
    
    /**
     * Whether the active flight is currently paused.
     * Returns false if no flight is active.
     */
    isPaused: flight?.paused || false,
    
    /**
     * Name of the current flight.
     * Returns null if no flight is active.
     */
    flightName: flight?.name || null,
    
    /**
     * Date the flight was created.
     * Returns null if no flight is active.
     */
    flightDate: flight?.date || null,
    
    /**
     * Whether the flight has a flight director assigned.
     * Returns false if no flight is active.
     */
    hasFlightDirector: flight?.hasFlightDirector || false,
    
    /**
     * Raw flight data from the server.
     * Returns null if no flight is active.
     */
    flight: flight || null
  };
}

/**
 * Return type for the useFlightStatus hook.
 */
export interface FlightStatusReturn {
  /**
   * Whether a flight is currently active (loaded).
   */
  isActive: boolean;
  
  /**
   * Whether the active flight is currently paused.
   */
  isPaused: boolean;
  
  /**
   * Name of the current flight.
   */
  flightName: string | null;
  
  /**
   * Date the flight was created.
   */
  flightDate: Date | null;
  
  /**
   * Whether the flight has a flight director assigned.
   */
  hasFlightDirector: boolean;
  
  /**
   * Raw flight data from the server.
   */
  flight: {
    name: string;
    date: Date;
    paused: boolean;
    hasFlightDirector: boolean;
  } | null;
}