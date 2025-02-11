// import {
//   PrismaClient,
//   StatusReview,
//   TransmissionType,
//   LoanOrLeaseStatus,
//   PlannedSaleTime,
//   ExteriorCondition,
//   InteriorDamage,
//   TireReplacementTimeframe,
//   ConditionStatus,
//   PlannedSaleTimeline,
//   Provider,
//   Role,
// } from "@prisma/client";
// import { faker } from "@faker-js/faker";

// const prisma = new PrismaClient();

// async function main() {
//   // Ambil user ID yang baru dibuat
//   const allUsers = await prisma.user.findMany();

//   // Buat 10 dummy data mobil (Car)
//   const cars = Array.from({ length: 10 }).map(() => ({
//     slug: faker.lorem.slug(),
//     miliage: faker.number.int({ min: 1000, max: 200000 }),
//     statusReview: faker.helpers.arrayElement(Object.values(StatusReview)),
//     transmission_type: faker.helpers.arrayElement(
//       Object.values(TransmissionType)
//     ),
//     isSoloOwner: faker.datatype.boolean(),
//     color: faker.vehicle.color(),
//     loanOrLeaseStatus: faker.helpers.arrayElement(
//       Object.values(LoanOrLeaseStatus)
//     ),
//     isTradeIn: faker.datatype.boolean(),
//     plannedSaleTime: faker.helpers.arrayElement(Object.values(PlannedSaleTime)),
//     additionalFeature: [faker.vehicle.fuel(), faker.vehicle.manufacturer()],
//     exteriorCondition: faker.helpers.arrayElement(
//       Object.values(ExteriorCondition)
//     ),
//     interiorDamage: faker.helpers.arrayElement(Object.values(InteriorDamage)),
//     keyCount: faker.number.int({ min: 1, max: 3 }),
//     tireSetCount: faker.number.int({ min: 1, max: 4 }),
//     tireReplacementTimeframe: faker.helpers.arrayElement(
//       Object.values(TireReplacementTimeframe)
//     ),
//     hasOriginalFactoryRims: faker.datatype.boolean(),
//     hasMechanicalIssues: faker.datatype.boolean(),
//     isDriveable: faker.datatype.boolean(),
//     hasAccidentOrClaimStatus: faker.datatype.boolean(),
//     overallConditionStatus: faker.helpers.arrayElement(
//       Object.values(ConditionStatus)
//     ),
//     plannedSaleTimeline: faker.helpers.arrayElement(
//       Object.values(PlannedSaleTimeline)
//     ),
//     userId: allUsers.length ? faker.helpers.arrayElement(allUsers).id : null,
//   }));

//   await prisma.car.createMany({ data: cars });

//   console.log("✅ 5 Dummy Users & 10 Dummy Cars berhasil dibuat!");
// }

// main()
//   .catch((e) => console.error(e))
//   .finally(() => prisma.$disconnect());
