/**
 * Checks if the argument is a string
 * @param value
 */
export const isString = (value: unknown): value is string => {
	return typeof value === "string";
};

/**
 * Checks if the argument is a string, and if it has a length equals 0
 * @param str
 */
export const isEmptyString = (str: unknown): str is string => {
	return isString(str) && str.length === 0;
};
