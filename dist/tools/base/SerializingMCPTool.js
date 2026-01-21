/**
 * SerializingMCPTool - Framework-Safe Response Serialization
 *
 * Drop-in replacement for MCPTool that handles serialization of structured responses.
 *
 * File: src/tools/base/SerializingMCPTool.ts
 *
 * Why this exists:
 * - MCP framework expects tools to return strings
 * - Your tools return structured objects: { success: true, id: "...", data: {} }
 * - This class automatically converts objects → JSON strings
 * - No framework modifications needed (framework-safe!)
 *
 * Usage:
 * 1. Extend this class instead of MCPTool
 * 2. Implement executeInternal() instead of execute()
 * 3. Return whatever you want (object, string, number, null, etc.)
 * 4. Serialization happens automatically
 */
import { MCPTool } from "mcp-framework";
import { z } from "zod";
/**
 * Base class for all YNAB MCP tools with automatic response serialization.
 *
 * Subclasses should implement executeInternal() instead of execute().
 * The execute() method is sealed and handles serialization automatically.
 *
 * @template Input - The input schema type for this tool
 *
 * @example
 * ```typescript
 * class MyTool extends SerializingMCPTool {
 *   name = "my_tool";
 *   description = "Does something";
 *   schema = z.object({ name: z.string().describe("Name") });
 *
 *   // Implement this instead of execute()
 *   protected async executeInternal(input: { name: string }) {
 *     // Can return objects, strings, anything!
 *     return {
 *       success: true,
 *       result: `Hello ${input.name}`,
 *       timestamp: new Date().toISOString()
 *     };
 *   }
 * }
 * ```
 */
export class SerializingMCPTool extends MCPTool {
    /**
     * Final execute() method - sealed to ensure serialization always happens.
     *
     * DO NOT OVERRIDE THIS METHOD in subclasses.
     * Instead, implement executeInternal() with your tool logic.
     *
     * This method:
     * 1. Calls executeInternal() with the input
     * 2. Takes whatever is returned
     * 3. Serializes it to a string using serializeResponse()
     * 4. Returns the string (what framework expects)
     *
     * @param input - The validated input from the tool schema
     * @returns Promise<string> - Serialized response
     * @final - Should not be overridden
     */
    async execute(input) {
        try {
            const result = await this.executeInternal(input);
            return this.serializeResponse(result);
        }
        catch (error) {
            return this.serializeError(error);
        }
    }
    // Helper to determine JSON schema type from Zod type
    _getJsonSchemaType(zodType) {
        // Handle Optional/Nullable wrappers by unwrapping
        if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
            return this._getJsonSchemaType(zodType.unwrap());
        }
        if (zodType instanceof z.ZodString)
            return "string";
        if (zodType instanceof z.ZodNumber)
            return "number";
        if (zodType instanceof z.ZodBoolean)
            return "boolean";
        if (zodType instanceof z.ZodArray)
            return "array";
        if (zodType instanceof z.ZodObject)
            return "object";
        if (zodType instanceof z.ZodEnum)
            return "string";
        return "string"; // Default fallback
    }
    // Override inputSchema to support both formats
    get inputSchema() {
        // Check if schema is the old format (object with type/description wrappers)
        // We check if the values have 'type' and 'description' properties
        const isOldFormat = this.schema &&
            typeof this.schema === "object" &&
            !(this.schema instanceof z.ZodObject) &&
            Object.values(this.schema).every((val) => val && typeof val === "object" && "type" in val && "description" in val);
        if (isOldFormat) {
            return super.inputSchema;
        }
        // New format: Zod object or plain object of Zod schemas
        const shape = this.schema instanceof z.ZodObject ? this.schema.shape : this.schema;
        return {
            type: "object",
            properties: Object.fromEntries(Object.entries(shape).map(([key, value]) => {
                return [
                    key,
                    {
                        type: this._getJsonSchemaType(value),
                        description: value.description, // Zod schemas have .description property
                    },
                ];
            })),
        };
    }
    // Override toolCall to handle validation for both formats
    // We must override this because validateInput is private in the base class
    async toolCall(request) {
        try {
            const args = request.params.arguments || {};
            let validatedInput;
            // Check if schema is the old format
            const isOldFormat = this.schema &&
                typeof this.schema === "object" &&
                !(this.schema instanceof z.ZodObject) &&
                Object.values(this.schema).every((val) => val && typeof val === "object" && "type" in val && "description" in val);
            if (isOldFormat) {
                // Re-implement old format validation
                const zodSchema = z.object(Object.fromEntries(Object.entries(this.schema).map(([key, schema]) => [
                    key,
                    schema.type,
                ])));
                validatedInput = zodSchema.parse(args);
            }
            else {
                // New format
                const zodSchema = this.schema instanceof z.ZodObject
                    ? this.schema
                    : z.object(this.schema);
                validatedInput = zodSchema.parse(args);
            }
            const result = await this.execute(validatedInput);
            return this.createSuccessResponse(result);
        }
        catch (error) {
            return this.createErrorResponse(error);
        }
    }
    /**
     * Converts any response type to string format for MCP framework.
     *
     * This is called automatically after executeInternal().
     * Can be overridden in subclasses for custom serialization.
     *
     * Default behavior:
     * - string → returned as-is
     * - object/array → JSON.stringify (pretty-printed)
     * - null/undefined → JSON representation
     * - other types → String(value)
     *
     * @param result - Any value returned from executeInternal()
     * @returns string - Serialized response
     * @protected - Override in subclasses for custom behavior
     *
     * @example
     * ```typescript
     * class CustomSerializationTool extends SerializingMCPTool {
     *   protected serializeResponse(result: any): string {
     *     // Custom: convert to markdown
     *     if (result.type === 'analysis') {
     *       return `## Analysis Results\n\n${result.summary}`;
     *     }
     *     // Fallback to default
     *     return super.serializeResponse(result);
     *   }
     * }
     * ```
     */
    serializeResponse(result) {
        // Already a string - return as-is
        if (typeof result === "string") {
            return result;
        }
        // Handle null/undefined
        if (result === null || result === undefined) {
            return JSON.stringify({
                success: true,
                message: "Operation completed successfully"
            });
        }
        // Handle objects/arrays - pretty print
        if (typeof result === "object") {
            return JSON.stringify(result, null, 2);
        }
        // Handle numbers, booleans, etc.
        return String(result);
    }
    /**
     * Handles errors from executeInternal().
     *
     * Can be overridden in subclasses for custom error formatting.
     *
     * Default behavior:
     * - Error objects → { success: false, error: message }
     * - Other types → JSON stringified
     *
     * @param error - Any error thrown in executeInternal()
     * @returns string - Serialized error response
     * @protected - Override in subclasses for custom behavior
     *
     * @example
     * ```typescript
     * class CustomErrorHandlingTool extends SerializingMCPTool {
     *   protected serializeError(error: any): string {
     *     // Log errors to your system
     *     console.error('Tool error:', error);
     *
     *     // Return user-friendly message
     *     return JSON.stringify({
     *       success: false,
     *       error: error.message || 'An error occurred',
     *       errorCode: error.code || 'UNKNOWN_ERROR'
     *     });
     *   }
     * }
     * ```
     */
    serializeError(error) {
        // Error objects
        if (error instanceof Error) {
            return JSON.stringify({
                success: false,
                error: error.message,
                errorName: error.name
            }, null, 2);
        }
        // Other types
        return JSON.stringify({
            success: false,
            error: String(error)
        }, null, 2);
    }
}
/**
 * MIGRATION GUIDE - Converting existing tools
 *
 * If you have a tool like this:
 *
 * ```typescript
 * class ApproveTransactionTool extends MCPTool {
 *   name = "approve_transaction";
 *   description = "Approves a transaction";
 *   schema = ApproveSchema;
 *
 *   async execute(input: Input) {
 *     // ...logic...
 *     return { success: true, id: "txn-123" };
 *   }
 * }
 * ```
 *
 * Convert to this:
 *
 * ```typescript
 * class ApproveTransactionTool extends SerializingMCPTool {
 *   name = "approve_transaction";
 *   description = "Approves a transaction";
 *   schema = ApproveSchema;
 *
 *   // Only change: execute → executeInternal
 *   protected async executeInternal(input: Input) {
 *     // ...logic (unchanged)...
 *     return { success: true, id: "txn-123" };  // ✅ Works!
 *   }
 * }
 * ```
 *
 * That's it! 3 changes:
 * 1. extends MCPTool → extends SerializingMCPTool
 * 2. async execute → protected async executeInternal
 * 3. Everything else stays the same
 *
 * TESTING:
 * ```bash
 * npm run build
 * ```
 *
 * If tools compiled before, they'll compile now.
 * Framework will handle serialization automatically.
 */ 
