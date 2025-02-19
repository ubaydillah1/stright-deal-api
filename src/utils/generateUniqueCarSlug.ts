import slugify from "slugify";
import prisma from "../config/prismaClient";

export default async function generateUniqueSlug(
  carName: string
): Promise<string> {
  let slug = slugify(carName, { lower: true, strict: true });
  let existingCar = await prisma.car.findFirst({
    where: { slug: { startsWith: slug } },
  });

  let newSlug = slug;
  let counter = 1;

  while (existingCar) {
    newSlug = `${slug}::${counter}`;
    counter++;
    existingCar = await prisma.car.findFirst({ where: { slug: newSlug } });
  }

  return newSlug;
}
