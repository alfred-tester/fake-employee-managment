import { z } from 'zod';

export const CreateBranchDto = z.object({
  name: z.string({ error:'name is required' }).trim().min(1, 'name cannot be empty'),
  address: z.string().trim().min(1, 'address cannot be empty').optional(),
});

export const UpdateBranchDto = z.object({
  name: z.string({ error:'name is required' }).trim().min(1, 'name cannot be empty'),
  address: z.string().trim().min(1, 'address cannot be empty').optional(),
});

export type CreateBranchDto = z.infer<typeof CreateBranchDto>;
export type UpdateBranchDto = z.infer<typeof UpdateBranchDto>;
