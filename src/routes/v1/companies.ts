import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../../db/connection';
import { validate } from '../../middleware/validate';
import { deleteAuth } from '../../middleware/deleteAuth';
import { CreateCompanyDto, UpdateCompanyDto } from '../../dtos/company.dto';
import { CreateBranchDto, UpdateBranchDto } from '../../dtos/branch.dto';

const NOW = () => new Date().toISOString();

const router = Router();

// Companies

router.get('/', (_req: Request, res: Response) => {
  const companies = db
    .prepare('SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY id')
    .all();
  res.json(companies);
});

router.get('/:publicId', (req: Request, res: Response) => {
  const company = db
    .prepare('SELECT * FROM companies WHERE public_id = ? AND deleted_at IS NULL')
    .get(req.params.publicId);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  res.json(company);
});

router.post('/', validate(CreateCompanyDto), (req: Request, res: Response) => {
  const { name } = req.body as CreateCompanyDto;
  const publicId = randomUUID();
  const result = db
    .prepare('INSERT INTO companies (public_id, name) VALUES (?, ?)')
    .run(publicId, name);
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(company);
});

router.put('/:publicId', validate(UpdateCompanyDto), (req: Request, res: Response) => {
  const { name } = req.body as UpdateCompanyDto;
  const result = db
    .prepare(
      'UPDATE companies SET name = ?, updated_at = ? WHERE public_id = ? AND deleted_at IS NULL',
    )
    .run(name, NOW(), req.params.publicId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const company = db
    .prepare('SELECT * FROM companies WHERE public_id = ?')
    .get(req.params.publicId);
  res.json(company);
});

router.delete('/:publicId', deleteAuth, (req: Request, res: Response) => {
  const now = NOW();
  const softDelete = db.transaction((publicId: string) => {
    const company = db
      .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
      .get(publicId) as { id: number } | undefined;
    if (!company) return 0;
    db.prepare(
      'UPDATE branches SET deleted_at = ? WHERE company_id = ? AND deleted_at IS NULL',
    ).run(now, company.id);
    return db
      .prepare('UPDATE companies SET deleted_at = ? WHERE id = ?')
      .run(now, company.id).changes;
  });

  const changes = softDelete(req.params.publicId as string);
  if (changes === 0) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  res.status(204).send();
});

// Branches

router.get('/:companyPublicId/branches', (req: Request, res: Response) => {
  const company = db
    .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
    .get(req.params.companyPublicId) as { id: number } | undefined;
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const branches = db
    .prepare('SELECT * FROM branches WHERE company_id = ? AND deleted_at IS NULL ORDER BY id')
    .all(company.id);
  res.json(branches);
});

router.get('/:companyPublicId/branches/:publicId', (req: Request, res: Response) => {
  const company = db
    .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
    .get(req.params.companyPublicId) as { id: number } | undefined;
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const branch = db
    .prepare(
      'SELECT * FROM branches WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL',
    )
    .get(req.params.publicId, company.id);
  if (!branch) {
    res.status(404).json({ error: 'Branch not found' });
    return;
  }
  res.json(branch);
});

router.post(
  '/:companyPublicId/branches',
  validate(CreateBranchDto),
  (req: Request, res: Response) => {
    const company = db
      .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
      .get(req.params.companyPublicId) as { id: number } | undefined;
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const { name, address } = req.body as CreateBranchDto;
    const publicId = randomUUID();
    const result = db
      .prepare('INSERT INTO branches (public_id, company_id, name, address) VALUES (?, ?, ?, ?)')
      .run(publicId, company.id, name, address ?? null);
    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(branch);
  },
);

router.put(
  '/:companyPublicId/branches/:publicId',
  validate(UpdateBranchDto),
  (req: Request, res: Response) => {
    const company = db
      .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
      .get(req.params.companyPublicId) as { id: number } | undefined;
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const { name, address } = req.body as UpdateBranchDto;
    const result = db
      .prepare(
        `UPDATE branches SET name = ?, address = ?, updated_at = ?
         WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL`,
      )
      .run(name, address ?? null, NOW(), req.params.publicId, company.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }
    const branch = db
      .prepare('SELECT * FROM branches WHERE public_id = ?')
      .get(req.params.publicId);
    res.json(branch);
  },
);

router.delete('/:companyPublicId/branches/:publicId', deleteAuth, (req: Request, res: Response) => {
  const company = db
    .prepare('SELECT id FROM companies WHERE public_id = ? AND deleted_at IS NULL')
    .get(req.params.companyPublicId) as { id: number } | undefined;
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const result = db
    .prepare(
      'UPDATE branches SET deleted_at = ? WHERE public_id = ? AND company_id = ? AND deleted_at IS NULL',
    )
    .run(NOW(), req.params.publicId, company.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Branch not found' });
    return;
  }
  res.status(204).send();
});

export default router;
