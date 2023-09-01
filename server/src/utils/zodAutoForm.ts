import z from "zod";
type ZodObjectOrWrapped =
  | z.ZodObject<any, any>
  | z.ZodEffects<z.ZodObject<any, any>>;

export function getObjectFormSchema(
  schema: ZodObjectOrWrapped
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
  schema: Schema
) {
  const {shape} = schema;
  type DefaultValuesType = any; // DefaultValues<Partial<z.infer<Schema>>>;
  const defaultValues = {} as DefaultValuesType;

  for (const key of Object.keys(shape)) {
    const item = shape[key] as z.ZodAny;

    if (getBaseType(item) === "ZodObject") {
      const defaultItems = getDefaultValues(
        item as unknown as z.ZodObject<any, any>
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
      typedSchema._def.innerType as unknown as z.ZodAny
    );
  }
  if ("schema" in typedSchema._def) {
    return getDefaultValueInZodStack(
      (typedSchema._def as any).schema as z.ZodAny
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
    | any
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

  const {checks} = typedSchema._def;
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
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "tags";

export function getInputType<T extends keyof typeof ZOD_COMPARISONS>(
  item: {
    key: string;
    itemName: string;
    zodBaseType: any;
    baseValues: any;
  },
  comparison: (typeof ZOD_COMPARISONS)[T][number] | null
): InputTypes {
  if (item.key === "tags") return "tags";
  if (!item.zodBaseType) return "text";
  if (item.zodBaseType === "ZodArray") {
    if (comparison === "contains") return "text";
    return "number";
  }
  if (item.zodBaseType === "ZodEnum") {
    return "select";
  }
  if (item.zodBaseType in DEFAULT_ZOD_HANDLERS) {
    return DEFAULT_ZOD_HANDLERS[
      item.zodBaseType as keyof typeof DEFAULT_ZOD_HANDLERS
    ];
  }
  return "text";
}

const fieldConfig = {} as any;
export function parseSchema(schema: z.ZodObject<any, any>) {
  if (!schema) return [];
  const {shape} = schema;
  if (!shape) return [];
  return Object.keys(shape).map(name => {
    const item = shape[name] as z.ZodAny;
    const zodBaseType = getBaseType(item);
    const itemName = item._def.description ?? beautifyObjectName(name);
    const key = name;

    const baseValues = (getBaseSchema(item) as unknown as z.ZodEnum<any>)._def
      .values;

    const fieldConfigItem = fieldConfig?.[name] ?? {};
    const zodInputProps = zodToHtmlInputProps(item);
    const isRequired =
      zodInputProps.required ?? fieldConfigItem.inputProps?.required ?? false;

    return {
      zodBaseType,
      itemName,
      key,
      isRequired,
      zodInputProps,
      baseValues,
    };
  });
}
