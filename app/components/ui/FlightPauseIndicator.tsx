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
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      role="alert"
      aria-live="polite"
    >
      <div className="panel panel-warning px-4 py-2 flex items-center gap-2 shadow-lg">
        <Icon name="ban" size="sm" aria-hidden="true" />
        <span className="font-semibold text-sm select-none">
          FLIGHT PAUSED
        </span>
      </div>
    </div>
  );
}

export default FlightPauseIndicator;