import { z } from 'zod';

export const CreateCompanyDto = z.object({
  name: z.string({ error:'name is required' }).trim().min(1, 'name cannot be empty'),
});

export const UpdateCompanyDto = z.object({
  name: z.string({ error:'name is required' }).trim().min(1, 'name cannot be empty'),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanyDto>;
export type UpdateCompanyDto = z.infer<typeof UpdateCompanyDto>;
