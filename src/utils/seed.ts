// import {
//   PrismaClient,
//   Role,
//   Provider,
//   TransmissionType,
//   LoanOrLeaseStatus,
//   PlannedSaleTime,
//   ExteriorCondition,
//   InteriorDamage,
//   ConditionStatus,
//   PlannedSaleTimeline,
//   AdditionalDisclosures,
//   TiresType,
//   StatusReview,
//   TireReplacementTimeframe,
//   AdditionalFeatures,
//   ActionType,
// } from "@prisma/client";
// import { faker } from "@faker-js/faker";

// const prisma = new PrismaClient();

// function getRandomDate() {
//   const now = new Date();
//   const rand = Math.random();

//   if (rand < 0.3) {
//     // 30% kemungkinan dibuat dalam minggu ini
//     const daysAgo = Math.floor(Math.random() * 7);
//     return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
//   } else if (rand < 0.7) {
//     // 40% kemungkinan dibuat dalam bulan ini
//     const daysAgo = Math.floor(Math.random() * 30);
//     return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
//   } else {
//     // 30% kemungkinan dibuat sebelum bulan ini
//     return faker.date.past({ years: 1 }); // 1 tahun terakhir
//   }
// }

// async function main() {
//   console.log("Seeding users...");

//   const users = [];
//   for (let i = 0; i < 10; i++) {
//     const user = await prisma.user.create({
//       data: {
//         email: faker.internet.email(),
//         firstName: faker.person.firstName(),
//         lastName: faker.person.lastName(),
//         password: faker.internet.password(),
//         isEmailVerified: faker.datatype.boolean(),
//         provider: faker.helpers.arrayElement(Object.values(Provider)),
//         role: faker.helpers.arrayElement(Object.values(Role)),
//         phoneNumber: `+1${faker.phone.number()}`,
//         isPhoneVerified: faker.datatype.boolean(),
//         avatar: faker.image.avatar(),
//       },
//     });
//     users.push(user);
//   }

//   console.log("Seeding cars...");

//   const cars = [];
//   for (let i = 0; i < 20; i++) {
//     const car = await prisma.car.create({
//       data: {
//         userId: faker.helpers.arrayElement(users).id,
//         slug: faker.lorem.slug(),
//         vin: faker.vehicle.vin(),
//         miliage: faker.number.int({ min: 1000, max: 200000 }),
//         statusReview: faker.helpers.arrayElement(Object.values(StatusReview)),
//         transmissionType: faker.helpers.arrayElement(
//           Object.values(TransmissionType)
//         ),
//         isSoleOwner: faker.datatype.boolean(),
//         color: faker.vehicle.color(),
//         loanOrLeaseStatus: faker.helpers.arrayElement(
//           Object.values(LoanOrLeaseStatus)
//         ),
//         loanCompany: faker.company.name(),
//         remainingBalance: faker.number.int({ min: 0, max: 50000 }),
//         monthlyPayment: faker.number.int({ min: 100, max: 1000 }),
//         monthsRemaining: faker.number.int({ min: 1, max: 60 }),
//         purchaseOptionAmount: faker.number.int({ min: 1000, max: 20000 }),
//         isTradeIn: faker.datatype.boolean(),
//         plannedSaleTime: faker.helpers.arrayElement(
//           Object.values(PlannedSaleTime)
//         ),
//         additionalFeatures: faker.helpers.arrayElements(
//           Object.values(AdditionalFeatures),
//           { min: 1, max: 3 }
//         ),
//         anyAdditionalFeatures: faker.lorem.sentence(),
//         exteriorCondition: faker.helpers.arrayElements(
//           Object.values(ExteriorCondition),
//           { min: 1, max: 3 }
//         ),
//         interiorDamage: faker.helpers.arrayElements(
//           Object.values(InteriorDamage),
//           { min: 1, max: 3 }
//         ),
//         additionalDisclosures: faker.helpers.arrayElement(
//           Object.values(AdditionalDisclosures)
//         ),
//         keyCount: faker.number.int({ min: 1, max: 5 }),
//         tireSetCount: faker.number.int({ min: 1, max: 4 }),
//         tireReplacementTimeframe: faker.helpers.arrayElement(
//           Object.values(TireReplacementTimeframe)
//         ),
//         tiresType: faker.helpers.arrayElement(Object.values(TiresType)),
//         hasOriginalFactoryRims: faker.datatype.boolean(),
//         hasMechanicalIssues: faker.datatype.boolean(),
//         isDriveable: faker.datatype.boolean(),
//         hasAccidentOrClaimStatus: faker.datatype.boolean(),
//         overallConditionStatus: faker.helpers.arrayElement(
//           Object.values(ConditionStatus)
//         ),
//         plannedSaleTimeline: faker.helpers.arrayElement(
//           Object.values(PlannedSaleTimeline)
//         ),
//         seen: faker.datatype.boolean(),
//         notes: faker.lorem.sentence(),
//         createdAt: getRandomDate(),
//       },
//     });
//     cars.push(car);
//   }

//   console.log("Seeding car images...");

//   for (const car of cars) {
//     for (let i = 0; i < 3; i++) {
//       await prisma.carImage.create({
//         data: {
//           carId: car.id,
//           imageUrl: faker.image.urlLoremFlickr({ category: "car" }),
//         },
//       });
//     }
//   }

//   console.log("Seeding activity logs...");

//   const activityLogs = [];
//   for (const car of cars) {
//     const activityLog = await prisma.activityLog.create({
//       data: {
//         carId: car.id,
//         notes: faker.lorem.sentence(),
//         actionType: faker.helpers.arrayElement(Object.values(ActionType)),
//         statusReviewLog: faker.helpers.arrayElement(
//           Object.values(StatusReview)
//         ),
//       },
//     });
//     activityLogs.push(activityLog);
//   }

//   console.log("Seeding notifications...");

//   for (const activityLog of activityLogs) {
//     await prisma.notification.create({
//       data: {
//         carId: activityLog.carId,
//         activityLogId: activityLog.id,
//       },
//     });
//   }

//   console.log("Seeding completed!");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
