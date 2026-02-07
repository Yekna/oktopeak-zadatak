export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Medication Inventory API",
    description:
      "API for tracking controlled-substance medication inventory, transactions (checkout/return/waste), and audit logs.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
  paths: {
    "/api/medications": {
      get: {
        tags: ["Medications"],
        summary: "List medications",
        description:
          "Returns a paginated list of medications, optionally filtered by DEA schedule.",
        parameters: [
          {
            name: "schedule",
            in: "query",
            description: "Filter by DEA schedule",
            schema: { $ref: "#/components/schemas/Schedule" },
          },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Paginated list of medications",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Medication" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      post: {
        tags: ["Medications"],
        summary: "Create a medication",
        description: "Creates a new medication entry in the inventory.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMedication" },
            },
          },
        },
        responses: {
          "201": {
            description: "Medication created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Medication" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },

    "/api/medications/{id}": {
      get: {
        tags: ["Medications"],
        summary: "Get medication by ID",
        description:
          "Returns a single medication with its full transaction history.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Medication UUID",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Medication with transactions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/MedicationWithTransactions",
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/transactions": {
      post: {
        tags: ["Transactions"],
        summary: "Create a transaction",
        description:
          "Records a medication checkout, return, or waste. Updates stock automatically for CHECKOUT (decrement) and RETURN (increment). WASTE requires notes. Nurse and witness must be different users.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTransaction" },
            },
          },
        },
        responses: {
          "201": {
            description: "Transaction created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      $ref: "#/components/schemas/TransactionWithRelations",
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      get: {
        tags: ["Transactions"],
        summary: "List transactions",
        description:
          "Returns a paginated list of transactions, optionally filtered by type and/or medication ID.",
        parameters: [
          {
            name: "type",
            in: "query",
            description: "Filter by transaction type",
            schema: { $ref: "#/components/schemas/TransactionType" },
          },
          {
            name: "medicationId",
            in: "query",
            description: "Filter by medication UUID",
            schema: { type: "string", format: "uuid" },
          },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Paginated list of transactions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/TransactionWithRelations",
                      },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },

    "/api/audit-log": {
      get: {
        tags: ["Audit Log"],
        summary: "List audit log entries",
        description:
          "Returns a paginated list of audit log entries, optionally filtered by entity type.",
        parameters: [
          {
            name: "entityType",
            in: "query",
            description: 'Filter by entity type (e.g. "Transaction")',
            schema: { type: "string" },
          },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Paginated list of audit log entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/AuditLogWithPerformedBy",
                      },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
  },

  components: {
    schemas: {
      Schedule: {
        type: "string",
        enum: ["II", "III", "IV", "V"],
        description: "DEA controlled substance schedule",
      },
      MedicationUnit: {
        type: "string",
        enum: ["mg", "ml", "mcg"],
      },
      TransactionType: {
        type: "string",
        enum: ["CHECKOUT", "RETURN", "WASTE"],
      },
      UserRole: {
        type: "string",
        enum: ["NURSE", "WITNESS", "ADMIN"],
      },

      UserSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },

      Medication: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Morphine Sulfate" },
          schedule: { $ref: "#/components/schemas/Schedule" },
          unit: { $ref: "#/components/schemas/MedicationUnit" },
          stockQuantity: { type: "number", example: 100 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      MedicationWithTransactions: {
        allOf: [
          { $ref: "#/components/schemas/Medication" },
          {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/TransactionSummary",
                },
              },
            },
          },
        ],
      },

      TransactionSummary: {
        type: "object",
        description:
          "Transaction as returned within a medication's transaction list",
        properties: {
          id: { type: "string", format: "uuid" },
          medicationId: { type: "string", format: "uuid" },
          nurseId: { type: "string", format: "uuid" },
          witnessId: { type: "string", format: "uuid" },
          type: { $ref: "#/components/schemas/TransactionType" },
          quantity: { type: "number" },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          nurse: { $ref: "#/components/schemas/UserSummary" },
          witness: { $ref: "#/components/schemas/UserSummary" },
        },
      },

      TransactionWithRelations: {
        type: "object",
        description: "Transaction with related medication, nurse, and witness",
        properties: {
          id: { type: "string", format: "uuid" },
          medicationId: { type: "string", format: "uuid" },
          nurseId: { type: "string", format: "uuid" },
          witnessId: { type: "string", format: "uuid" },
          type: { $ref: "#/components/schemas/TransactionType" },
          quantity: { type: "number" },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          medication: { $ref: "#/components/schemas/Medication" },
          nurse: { $ref: "#/components/schemas/UserSummary" },
          witness: { $ref: "#/components/schemas/UserSummary" },
        },
      },

      CreateMedication: {
        type: "object",
        required: ["name", "schedule", "slug", "unit"],
        properties: {
          name: { type: "string", example: "Morphine Sulfate" },
          schedule: { $ref: "#/components/schemas/Schedule" },
          slug: { type: "string", example: "morphine-sulfate" },
          stockQuantity: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Defaults to 0 if not provided",
          },
          unit: { $ref: "#/components/schemas/MedicationUnit" },
        },
      },

      CreateTransaction: {
        type: "object",
        required: [
          "medicationId",
          "nurseId",
          "witnessId",
          "type",
          "quantity",
        ],
        properties: {
          medicationId: { type: "string", format: "uuid" },
          nurseId: {
            type: "string",
            format: "uuid",
            description: "Must be different from witnessId",
          },
          witnessId: {
            type: "string",
            format: "uuid",
            description: "Must be different from nurseId",
          },
          type: { $ref: "#/components/schemas/TransactionType" },
          quantity: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Must be a positive number",
          },
          notes: {
            type: "string",
            description: "Required when type is WASTE",
          },
        },
      },

      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          action: { type: "string", example: "TRANSACTION_CHECKOUT" },
          entityType: { type: "string", example: "Transaction" },
          entityId: { type: "string", format: "uuid" },
          performedById: { type: "string", format: "uuid" },
          details: { type: "object" },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      AuditLogWithPerformedBy: {
        allOf: [
          { $ref: "#/components/schemas/AuditLog" },
          {
            type: "object",
            properties: {
              performedBy: { $ref: "#/components/schemas/UserSummary" },
            },
          },
        ],
      },

      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { $ref: "#/components/schemas/UserRole" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 50 },
          totalPages: { type: "integer", example: 3 },
        },
      },

      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },

      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: {
                  type: "array",
                  items: { type: "string" },
                },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },

    parameters: {
      page: {
        name: "page",
        in: "query",
        description: "Page number (starts at 1)",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      limit: {
        name: "limit",
        in: "query",
        description: "Items per page (max 100)",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    },

    responses: {
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationError" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
};
