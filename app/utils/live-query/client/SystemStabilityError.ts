/**
 * The error thrown when a system failed due to instability
 */
export class SystemStabilityError extends Error {
	// Make this compatible with LiveQueryError
	error: string;

	constructor(message: string) {
		super(message);
		this.error = message;
	}
}
