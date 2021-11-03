import * as argon from 'argon2';

import { prisma } from '../db';

const seedDatabase = async () => {
  try {
    const password = await argon.hash('Password1!');

    await prisma.user.create({
      data: {
        firstName: 'Clayton',
        lastName: 'Ray',
        email: 'iamclaytonray@gmail.com',
        password,
      },
    });

    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedDatabase();
