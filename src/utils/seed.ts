import { TireReplacementTimeframe } from "@prisma/client";

const {
  PrismaClient,
  Role,
  Provider,
  TransmissionType,
  LoanOrLeaseStatus,
  PlannedSaleTime,
  ExteriorCondition,
  InteriorDamage,
  ConditionStatus,
  PlannedSaleTimeline,
  AdditionalDisclosures,
  TiresType,
  StatusReview,
} = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

function getRandomDate() {
  const now = new Date();
  const rand = Math.random();

  if (rand < 0.3) {
    // 30% kemungkinan mobil dibuat dalam minggu ini
    const daysAgo = Math.floor(Math.random() * 7);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  } else if (rand < 0.7) {
    // 40% kemungkinan mobil dibuat dalam bulan ini
    const daysAgo = Math.floor(Math.random() * 30);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  } else {
    // 30% kemungkinan dibuat sebelum bulan ini
    return faker.date.past(1); // 1 tahun terakhir
  }
}

async function main() {
  console.log("Seeding users...");

  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        isEmailVerified: faker.datatype.boolean(),
        provider: faker.helpers.arrayElement([
          Provider.Local,
          Provider.Google,
          Provider.Apple,
        ]),
        role: faker.helpers.arrayElement([Role.Admin, Role.User, Role.Visitor]),
        phoneNumber: `+1${faker.phone.number("##########")}`,
        isPhoneVerified: faker.datatype.boolean(),
        avatar: faker.image.avatar(),
      },
    });
    users.push(user);
  }

  console.log("Seeding cars...");

  // for (let i = 0; i < 20; i++) {
  //   await prisma.car.create({
  //     data: {
  //       userId: faker.helpers.arrayElement(users).id,
  //       slug: faker.lorem.slug(),
  //       vin: faker.vehicle.vin(),
  //       miliage: faker.number.int({ min: 1000, max: 200000 }),
  //       statusReview: faker.helpers.arrayElement(Object.values(StatusReview)),
  //       transmission_type: faker.helpers.arrayElement(
  //         Object.values(TransmissionType)
  //       ),
  //       isSoloOwner: faker.datatype.boolean(),
  //       color: faker.vehicle.color(),
  //       loanOrLeaseStatus: faker.helpers.arrayElement(
  //         Object.values(LoanOrLeaseStatus)
  //       ),
  //       loanCompany: faker.company.name(),
  //       remainingBalance: faker.number.int({ min: 0, max: 50000 }),
  //       isTradeIn: faker.datatype.boolean(),
  //       plannedSaleTime: faker.helpers.arrayElement(
  //         Object.values(PlannedSaleTime)
  //       ),
  //       additionalFeature: [faker.vehicle.type(), faker.vehicle.type()],
  //       exteriorCondition: faker.helpers.arrayElement(
  //         Object.values(ExteriorCondition)
  //       ),
  //       interiorDamage: faker.helpers.arrayElement(
  //         Object.values(InteriorDamage)
  //       ),
  //       additionalDisclosures: faker.helpers.arrayElement(
  //         Object.values(AdditionalDisclosures)
  //       ),
  //       keyCount: faker.number.int({ min: 1, max: 5 }),
  //       tireSetCount: faker.number.int({ min: 1, max: 4 }),
  //       tireReplacementTimeframe: faker.helpers.arrayElement(
  //         Object.values(TireReplacementTimeframe)
  //       ),
  //       tiresType: faker.helpers.arrayElement(Object.values(TiresType)),
  //       hasOriginalFactoryRims: faker.datatype.boolean(),
  //       hasMechanicalIssues: faker.datatype.boolean(),
  //       isDriveable: faker.datatype.boolean(),
  //       hasAccidentOrClaimStatus: faker.datatype.boolean(),
  //       overallConditionStatus: faker.helpers.arrayElement(
  //         Object.values(ConditionStatus)
  //       ),
  //       plannedSaleTimeline: faker.helpers.arrayElement(
  //         Object.values(PlannedSaleTimeline)
  //       ),
  //       createdAt: getRandomDate(),
  //     },
  //   });
  // }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
