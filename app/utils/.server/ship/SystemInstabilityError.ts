/**
 * Thrown when a system fails the stability check.
 * The client-side checks for this error and displays
 * the proper toast message to the user.
 */
export class SystemStabilityError extends Error {
	public error: string;
	public readonly errorType = "SystemStabilityError";

	constructor(
		message: string,
		public title: string,
	) {
		super(message);
		this.error = message;
	}
}
