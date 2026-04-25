export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Fake Employee Management API',
    version: '1.0.0',
    description:
      'REST API for managing companies, branches, and employees. Supports soft deletes and branch transfers.',
  },
  servers: [{ url: '/v1', description: 'Current version' }],

  tags: [
    { name: 'Health', description: 'Service status' },
    { name: 'Companies', description: 'Company management' },
    { name: 'Branches', description: 'Branch management (nested under a company)' },
    { name: 'Employees', description: 'Employee management (nested under a company)' },
  ],

  components: {
    parameters: {
      companyPublicId: {
        name: 'companyPublicId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Company public ID (UUID)',
      },
      branchPublicId: {
        name: 'publicId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Branch public ID (UUID)',
      },
      employeePublicId: {
        name: 'publicId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Employee public ID (UUID)',
      },
    },
    headers: {
      xDeleteAuth: {
        description: 'Authorization token required for all DELETE operations',
        schema: { type: 'string' },
        required: true,
      },
    },
    schemas: {
      // Timestamps mixin
      Timestamps: {
        type: 'object',
        properties: {
          created_at: { type: 'string', format: 'date-time', readOnly: true },
          updated_at: { type: 'string', format: 'date-time', nullable: true, readOnly: true },
          deleted_at: { type: 'string', format: 'date-time', nullable: true, readOnly: true },
        },
      },

      // Company
      Company: {
        allOf: [
          {
            type: 'object',
            properties: {
              public_id: { type: 'string', format: 'uuid', readOnly: true },
              name: { type: 'string', example: 'Acme Corp' },
            },
            required: ['public_id', 'name'],
          },
          { $ref: '#/components/schemas/Timestamps' },
        ],
      },
      CreateCompanyDto: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Acme Corp' },
        },
      },
      UpdateCompanyDto: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Acme Corp Renamed' },
        },
      },

      // Branch
      Branch: {
        allOf: [
          {
            type: 'object',
            properties: {
              public_id: { type: 'string', format: 'uuid', readOnly: true },
              company_id: { type: 'integer', readOnly: true },
              name: { type: 'string', example: 'Sucursal Norte' },
              address: { type: 'string', nullable: true, example: 'Av. Siempre Viva 123' },
            },
            required: ['public_id', 'name'],
          },
          { $ref: '#/components/schemas/Timestamps' },
        ],
      },
      CreateBranchDto: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Sucursal Norte' },
          address: { type: 'string', minLength: 1, example: 'Av. Siempre Viva 123' },
        },
      },
      UpdateBranchDto: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Sucursal Sur' },
          address: { type: 'string', minLength: 1, example: 'Calle Reforma 456' },
        },
      },

      // Employee
      Employee: {
        allOf: [
          {
            type: 'object',
            properties: {
              public_id: { type: 'string', format: 'uuid', readOnly: true },
              name: { type: 'string', example: 'Juan Pérez' },
              company_public_id: { type: 'string', format: 'uuid', readOnly: true },
              branch_public_id: { type: 'string', format: 'uuid' },
            },
            required: ['public_id', 'name', 'company_public_id', 'branch_public_id'],
          },
          { $ref: '#/components/schemas/Timestamps' },
        ],
      },
      CreateEmployeeDto: {
        type: 'object',
        required: ['name', 'branch_public_id'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Juan Pérez' },
          branch_public_id: {
            type: 'string',
            format: 'uuid',
            description: 'UUID of the branch this employee belongs to',
          },
        },
      },
      UpdateEmployeeDto: {
        type: 'object',
        description: 'At least one field is required. Use branch_public_id to transfer branches.',
        properties: {
          name: { type: 'string', minLength: 1, example: 'Juan Pérez Actualizado' },
          branch_public_id: {
            type: 'string',
            format: 'uuid',
            description: 'Transfer employee to this branch',
          },
        },
      },

      // Errors
      ValidationError: {
        type: 'object',
        properties: {
          errors: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            example: { name: ['name cannot be empty'] },
          },
        },
      },
      NotFoundError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Resource not found' },
        },
      },
      UnauthorizedError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'x_delete_auth header is required' },
        },
      },
      ForbiddenError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid x_delete_auth token' },
        },
      },
    },

    responses: {
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/NotFoundError' } } },
      },
      Unauthorized: {
        description: 'Missing x_delete_auth header',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UnauthorizedError' } } },
      },
      Forbidden: {
        description: 'Invalid x_delete_auth token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ForbiddenError' } } },
      },
      NoContent: {
        description: 'Operation successful, no content returned',
      },
    },
  },

  paths: {
    // ── Health ────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns the service status and validates the database connection.',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1' },
                    database: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Service unavailable — database connection failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    database: { type: 'string', example: 'unavailable' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Companies ─────────────────────────────────────────────────────────
    '/companies': {
      get: {
        tags: ['Companies'],
        summary: 'List all companies',
        description: 'Returns all active (non-deleted) companies.',
        operationId: 'listCompanies',
        responses: {
          200: {
            description: 'List of companies',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Companies'],
        summary: 'Create a company',
        operationId: 'createCompany',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateCompanyDto' } },
          },
        },
        responses: {
          201: {
            description: 'Company created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Company' } },
            },
          },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/companies/{companyPublicId}': {
      parameters: [{ $ref: '#/components/parameters/companyPublicId' }],
      get: {
        tags: ['Companies'],
        summary: 'Get a company',
        operationId: 'getCompany',
        responses: {
          200: {
            description: 'Company found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Company' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Companies'],
        summary: 'Update a company',
        operationId: 'updateCompany',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateCompanyDto' } },
          },
        },
        responses: {
          200: {
            description: 'Company updated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Company' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Companies'],
        summary: 'Delete a company',
        description:
          'Soft-deletes the company and all its branches. Requires the `x_delete_auth` header.',
        operationId: 'deleteCompany',
        parameters: [
          {
            name: 'x_delete_auth',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Delete authorization token (must match DELETE_AUTH_TOKEN env var)',
          },
        ],
        responses: {
          204: { $ref: '#/components/responses/NoContent' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Branches ──────────────────────────────────────────────────────────
    '/companies/{companyPublicId}/branches': {
      parameters: [{ $ref: '#/components/parameters/companyPublicId' }],
      get: {
        tags: ['Branches'],
        summary: 'List branches of a company',
        description: 'Returns all active branches belonging to the given company.',
        operationId: 'listBranches',
        responses: {
          200: {
            description: 'List of branches',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Branch' } },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Branches'],
        summary: 'Create a branch',
        operationId: 'createBranch',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateBranchDto' } },
          },
        },
        responses: {
          201: {
            description: 'Branch created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Branch' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/companies/{companyPublicId}/branches/{publicId}': {
      parameters: [
        { $ref: '#/components/parameters/companyPublicId' },
        { $ref: '#/components/parameters/branchPublicId' },
      ],
      get: {
        tags: ['Branches'],
        summary: 'Get a branch',
        operationId: 'getBranch',
        responses: {
          200: {
            description: 'Branch found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Branch' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Branches'],
        summary: 'Update a branch',
        operationId: 'updateBranch',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateBranchDto' } },
          },
        },
        responses: {
          200: {
            description: 'Branch updated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Branch' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Branches'],
        summary: 'Delete a branch',
        description: 'Soft-deletes the branch. Requires the `x_delete_auth` header.',
        operationId: 'deleteBranch',
        parameters: [
          {
            name: 'x_delete_auth',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Delete authorization token (must match DELETE_AUTH_TOKEN env var)',
          },
        ],
        responses: {
          204: { $ref: '#/components/responses/NoContent' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Employees ─────────────────────────────────────────────────────────
    '/companies/{companyPublicId}/employees': {
      parameters: [{ $ref: '#/components/parameters/companyPublicId' }],
      get: {
        tags: ['Employees'],
        summary: 'List employees of a company',
        description: 'Returns all active (non-fired) employees belonging to the given company.',
        operationId: 'listEmployees',
        responses: {
          200: {
            description: 'List of employees',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Employee' } },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Hire an employee',
        description: 'Creates a new employee and assigns them to a branch within the company.',
        operationId: 'createEmployee',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateEmployeeDto' } },
          },
        },
        responses: {
          201: {
            description: 'Employee hired',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Employee' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/companies/{companyPublicId}/employees/{publicId}': {
      parameters: [
        { $ref: '#/components/parameters/companyPublicId' },
        { $ref: '#/components/parameters/employeePublicId' },
      ],
      get: {
        tags: ['Employees'],
        summary: 'Get an employee',
        operationId: 'getEmployee',
        responses: {
          200: {
            description: 'Employee found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Employee' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Employees'],
        summary: 'Update an employee',
        description:
          'Updates the employee name and/or transfers them to a different branch. At least one field is required.',
        operationId: 'updateEmployee',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateEmployeeDto' } },
          },
        },
        responses: {
          200: {
            description: 'Employee updated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Employee' } },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Employees'],
        summary: 'Fire an employee',
        description:
          'Soft-deletes the employee (marks as fired). Requires the `x_delete_auth` header.',
        operationId: 'fireEmployee',
        parameters: [
          {
            name: 'x_delete_auth',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Delete authorization token (must match DELETE_AUTH_TOKEN env var)',
          },
        ],
        responses: {
          204: { $ref: '#/components/responses/NoContent' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};
