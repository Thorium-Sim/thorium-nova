import { Icon } from "@thorium/ui/Icon";
import { useFlightStatus } from "@thorium/hooks/useFlightStatus";

/**
 * Flight pause indicator component that displays when a flight is paused.
 * 
 * @description
 * Shows a prominent warning banner at the top of the screen when the
 * current flight is paused. The indicator automatically appears and
 * disappears based on the flight's pause state.
 * 
 * Features:
 * - Appears only when flight is paused
 * - Fixed position overlay that doesn't interfere with card functionality
 * - Warning styling with icon and text for clear visibility
 * - Responsive design that works across different screen sizes
 * 
 * @component
 * @example
 * ```tsx
 * <FlightPauseIndicator />
 * ```
 * 
 * @see {@link useFlightStatus} - Hook for flight state data
 * @since 1.0.0
 */
export function FlightPauseIndicator() {
  const { isPaused } = useFlightStatus();
  
  // Only render when flight is paused
  if (!isPaused) {
    return null;
  }
  
  return (
    <>
      {/* Black background overlay to prevent interaction */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 z-40"
        aria-hidden="true"
      />
      
      {/* Large pause indicator */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-50"
        role="alert"
        aria-live="polite"
      >
        <div className="panel panel-warning px-12 py-8 flex flex-col items-center gap-6 shadow-2xl max-w-md mx-4">
          <Icon name="ban" size="2xl" aria-hidden="true" className="text-warning" />
          <span className="font-bold text-4xl select-none text-center">
            FLIGHT PAUSED
          </span>
          <span className="text-lg text-center opacity-80 select-none">
            Please wait for the flight director to resume the simulation
          </span>
        </div>
      </div>
    </>
  );
}

export default FlightPauseIndicator;