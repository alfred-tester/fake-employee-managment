import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../../db/connection';
import { validate } from '../../middleware/validate';
import { deleteAuth } from '../../middleware/deleteAuth';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../../dtos/employee.dto';

const NOW = () => new Date().toISOString();

type Company = { id: number };
type Branch = { id: number };

const router = Router({ mergeParams: true });

const SELECT_EMPLOYEE = `
  SELECT
    e.public_id,
    e.name,
    c.public_id AS company_public_id,
    b.public_id AS branch_public_id,
    e.created_at,
    e.updated_at,
    e.deleted_at
  FROM employees e
  JOIN companies c ON c.id = e.company_id
  JOIN branches b ON b.id = e.branch_id
`;

function resolveCompany(publicId: string): Company | undefined {
  return db
    .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
    .get(publicId) as Company | undefined;
}

function resolveBranch(branchPublicId: string, companyId: number): Branch | undefined {
  return db
    .prepare(
      'SELECT id FROM branches WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL',
    )
    .get(branchPublicId, companyId) as Branch | undefined;
}

router.get('/', (req: Request, res: Response) => {
  const company = resolveCompany(req.params.companyPublicId as string);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const employees = db
    .prepare(`${SELECT_EMPLOYEE} WHERE e.company_id = ? AND e.deleted_at IS NULL ORDER BY e.id`)
    .all(company.id);
  res.json(employees);
});

router.get('/:publicId', (req: Request, res: Response) => {
  const company = resolveCompany(req.params.companyPublicId as string);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const employee = db
    .prepare(
      `${SELECT_EMPLOYEE} WHERE e.public_id = ? AND e.company_id = ? AND e.deleted_at IS NULL`,
    )
    .get(req.params.publicId, company.id);
  if (!employee) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }
  res.json(employee);
});

router.post('/', validate(CreateEmployeeDto), (req: Request, res: Response) => {
  const company = resolveCompany(req.params.companyPublicId as string);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const { name, branch_public_id } = req.body as CreateEmployeeDto;
  const branch = resolveBranch(branch_public_id, company.id);
  if (!branch) {
    res.status(404).json({ error: 'Branch not found' });
    return;
  }
  const publicId = randomUUID();
  const result = db
    .prepare('INSERT INTO employees (public_id, company_id, branch_id, name) VALUES (?, ?, ?, ?)')
    .run(publicId, company.id, branch.id, name);
  const employee = db.prepare(`${SELECT_EMPLOYEE} WHERE e.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(employee);
});

router.put('/:publicId', validate(UpdateEmployeeDto), (req: Request, res: Response) => {
  const company = resolveCompany(req.params.companyPublicId as string);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const { name, branch_public_id } = req.body as UpdateEmployeeDto;

  const current = db
    .prepare(
      'SELECT id, name, branch_id FROM employees WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL',
    )
    .get(req.params.publicId, company.id) as
    | { id: number; name: string; branch_id: number }
    | undefined;
  if (!current) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }

  let branchId = current.branch_id;
  if (branch_public_id) {
    const branch = resolveBranch(branch_public_id, company.id);
    if (!branch) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }
    branchId = branch.id;
  }

  db.prepare(
    `UPDATE employees SET name = ?, branch_id = ?, updated_at = ?
     WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL`,
  ).run(name ?? current.name, branchId, NOW(), req.params.publicId, company.id);

  const employee = db
    .prepare(`${SELECT_EMPLOYEE} WHERE e.public_id = ?`)
    .get(req.params.publicId);
  res.json(employee);
});

router.delete('/:publicId', deleteAuth, (req: Request, res: Response) => {
  const company = resolveCompany(req.params.companyPublicId as string);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const result = db
    .prepare(
      `UPDATE employees SET deleted_at = ?
       WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL`,
    )
    .run(NOW(), req.params.publicId, company.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }
  res.status(204).send();
});

export default router;
