import type { ActionOverrides } from "@client/data";
import type z from "zod";
type ZodObjectOrWrapped =
	| z.ZodObject<any, any>
	| z.ZodEffects<z.ZodObject<any, any>>;

export function getObjectFormSchema(
	schema: ZodObjectOrWrapped,
): z.ZodObject<any, any> {
	if (schema._def.typeName === "ZodEffects") {
		const typedSchema = schema as z.ZodEffects<z.ZodObject<any, any>>;
		return getObjectFormSchema(typedSchema._def.schema);
	}
	return schema as z.ZodObject<any, any>;
}

/**
 * Get all default values from a Zod schema.
 */
export function getDefaultValues<Schema extends z.ZodObject<any, any>>(
	schema: Schema,
) {
	const { shape } = schema;
	type DefaultValuesType = any; // DefaultValues<Partial<z.infer<Schema>>>;
	const defaultValues = {} as DefaultValuesType;

	for (const key of Object.keys(shape)) {
		const item = shape[key] as z.ZodAny;

		if (getBaseType(item) === "ZodObject") {
			const defaultItems = getDefaultValues(
				item as unknown as z.ZodObject<any, any>,
			);
			for (const defaultItemKey of Object.keys(defaultItems)) {
				const pathKey = `${key}.${defaultItemKey}` as keyof DefaultValuesType;
				defaultValues[pathKey] = defaultItems[defaultItemKey];
			}
		} else {
			const defaultValue = getDefaultValueInZodStack(item);
			if (defaultValue !== undefined) {
				defaultValues[key as keyof DefaultValuesType] = defaultValue;
			}
		}
	}

	return defaultValues;
}

/**
 * Get the type name of the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
export function getBaseType(schema: z.ZodAny): string {
	return getBaseSchema(schema)._def.typeName;
}

/**
 * Get the lowest level Zod type.
 * This will unpack optionals, refinements, etc.
 */
function getBaseSchema(schema: z.ZodAny): z.ZodAny {
	if ("innerType" in schema._def) {
		return getBaseSchema(schema._def.innerType as z.ZodAny);
	}
	if ("schema" in schema._def) {
		return getBaseSchema(schema._def.schema as z.ZodAny);
	}
	return schema;
}

/**
 * Search for a "ZodDefult" in the Zod stack and return its value.
 */
function getDefaultValueInZodStack(schema: z.ZodAny): any {
	const typedSchema = schema as unknown as z.ZodDefault<
		z.ZodNumber | z.ZodString
	>;

	if (typedSchema._def.typeName === "ZodDefault") {
		return typedSchema._def.defaultValue();
	}

	if ("innerType" in typedSchema._def) {
		return getDefaultValueInZodStack(
			typedSchema._def.innerType as unknown as z.ZodAny,
		);
	}
	if ("schema" in typedSchema._def) {
		return getDefaultValueInZodStack(
			(typedSchema._def as any).schema as z.ZodAny,
		);
	}
	return undefined;
}

/**
 * Beautify a camelCase string.
 * e.g. "myString" -> "My String"
 */
export function beautifyObjectName(string: string) {
	let output = string.replace(/([A-Z])/g, " $1");
	output = output.charAt(0).toUpperCase() + output.slice(1);
	return output;
}

/**
 * Convert a Zod schema to HTML input props to give direct feedback to the user.
 * Once submitted, the schema will be validated completely.
 */
export function zodToHtmlInputProps(
	schema:
		| z.ZodNumber
		| z.ZodString
		| z.ZodOptional<z.ZodNumber | z.ZodString>
		| any,
): React.InputHTMLAttributes<HTMLInputElement> {
	if (["ZodOptional", "ZodNullable"].includes(schema._def.typeName)) {
		const typedSchema = schema as z.ZodOptional<z.ZodNumber | z.ZodString>;
		return {
			...zodToHtmlInputProps(typedSchema._def.innerType),
			required: false,
		};
	}

	const typedSchema = schema as z.ZodNumber | z.ZodString;

	if (!("checks" in typedSchema._def)) return {};

	const { checks } = typedSchema._def;
	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		required: true,
	};
	const type = getBaseType(schema);

	for (const check of checks) {
		if (check.kind === "min") {
			if (type === "ZodString") {
				inputProps.minLength = check.value;
			} else {
				inputProps.min = check.value;
			}
		}
		if (check.kind === "max") {
			if (type === "ZodString") {
				inputProps.maxLength = check.value;
			} else {
				inputProps.max = check.value;
			}
		}
	}

	return inputProps;
}

/**
 * Define handlers for specific Zod types.
 * You can expand this object to support more types.
 */
const DEFAULT_ZOD_HANDLERS = {
	ZodBoolean: "checkbox",
	ZodDate: "date",
	ZodEnum: "select",
	ZodNumber: "number",
} as const;

export const ZOD_COMPARISONS = {
	ZodNumber: ["=", "!=", ">", "<", "<=", ">="],
	ZodBoolean: ["true", "false"],
	ZodString: ["=", "!=", "contains"],
	ZodArray: ["contains", "length"],
	ZodLiteral: ["=", "!="],
	ZodEnum: ["=", "!="],
	ZodUnion: ["=", "!="],
	// "ZodObject",
	// "ZodRecord",
};

export type InputTypes =
	| "object"
	| "text"
	| "number"
	| "select"
	| "checkbox"
	| "date"
	| "tags"
	| "room"
	| "starmapCoordinates";

export function getInputType<T extends keyof typeof ZOD_COMPARISONS>(
	item: {
		key: string;
		name: string;
		type: any;
		values: any;
	},
	comparison: (typeof ZOD_COMPARISONS)[T][number] | null,
): InputTypes {
	if (item.key === "tags") return "tags";
	if (!item.type) return "text";
	if (item.type === "ZodArray") {
		if (comparison === "contains") return "text";
		return "number";
	}
	if (item.type === "ZodEnum" || item.type === "select") {
		return "select";
	}
	if (item.type === "ZodObject" || item.type === "object") {
		return "object";
	}
	if (item.type === "room") return "room";
	if (item.type in DEFAULT_ZOD_HANDLERS) {
		return DEFAULT_ZOD_HANDLERS[item.type as keyof typeof DEFAULT_ZOD_HANDLERS];
	}
	if (item.type === "starmapCoordinates") return "starmapCoordinates";
	return "text";
}

function getItemFromShape(shape: any, name: string) {
	const item = shape[name] as z.ZodAny;

	if ("unwrap" in item && item.unwrap && typeof item.unwrap === "function") {
		return item.unwrap();
	}

	return item;
}

type ParsedSchema = {
	type: string;
	name: string;
	key: string;
	isRequired: boolean;
	inputProps: React.InputHTMLAttributes<HTMLInputElement>;
	values: any;
	helper?: string;
	isNested: boolean;
	path: string;
}[];
const fieldConfig = {} as any;
export function parseSchema(
	schema: any,
	overrides: Record<string, ActionOverrides> = {},
	nestedName?: string,
): ParsedSchema {
	if (!schema) return [];
	const { shape } = schema;
	if (!shape) return [];
	return Object.keys(shape).flatMap((name) => {
		let output: ParsedSchema = [];
		const item = getItemFromShape(shape, name);
		const type = overrides[name]?.type || getBaseType(item);
		if (type === "ZodObject") {
			const objectSchema = getObjectFormSchema(
				item as unknown as ZodObjectOrWrapped,
			);
			output = output.concat(parseSchema(objectSchema, overrides, name));
		}
		const itemName =
			overrides[name]?.name ??
			item._def.description ??
			beautifyObjectName(name);

		const key = `${nestedName ? `${nestedName}.` : ""}${name}`;

		const values =
			overrides[name]?.values ||
			(getBaseSchema(item) as unknown as z.ZodEnum<any>)._def.values;

		const fieldConfigItem = fieldConfig?.[name] ?? {};
		const inputProps = zodToHtmlInputProps(item);
		const isRequired =
			inputProps.required ?? fieldConfigItem.inputProps?.required ?? false;

		output.unshift({
			type: type,
			name: itemName,
			key,
			isRequired,
			inputProps,
			values,
			helper: overrides[name]?.helper,
			isNested: !!nestedName,
			path: nestedName || "",
		});
		return output;
	});
}
