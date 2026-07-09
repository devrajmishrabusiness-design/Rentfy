/**
 * Schema Analyzer â€” pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeSchema` is what the plugin adapter
 * (`schema-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";
import {
  dedupeSeverity,
  calculateScore,
  calculateScoreBreakdown,
  mergeAnalyzerOptions,
} from "../utils/analyzer-helpers";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface SchemaAnalyzerOptions {
  /** Whether schema is required. Default: true */
  requireSchema?: boolean;
  /** Allowed schema types. Default: ["RealEstateListing", "Product"] */
  allowedTypes?: string[];
  /** Whether address is required. Default: true */
  requireAddress?: boolean;
  /** Whether price/offer is required. Default: true */
  requirePrice?: boolean;
  /** Whether geo coordinates are required. Default: false */
  requireGeo?: boolean;
  /** Whether images are required. Default: false */
  requireImages?: boolean;
  /** Whether to validate nested objects. Default: true */
  validateNested?: boolean;
  /** Enable strict mode. Default: false */
  strictMode?: boolean;
}

type RequiredAnalyzerOptions = Required<SchemaAnalyzerOptions>;

const defaults: RequiredAnalyzerOptions = {
  requireSchema: true,
  allowedTypes: ["RealEstateListing", "Product"],
  requireAddress: true,
  requirePrice: true,
  requireGeo: false,
  requireImages: false,
  validateNested: true,
  strictMode: false,
};

/* ----------------------------------------------------------------
 * Schema object types
 * ---------------------------------------------------------------- */

interface SchemaObject {
  "@context"?: unknown;
  "@type"?: unknown;
  "@graph"?: unknown;
  [key: string]: unknown;
}

/* ----------------------------------------------------------------
 * Public API â€” analyze a single schema
 * ---------------------------------------------------------------- */

export interface SchemaAnalysis {
  schema: string | object | undefined;
  /** Whether schema was found */
  schemaFound: boolean;
  /** Schema type(s) found */
  schemaType: string | string[] | undefined;
  /** Number of schemas (for @graph) */
  schemaCount: number;
  /** true only when no critical/warning issues */
  passed: boolean;
  /** Numeric score 0-100 */
  score: number;
  /** Breakdown by category */
  scoreBreakdown?: ScoreBreakdown;
  issues: SeoIssue[];
  /** Whether address was found */
  hasAddress: boolean;
  /** Whether price/offer was found */
  hasPrice: boolean;
  /** Whether geo coordinates were found */
  hasGeo: boolean;
  /** Whether images were found */
  hasImages: boolean;
  /** Total property count in schema */
  propertyCount: number;
  /** Error count */
  errorCount: number;
}

/**
 * Analyze one schema against configurable SEO rules.
 */
export const analyzeSchema = (
  schemaJsonLd: string | object | undefined,
  opts: SchemaAnalyzerOptions = {}
): SchemaAnalysis => {
  const options = mergeOptions(opts);
  const issues: SeoIssue[] = [];
  let errorCount = 0;

  // SCH-001: Schema Exists
  if (schemaJsonLd === undefined || schemaJsonLd === null) {
    issues.push(schemaMissingIssue());
    const score = calculateScore(issues, false);
    const scoreBreakdown = calculateScoreBreakdown(issues);
    return finalize(
      schemaJsonLd,
      false,
      undefined,
      0,
      issues,
      false,
      score,
      scoreBreakdown,
      false,
      false,
      false,
      false,
      0,
      1
    );
  }

  // Parse schema if string
  let schemaObj: SchemaObject;
  if (typeof schemaJsonLd === "string") {
    try {
      schemaObj = JSON.parse(schemaJsonLd) as SchemaObject;
    } catch (e) {
      // SCH-002: Valid JSON
      issues.push(invalidJsonIssue());
      errorCount++;
      issues.push(noSchemaErrorsIssue(errorCount));
      const score = calculateScore(issues, false);
      const scoreBreakdown = calculateScoreBreakdown(issues);
      return finalize(
        schemaJsonLd,
        true,
        undefined,
        0,
        issues,
        false,
        score,
        scoreBreakdown,
        false,
        false,
        false,
        false,
        0,
        errorCount
      );
    }
  } else {
    schemaObj = schemaJsonLd as SchemaObject;
  }

  // SCH-002: Valid JSON (passed if we got here)
  issues.push(validJsonIssue());

  // Handle @graph with multiple schemas
  let schemas: SchemaObject[] = [];
  if (Array.isArray(schemaObj["@graph"])) {
    schemas = schemaObj["@graph"] as SchemaObject[];
  } else {
    schemas = [schemaObj];
  }

  // Validate each schema
  let hasAddress = false;
  let hasPrice = false;
  let hasGeo = false;
  let hasImages = false;
  let schemaType: string | string[] | undefined;
  let propertyCount = 0;

  for (const schema of schemas) {
    // SCH-003: Valid @context
    const contextCheck = checkContext(schema, options);
    issues.push(contextCheck);

    // SCH-004: Valid Schema Type
    const typeCheck = checkSchemaType(schema, options);
    issues.push(typeCheck);

    // Track schema type
    if (!schemaType) {
      schemaType = typeCheck.severity === "success" 
        ? (schema["@type"] as string | string[]) 
        : undefined;
    } else if (Array.isArray(schemaType) && Array.isArray(schema["@type"])) {
      schemaType = [...schemaType, ...(schema["@type"] as string[])];
    }

    // SCH-005: Has Required Properties
    const requiredCheck = checkRequiredProperties(schema, options);
    issues.push(requiredCheck);

    // SCH-006: Has Address
    const addressCheck = checkAddress(schema, options);
    issues.push(addressCheck);
    if (addressCheck.severity === "success") hasAddress = true;

    // SCH-007: Has Price/Offer
    const priceCheck = checkPrice(schema, options);
    issues.push(priceCheck);
    if (priceCheck.severity === "success") hasPrice = true;

    // SCH-008: Has Geo Coordinates
    const geoCheck = checkGeo(schema, options);
    issues.push(geoCheck);
    if (geoCheck.severity === "success") hasGeo = true;

    // SCH-009: Has Images
    const imagesCheck = checkImages(schema, options);
    issues.push(imagesCheck);
    if (imagesCheck.severity === "success") hasImages = true;

    // Count properties
    propertyCount += countProperties(schema);
  }

  // SCH-010: No Schema Errors
  issues.push(noSchemaErrorsIssue(errorCount));

  // Passed = no issues with severity > "info"
  const passed = !issues.some(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  // Calculate numeric score
  const score = calculateScore(issues, passed);

  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(issues);

  return finalize(
    schemaJsonLd,
    true,
    schemaType,
    schemas.length,
    issues,
    passed,
    score,
    scoreBreakdown,
    hasAddress,
    hasPrice,
    hasGeo,
    hasImages,
    propertyCount,
    errorCount
  );
};

/* ----------------------------------------------------------------
 * Internals â€” each rule as a pure function
 * ---------------------------------------------------------------- */

const schemaMissingIssue = (): SeoIssue => ({
  id: "SCH-001",
  title: "Schema.org structured data is missing",
  description:
    "No JSON-LD structured data was found on the page. Search engines use structured data to understand content and enable rich snippets.",
  severity: "critical",
  category: "structured-data",
  recommendation:
    "Add JSON-LD structured data with @type 'RealEstateListing' or 'Product' to the page.",
  weight: 10,
});

const invalidJsonIssue = (): SeoIssue => ({
  id: "SCH-002",
  title: "Schema JSON is invalid",
  description:
    "The JSON-LD structured data contains syntax errors and cannot be parsed by search engines.",
  severity: "critical",
  category: "structured-data",
  recommendation:
    "Fix JSON syntax errors. Use a JSON validator or structured data testing tool.",
  weight: 10,
});

const validJsonIssue = (): SeoIssue => ({
  id: "SCH-002",
  title: "Schema JSON is valid",
  description: "The JSON-LD structured data is syntactically valid.",
  severity: "success",
  category: "structured-data",
  weight: 0,
});

const checkContext = (
  schema: SchemaObject,
  _opts: RequiredAnalyzerOptions
): SeoIssue => {
  const context = schema["@context"];

  if (!context) {
    return {
      id: "SCH-003",
      title: "Schema @context is missing",
      description:
        "The @context property is missing. This tells search engines which vocabulary is being used.",
      severity: "critical",
      category: "structured-data",
      recommendation:
        'Add "@context": "https://schema.org" to the schema.',
      weight: 8,
    };
  }

  if (
    context === "https://schema.org" ||
    context === "http://schema.org"
  ) {
    return {
      id: "SCH-003",
      title: "Schema @context is valid",
      description:
        'The @context is correctly set to "https://schema.org".',
      severity: "success",
      category: "structured-data",
      weight: 0,
    };
  }

  return {
    id: "SCH-003",
    title: "Schema @context is incorrect",
    description:
      `The @context is "${context}" but should be "https://schema.org".`,
    severity: "critical",
    category: "structured-data",
    recommendation:
      'Change @context to "https://schema.org".',
    currentValue: context as string,
    expectedValue: "https://schema.org",
    weight: 8,
  };
};

const checkSchemaType = (
  schema: SchemaObject,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  const schemaType = schema["@type"];

  if (!schemaType) {
    return {
      id: "SCH-004",
      title: "Schema @type is missing",
      description:
        "The @type property is missing. Search engines need to know what type of content this schema describes.",
      severity: "critical",
      category: "structured-data",
      recommendation:
        "Add @type with a valid schema type such as 'RealEstateListing' or 'Product'.",
      weight: 10,
    };
  }

  // Handle array of types
  const types = Array.isArray(schemaType) ? schemaType : [schemaType];
  const allowedTypes = opts.allowedTypes;

  const hasValidType = types.some((type) =>
    allowedTypes.includes(type as string)
  );

  if (hasValidType) {
    const validTypes = types.filter((type) =>
      allowedTypes.includes(type as string)
    );
    return {
      id: "SCH-004",
      title: `Valid schema type found: ${validTypes.join(", ")}`,
      description:
        `The schema uses valid type(s): ${validTypes.join(", ")}.`,
      severity: "success",
      category: "structured-data",
      weight: 0,
    };
  }

  return {
    id: "SCH-004",
    title: "Invalid schema type",
    description:
      `The schema type "${types.join(", ")}" is not in the allowed list: ${allowedTypes.join(", ")}.`,
    severity: "critical",
    category: "structured-data",
    recommendation:
      `Use one of the allowed types: ${allowedTypes.join(", ")}.`,
    currentValue: types.join(", "),
    expectedValue: allowedTypes.join(", "),
    weight: 10,
  };
};

const checkRequiredProperties = (
  schema: SchemaObject,
  _opts: RequiredAnalyzerOptions
): SeoIssue => {
  const hasName = !!schema["name"] && String(schema["name"]).trim().length > 0;
  const hasDescription =
    !!schema["description"] &&
    String(schema["description"]).trim().length > 0;

  if (hasName && hasDescription) {
    return {
      id: "SCH-005",
      title: "Required properties present",
      description:
        "The schema has both 'name' and 'description' properties.",
      severity: "success",
      category: "structured-data",
      weight: 0,
    };
  }

  const missing = [];
  if (!hasName) missing.push("name");
  if (!hasDescription) missing.push("description");

  return {
    id: "SCH-005",
    title: "Missing required properties",
    description:
      `The schema is missing: ${missing.join(", ")}. These properties help search engines understand the content.`,
    severity: "warning",
    category: "structured-data",
    recommendation:
      `Add ${missing.join(" and ")} to the schema.`,
    weight: 6,
  };
};

const checkAddress = (
  schema: SchemaObject,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  if (!opts.requireAddress) {
    return {
      id: "SCH-006",
      title: "Address check disabled",
      description: "Address validation is not required for this analysis.",
      severity: "info",
      category: "structured-data",
      weight: 0,
    };
  }

  const address = schema["address"];

  if (!address) {
    return {
      id: "SCH-006",
      title: "Address is missing",
      description:
        "The schema does not include an address. Location is critical for real estate listings.",
      severity: "warning",
      category: "structured-data",
      recommendation:
        "Add an 'address' property with a PostalAddress object.",
      weight: 6,
    };
  }

  // Check if address is a proper PostalAddress
  const addressObj = address as SchemaObject;
  const addressType = addressObj["@type"];

  if (
    addressType !== "PostalAddress" &&
    addressType !== "http://schema.org/PostalAddress" &&
    addressType !== "https://schema.org/PostalAddress"
  ) {
    return {
      id: "SCH-006",
      title: "Address type is incorrect",
      description:
        `The address should be of type 'PostalAddress', but found '${addressType}'.`,
      severity: "warning",
      category: "structured-data",
      recommendation:
        'Add "@type": "PostalAddress" to the address object.',
      currentValue: addressType as string,
      expectedValue: "PostalAddress",
      weight: 6,
    };
  }

  // Check for required address fields
  const hasStreet = !!addressObj["streetAddress"];
  const hasCity = !!addressObj["addressLocality"];
  const hasRegion = !!addressObj["addressRegion"];
  const hasPostalCode = !!addressObj["postalCode"];

  if (hasStreet && hasCity && hasRegion && hasPostalCode) {
    return {
      id: "SCH-006",
      title: "Complete address present",
      description:
        "The address includes street, city, region, and postal code.",
      severity: "success",
      category: "structured-data",
      weight: 0,
    };
  }

  const missing = [];
  if (!hasStreet) missing.push("streetAddress");
  if (!hasCity) missing.push("addressLocality");
  if (!hasRegion) missing.push("addressRegion");
  if (!hasPostalCode) missing.push("postalCode");

  return {
    id: "SCH-006",
    title: "Address is incomplete",
    description:
      `The address is missing: ${missing.join(", ")}.`,
    severity: "warning",
    category: "structured-data",
    recommendation:
      `Add ${missing.join(", ")} to the address for completeness.`,
    weight: 6,
  };
};

const checkPrice = (
  schema: SchemaObject,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  if (!opts.requirePrice) {
    return {
      id: "SCH-007",
      title: "Price check disabled",
      description: "Price validation is not required for this analysis.",
      severity: "info",
      category: "structured-data",
      weight: 0,
    };
  }

  const offers = schema["offers"];

  if (!offers) {
    return {
      id: "SCH-007",
      title: "Offers/price is missing",
      description:
        "The schema does not include pricing information. Price is critical for real estate listings.",
      severity: "warning",
      category: "structured-data",
      recommendation:
        "Add an 'offers' property with price information.",
      weight: 6,
    };
  }

  // Handle array of offers
  const offersArray = Array.isArray(offers) ? offers : [offers];

  for (const offer of offersArray) {
    const offerObj = offer as SchemaObject;
    const price = offerObj["price"];

    if (price !== undefined && price !== null) {
      // Check if price is valid (number or string)
      const priceValid =
        typeof price === "number" ||
        (typeof price === "string" && !isNaN(Number(price)));

      if (priceValid) {
        return {
          id: "SCH-007",
          title: "Price is present",
          description:
            `The schema includes valid pricing information.`,
          severity: "success",
          category: "structured-data",
          weight: 0,
        };
      }
    }
  }

  return {
    id: "SCH-007",
    title: "Price is missing or invalid",
    description:
      "The offers object does not include a valid price property.",
    severity: "warning",
    category: "structured-data",
    recommendation:
      "Add a 'price' property to the offers object (as number or string).",
    weight: 6,
  };
};

const checkGeo = (
  schema: SchemaObject,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  if (!opts.requireGeo) {
    return {
      id: "SCH-008",
      title: "Geo coordinates check disabled",
      description:
        "Geo coordinates validation is not required for this analysis.",
      severity: "info",
      category: "structured-data",
      weight: 0,
    };
  }

  const geo = schema["geo"];

  if (!geo) {
    return {
      id: "SCH-008",
      title: "Geo coordinates are missing",
      description:
        "The schema does not include geographic coordinates. Coordinates help with map integration and local SEO.",
      severity: "info",
      category: "structured-data",
      recommendation:
        "Add a 'geo' property with latitude and longitude.",
      weight: 4,
    };
  }

  const geoObj = geo as SchemaObject;
  const latitude = geoObj["latitude"];
  const longitude = geoObj["longitude"];

  if (latitude === undefined || longitude === undefined) {
    return {
      id: "SCH-008",
      title: "Geo coordinates are incomplete",
      description:
        "The geo object is missing latitude or longitude.",
      severity: "info",
      category: "structured-data",
      recommendation:
        "Add both 'latitude' and 'longitude' to the geo object.",
      weight: 4,
    };
  }

  // Validate latitude and longitude are numbers
  const latValid =
    typeof latitude === "number" ||
    (typeof latitude === "string" && !isNaN(Number(latitude)));
  const lngValid =
    typeof longitude === "number" ||
    (typeof longitude === "string" && !isNaN(Number(longitude)));

  if (!latValid || !lngValid) {
    return {
      id: "SCH-008",
      title: "Geo coordinates are invalid",
      description:
        "Latitude or longitude is not a valid number.",
      severity: "info",
      category: "structured-data",
      recommendation:
        "Ensure latitude and longitude are valid numbers.",
      weight: 4,
    };
  }

  return {
    id: "SCH-008",
    title: "Geo coordinates are present",
    description:
      "The schema includes valid geographic coordinates.",
    severity: "success",
    category: "structured-data",
    weight: 0,
  };
};

const checkImages = (
  schema: SchemaObject,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  if (!opts.requireImages) {
    return {
      id: "SCH-009",
      title: "Images check disabled",
      description: "Images validation is not required for this analysis.",
      severity: "info",
      category: "structured-data",
      weight: 0,
    };
  }

  const images = schema["image"];

  if (!images) {
    return {
      id: "SCH-009",
      title: "Images are missing",
      description:
        "The schema does not include images. Images help with visual search and rich snippets.",
      severity: "info",
      category: "structured-data",
      recommendation:
        "Add an 'image' property with image URL(s).",
      weight: 4,
    };
  }

  // Handle single image or array
  const imagesArray = Array.isArray(images) ? images : [images];

  if (imagesArray.length === 0) {
    return {
      id: "SCH-009",
      title: "Images array is empty",
      description:
        "The image array is empty. At least one image is recommended.",
      severity: "info",
      category: "structured-data",
      recommendation:
        "Add at least one image URL to the image array.",
      weight: 4,
    };
  }

  // Check if images are valid (strings or ImageObject with url)
  const hasValidImage = imagesArray.some((img) => {
    if (typeof img === "string") return img.trim().length > 0;
    const imgObj = img as SchemaObject;
    return !!imgObj["url"] && String(imgObj["url"]).trim().length > 0;
  });

  if (hasValidImage) {
    return {
      id: "SCH-009",
      title: "Images are present",
      description:
        `The schema includes ${imagesArray.length} image(s).`,
      severity: "success",
      category: "structured-data",
      weight: 0,
    };
  }

  return {
    id: "SCH-009",
    title: "Images are invalid",
    description:
      "The image property does not contain valid image URLs.",
    severity: "info",
    category: "structured-data",
    recommendation:
      "Add valid image URLs to the image property.",
    weight: 4,
  };
};

const noSchemaErrorsIssue = (errorCount: number): SeoIssue => {
  if (errorCount === 0) {
    return {
      id: "SCH-010",
      title: "No schema errors",
      description:
        "The schema passed all validation checks without errors.",
      severity: "success",
      category: "structured-data",
      weight: 0,
    };
  }

  return {
    id: "SCH-010",
    title: "Schema validation errors detected",
    description:
      `Found ${errorCount} error(s) during schema validation.`,
    severity: "critical",
    category: "structured-data",
    recommendation:
      "Review and fix the schema errors listed above.",
    currentValue: errorCount,
    weight: 8,
  };
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: SchemaAnalyzerOptions): RequiredAnalyzerOptions {
  return mergeAnalyzerOptions(opts, defaults);
}

function countProperties(schema: SchemaObject, visited = new WeakSet()): number {
  // Prevent circular reference infinite loops
  if (visited.has(schema)) {
    return 0;
  }
  visited.add(schema);

  let count = 0;
  for (const key in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      count++;
      const value = schema[key];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        count += countProperties(value as SchemaObject, visited);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "object" && item !== null) {
            count += countProperties(item as SchemaObject, visited);
          }
        }
      }
    }
  }
  return count;
}

function finalize(
  schema: string | object | undefined,
  schemaFound: boolean,
  schemaType: string | string[] | undefined,
  schemaCount: number,
  issues: SeoIssue[],
  passed: boolean,
  score: number,
  scoreBreakdown: ScoreBreakdown | undefined,
  hasAddress: boolean,
  hasPrice: boolean,
  hasGeo: boolean,
  hasImages: boolean,
  propertyCount: number,
  errorCount: number
): SchemaAnalysis {
  return {
    schema,
    schemaFound,
    schemaType,
    schemaCount,
    passed,
    score,
    scoreBreakdown,
    issues: dedupeSeverity(issues),
    hasAddress,
    hasPrice,
    hasGeo,
    hasImages,
    propertyCount,
    errorCount,
  };
}
