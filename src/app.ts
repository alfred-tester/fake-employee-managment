import express, { Application } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import './db/schema';
import { openApiSpec } from './docs/openapi';
import healthRouter from './routes/v1/health';
import companiesRouter from './routes/v1/companies';
import employeesRouter from './routes/v1/employees';

const app: Application = express();

app.use(express.json());

app.use('/v1/health', healthRouter);
app.use('/v1/companies', companiesRouter);
app.use('/v1/companies/:companyPublicId/employees', employeesRouter);

app.get('/openapi.json', (_req, res) => res.json(openApiSpec));

app.use(
  '/docs',
  apiReference({
    url: '/openapi.json',
    theme: 'default',
  }),
);

export default app;
