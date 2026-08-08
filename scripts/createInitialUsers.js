const db = require('../database');
const { hashPassword } = require('../utils/passwordUtils');

async function createInitialUsers() {
  try {
    console.log('Creating initial users...');

    const existingUsers = await db.getAllUsers();
    if (existingUsers.length > 0) {
      console.log('Users already exist. Skipping creation.');
      process.exit(0);
    }

    const users = [
      {
        username: 'owner',
        email: 'owner@eaucure.com',
        password: 'owner_password',
        role: 'owner',
      },
      {
        username: 'agustino',
        email: 'agustinoliearbolante19@gmail.com',
        password: 'software_engineer_password',
        role: 'software_engineer',
      },
      {
        username: 'admin1',
        email: 'admin1@eaucure.com',
        password: 'admin1_password',
        role: 'admin',
      },
      {
        username: 'admin2',
        email: 'admin2@eaucure.com',
        password: 'admin2_password',
        role: 'admin',
      },
    ];

    for (const user of users) {
      const hash = await hashPassword(user.password);
      const userId = await db.createUser(user.username, user.email, hash, user.role);
      console.log(`Created user: ${user.username} (ID: ${userId}, Role: ${user.role})`);
    }

    console.log('Initial users created successfully!');
    console.log('\nDefault Credentials:');
    console.log('-------------------');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.username} / ${user.password}`);
    });
    console.log('\n⚠️  IMPORTANT: Change all passwords immediately in production!');

    process.exit(0);
  } catch (err) {
    console.error('Error creating users:', err);
    process.exit(1);
  }
}

createInitialUsers();
