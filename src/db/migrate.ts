import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
