const { execSync } = require('child_process');

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
  let port = process.env.DB_PORT || '5432';
  if (port.startsWith('tcp://')) {
    port = '5432';
  }
  const encodedUser = encodeURIComponent(process.env.DB_USER);
  const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD);
  dbUrl = `postgresql://${encodedUser}:${encodedPassword}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}?sslmode=verify-full&sslrootcert=./global-bundle.pem`;
}

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log('Running Prisma DB Push...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  } catch (err) {
    console.error('Migration failed');
    process.exit(1);
  }
} else {
  console.log('No DB configuration provided. Skipping migrations.');
}
