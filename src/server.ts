import app from './app';
import db from './db/connection';

if (!process.env.DELETE_AUTH_TOKEN) {
  console.error('Missing required env var: DELETE_AUTH_TOKEN');
  process.exit(1);
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database open: ${db.name}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
