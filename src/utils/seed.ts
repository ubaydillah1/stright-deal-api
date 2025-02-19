// prisma/seed.js

const { PrismaClient, Role, Provider } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

async function main() {
  // Membuat 10 user menggunakan faker
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(), // jangan lupa untuk hash password di dunia nyata
        isEmailVerified: faker.datatype.boolean(),
        provider: faker.helpers.arrayElement([
          Provider.Local,
          Provider.Google,
          Provider.Apple,
        ]),
        role: faker.helpers.arrayElement([Role.Admin, Role.User, Role.Visitor]),
        phoneNumber: `+1${faker.phone.number("##########")}`, // Format nomor telepon sesuai dengan contoh +121212
        isPhoneVerified: faker.datatype.boolean(),
        avatar: faker.image.avatar(),
      },
    });

    console.log(`User Created: ${user.firstName} ${user.lastName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
