import { z } from 'zod';

export const CreateEmployeeDto = z.object({
  name: z.string({ error:'name is required' }).trim().min(1, 'name cannot be empty'),
  branch_public_id: z
    .string({ error:'branch_public_id is required' })
    .uuid('branch_public_id must be a valid UUID'),
});

export const UpdateEmployeeDto = z
  .object({
    name: z.string().trim().min(1, 'name cannot be empty').optional(),
    branch_public_id: z.string().uuid('branch_public_id must be a valid UUID').optional(),
  })
  .refine((data) => data.name !== undefined || data.branch_public_id !== undefined, {
    message: 'At least one of name or branch_public_id is required',
  });

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeDto>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeDto>;
