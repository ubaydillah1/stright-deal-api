import {
  ConditionStatus,
  ExteriorCondition,
  InteriorDamage,
  LoanOrLeaseStatus,
  PlannedSaleTimeline,
  TiresType,
} from "@prisma/client";
import prisma from "../config/prismaClient";
import { Response, Request } from "express";
import { supabase } from "../config/supabaseClient";
import { AuthenticatedRequest } from "../middlewares/authorize";
import { FileArray, UploadedFile } from "express-fileupload";

export interface FilesRequest extends AuthenticatedRequest {
  files?: FileArray | null;
}

function isValidEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown
): boolean {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

function getEnumValues<T extends Record<string, string | number>>(
  enumObj: T
): string[] {
  return Object.values(enumObj).map(String);
}

export async function createCarForm(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  const {
    vin,
    miliage,
    loanOrLeaseStatus,
    loanCompany,
    remainingBalance,
    monthlyPayment,
    monthsRemaining,
    purchaseOptionAmount,
    anyAftermarketFeatures,
    exteriorCondition,
    interiorDamage,
    tiresType,
    isInvolvedAccidentInsurance,
    amountClaimed,
    overallConditionStatus,
    plannedSaleTimeline,
    year,
    make,
    model,
    trim,
    lowerPrice,
    higherPrice,
    postalCode,
    city,
    province,
  } = req.body;

  // **Cek Required Fields**
  const requiredFields = [
    "vin",
    "year",
    "make",
    "model",
    "trim",
    "miliage",
    "loanOrLeaseStatus",
    "exteriorCondition",
    "interiorDamage",
    "tiresType",
    "isInvolvedAccidentInsurance",
    "overallConditionStatus",
    "plannedSaleTimeline",
    "lowerPrice",
    "higherPrice",
    "postalCode",
    "city",
    "province",
  ];

  const missingFields = requiredFields.filter(
    (field) => req.body[field] === undefined
  );

  if (missingFields.length > 0) {
    res.status(400).json({
      message: "Missing required fields",
      missingFields,
    });
    return;
  }

  // **Cek Tipe Data**
  const typeErrors: string[] = [];

  if (typeof vin !== "string") typeErrors.push("vin must be a string");
  if (typeof miliage !== "number") typeErrors.push("miliage must be a number");
  if (typeof year !== "number") typeErrors.push("year must be a number");
  if (typeof isInvolvedAccidentInsurance !== "boolean")
    typeErrors.push("isInvolvedAccidentInsurance must be a boolean");
  if (remainingBalance !== undefined && typeof remainingBalance !== "number")
    typeErrors.push("remainingBalance must be a number");
  if (monthlyPayment !== undefined && typeof monthlyPayment !== "number")
    typeErrors.push("monthlyPayment must be a number");
  if (monthsRemaining !== undefined && typeof monthsRemaining !== "number")
    typeErrors.push("monthsRemaining must be a number");
  if (lowerPrice !== undefined && typeof lowerPrice !== "number")
    typeErrors.push("lowerPrice must be a number");
  if (higherPrice !== undefined && typeof higherPrice !== "number")
    typeErrors.push("higherPrice must be a number");
  if (
    purchaseOptionAmount !== undefined &&
    typeof purchaseOptionAmount !== "number"
  )
    typeErrors.push("purchaseOptionAmount must be a number");

  if (!Array.isArray(exteriorCondition))
    typeErrors.push("exteriorCondition must be an array");
  if (!Array.isArray(interiorDamage))
    typeErrors.push("interiorDamage must be an array");

  if (typeErrors.length > 0) {
    res.status(400).json({
      message: "Invalid data types",
      errors: typeErrors,
    });
    return;
  }

  // **Cek Validitas Enum**
  const enumErrors: string[] = [];

  if (!isValidEnumValue(LoanOrLeaseStatus, loanOrLeaseStatus)) {
    enumErrors.push(
      `Invalid loanOrLeaseStatus: "${loanOrLeaseStatus}". Available options: ${getEnumValues(
        LoanOrLeaseStatus
      ).join(", ")}`
    );
  }
  if (!isValidEnumValue(ConditionStatus, overallConditionStatus)) {
    enumErrors.push(
      `Invalid overallConditionStatus: "${overallConditionStatus}". Available options: ${getEnumValues(
        ConditionStatus
      ).join(", ")}`
    );
  }
  if (!isValidEnumValue(PlannedSaleTimeline, plannedSaleTimeline)) {
    enumErrors.push(
      `Invalid plannedSaleTimeline: "${plannedSaleTimeline}". Available options: ${getEnumValues(
        PlannedSaleTimeline
      ).join(", ")}`
    );
  }
  if (!isValidEnumValue(TiresType, tiresType)) {
    enumErrors.push(
      `Invalid tiresType: "${tiresType}". Available options: ${getEnumValues(
        TiresType
      ).join(", ")}`
    );
  }

  const invalidExterior = exteriorCondition.filter(
    (item: unknown) => !isValidEnumValue(ExteriorCondition, item)
  );
  if (invalidExterior.length > 0) {
    enumErrors.push(
      `Invalid exteriorCondition values: ${invalidExterior.join(
        ", "
      )}. Available options: ${getEnumValues(ExteriorCondition).join(", ")}`
    );
  }

  const invalidInterior = interiorDamage.filter(
    (item: unknown) => !isValidEnumValue(InteriorDamage, item)
  );
  if (invalidInterior.length > 0) {
    enumErrors.push(
      `Invalid interiorDamage values: ${invalidInterior.join(
        ", "
      )}. Available options: ${getEnumValues(InteriorDamage).join(", ")}`
    );
  }

  if (enumErrors.length > 0) {
    res.status(400).json({
      message: "Enum validation errors",
      errors: enumErrors,
    });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      res.status(404).json({
        message: "User not found",
        error: `No user with id ${userId} exists.`,
      });
      return;
    }

    const newCar = await prisma.car.create({
      data: {
        User: { connect: { id: userId } },
        miliage,
        loanOrLeaseStatus,
        loanCompany,
        remainingBalance,
        monthlyPayment,
        monthsRemaining,
        purchaseOptionAmount,
        exteriorCondition,
        interiorDamage,
        tiresType,
        overallConditionStatus,
        plannedSaleTimeline,
        isInvolvedAccidentInsurance,
        year,
        make,
        model,
        trim,
        vin,
        lowerPrice,
        higherPrice,
        anyAftermarketFeatures,
        amountClaimed,
        postalCode,
        city,
        province,
      },
    });

    await prisma.notification.create({ data: { carId: newCar.id } });

    res.status(201).json(newCar);
  } catch (error) {
    const e = error as Error;
    res.status(500).json({ message: "Error creating car", error: e.message });
  }
}

export async function updateCarForm(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  const {
    vin,
    miliage,
    loanOrLeaseStatus,
    loanCompany,
    remainingBalance,
    monthlyPayment,
    monthsRemaining,
    purchaseOptionAmount,
    anyAftermarketFeatures,
    exteriorCondition,
    interiorDamage,
    tiresType,
    isInvolvedAccidentInsurance,
    amountClaimed,
    overallConditionStatus,
    plannedSaleTimeline,
    year,
    make,
    model,
    trim,
    lowerPrice,
    higherPrice,
    carId,
    postalCode,
    city,
    province,
  } = req.body;

  const requiredFields = [
    "vin",
    "year",
    "make",
    "model",
    "trim",
    "miliage",
    "loanOrLeaseStatus",
    "exteriorCondition",
    "interiorDamage",
    "tiresType",
    "isInvolvedAccidentInsurance",
    "overallConditionStatus",
    "plannedSaleTimeline",
    "lowerPrice",
    "higherPrice",
    "postalCode",
    "city",
    "province",
  ];

  const missingFields = requiredFields.filter(
    (field) => req.body[field] === undefined
  );

  if (missingFields.length > 0) {
    res.status(400).json({
      message: "Missing required fields",
      missingFields,
    });
    return;
  }

  const typeErrors: string[] = [];

  if (typeof vin !== "string") typeErrors.push("vin must be a string");
  if (typeof miliage !== "number") typeErrors.push("miliage must be a number");
  if (typeof year !== "number") typeErrors.push("year must be a number");
  if (typeof isInvolvedAccidentInsurance !== "boolean")
    typeErrors.push("isInvolvedAccidentInsurance must be a boolean");
  if (remainingBalance !== undefined && typeof remainingBalance !== "number")
    typeErrors.push("remainingBalance must be a number");
  if (monthlyPayment !== undefined && typeof monthlyPayment !== "number")
    typeErrors.push("monthlyPayment must be a number");
  if (monthsRemaining !== undefined && typeof monthsRemaining !== "number")
    typeErrors.push("monthsRemaining must be a number");
  if (lowerPrice !== undefined && typeof lowerPrice !== "number")
    typeErrors.push("lowerPrice must be a number");
  if (higherPrice !== undefined && typeof higherPrice !== "number")
    typeErrors.push("higherPrice must be a number");
  if (
    purchaseOptionAmount !== undefined &&
    typeof purchaseOptionAmount !== "number"
  )
    typeErrors.push("purchaseOptionAmount must be a number");

  if (!Array.isArray(exteriorCondition))
    typeErrors.push("exteriorCondition must be an array");
  if (!Array.isArray(interiorDamage))
    typeErrors.push("interiorDamage must be an array");

  if (typeErrors.length > 0) {
    res.status(400).json({
      message: "Invalid data types",
      errors: typeErrors,
    });
    return;
  }

  const enumErrors: string[] = [];

  if (!isValidEnumValue(LoanOrLeaseStatus, loanOrLeaseStatus)) {
    enumErrors.push(
      `Invalid loanOrLeaseStatus: "${loanOrLeaseStatus}". Available options: ${getEnumValues(
        LoanOrLeaseStatus
      ).join(", ")}`
    );
  }
  if (!isValidEnumValue(ConditionStatus, overallConditionStatus)) {
    enumErrors.push(
      `Invalid overallConditionStatus: "${overallConditionStatus}". Available options: ${getEnumValues(
        ConditionStatus
      ).join(", ")}`
    );
  }
  if (!isValidEnumValue(PlannedSaleTimeline, plannedSaleTimeline)) {
    enumErrors.push(
      `Invalid plannedSaleTimeline: "${plannedSaleTimeline}". Available options: ${getEnumValues(
        PlannedSaleTimeline
      ).join(", ")}`
    );
  }
  if (!isValidEnumValue(TiresType, tiresType)) {
    enumErrors.push(
      `Invalid tiresType: "${tiresType}". Available options: ${getEnumValues(
        TiresType
      ).join(", ")}`
    );
  }

  const invalidExterior = exteriorCondition.filter(
    (item: unknown) => !isValidEnumValue(ExteriorCondition, item)
  );
  if (invalidExterior.length > 0) {
    enumErrors.push(
      `Invalid exteriorCondition values: ${invalidExterior.join(
        ", "
      )}. Available options: ${getEnumValues(ExteriorCondition).join(", ")}`
    );
  }

  const invalidInterior = interiorDamage.filter(
    (item: unknown) => !isValidEnumValue(InteriorDamage, item)
  );
  if (invalidInterior.length > 0) {
    enumErrors.push(
      `Invalid interiorDamage values: ${invalidInterior.join(
        ", "
      )}. Available options: ${getEnumValues(InteriorDamage).join(", ")}`
    );
  }

  if (enumErrors.length > 0) {
    res.status(400).json({
      message: "Enum validation errors",
      errors: enumErrors,
    });
    return;
  }

  try {
    const existingCar = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!existingCar) {
      res.status(404).json({
        message: "Car not found",
        error: `No car with id ${carId} exists.`,
      });
      return;
    }

    if (existingCar.userId !== userId) {
      res.status(403).json({
        message: "Unauthorized",
        error: "You do not have permission to update this car.",
      });
      return;
    }

    const updatedCar = await prisma.car.update({
      where: { id: carId },
      data: {
        vin,
        miliage,
        loanOrLeaseStatus,
        loanCompany,
        remainingBalance,
        monthlyPayment,
        monthsRemaining,
        purchaseOptionAmount,
        exteriorCondition,
        interiorDamage,
        tiresType,
        overallConditionStatus,
        plannedSaleTimeline,
        isInvolvedAccidentInsurance,
        year,
        make,
        model,
        trim,
        lowerPrice,
        higherPrice,
        anyAftermarketFeatures,
        amountClaimed,
        postalCode,
        city,
        province,
      },
    });

    res.status(200).json(updatedCar);
  } catch (error) {
    const e = error as Error;
    res.status(500).json({ message: "Error updating car", error: e.message });
  }
}

export async function uploadImages(req: FilesRequest, res: Response) {
  const userId = req.user?.id;
  const { carId } = req.body;
  const files = req.files?.images;

  if (!carId) {
    res.status(400).json({ message: "Car ID is required" });
    return;
  }

  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { userId: true },
    });

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    if (car.userId !== userId) {
      res.status(403).json({ message: "You are not the owner of this car" });
      return;
    }

    const existingImages = await prisma.carImage.count({
      where: { carId },
    });

    const fileArray = files ? (Array.isArray(files) ? files : [files]) : [];

    if (existingImages + fileArray.length > 10) {
      res.status(400).json({
        message: "Maximum of 10 images allowed per car",
      });
      return;
    }

    const uploadPromises = fileArray.map(async (file) => {
      const fileName = `${carId}_${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from("car-images")
        .upload(fileName, file.data, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("car-images").getPublicUrl(fileName);

      await prisma.carImage.create({
        data: {
          carId,
          imageUrl: publicUrl,
        },
      });

      return publicUrl;
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    res.status(201).json({
      message: "Images uploaded successfully",
      carId,
      imageUrls: uploadedUrls,
    });
  } catch (error) {
    const e = error as Error;
    res
      .status(500)
      .json({ message: "Error uploading images", error: e.message });
  }
}

export async function updateImages(req: FilesRequest, res: Response) {
  const userId = req.user?.id;
  const { carId, imagesToReplace } = req.body;
  const files = req.files?.images;

  const imagesArray = imagesToReplace
    ? imagesToReplace.split(",").map((id: { trim: () => string }) => id.trim())
    : [];

  if (!carId) {
    res.status(400).json({ message: "Car ID is required" });
    return;
  }

  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { userId: true },
    });

    if (!car) {
      res.status(404).json({ message: "Car not found" });
      return;
    }

    if (car.userId !== userId) {
      res.status(403).json({ message: "You are not the owner of this car" });
      return;
    }

    if (imagesArray.length > 0) {
      const oldImages = await prisma.carImage.findMany({
        where: {
          id: { in: imagesArray },
          carId,
        },
      });

      if (oldImages.length !== imagesArray.length) {
        res.status(400).json({
          message: "Some image IDs are invalid or do not belong to this car",
        });
        return;
      }

      const deletePromises = oldImages.map(async (image) => {
        let fileName = image.imageUrl.split("/").pop();

        if (fileName) {
          fileName = decodeURIComponent(fileName);

          const { error } = await supabase.storage
            .from("car-images")
            .remove([fileName]);

          if (error) {
            throw new Error(`Failed to delete old image: ${error.message}`);
          }
        }
      });

      await Promise.all(deletePromises);

      await prisma.carImage.deleteMany({
        where: { id: { in: imagesArray } },
      });
    }

    const fileArray = files ? (Array.isArray(files) ? files : [files]) : [];
    const uploadedUrls: string[] = [];

    if (fileArray.length > 0) {
      const uploadPromises = fileArray.map(async (file) => {
        const fileName = `${carId}_${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
          .from("car-images")
          .upload(fileName, file.data, {
            contentType: file.mimetype,
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("car-images").getPublicUrl(fileName);

        await prisma.carImage.create({
          data: { carId, imageUrl: publicUrl },
        });

        return publicUrl;
      });

      uploadedUrls.push(...(await Promise.all(uploadPromises)));
    }

    res.status(200).json({
      message: "Images updated successfully",
      carId,
      deletedImages: imagesArray,
      newImageUrls: uploadedUrls,
    });
  } catch (error) {
    const e = error as Error;
    res
      .status(500)
      .json({ message: "Error updating images", error: e.message });
  }
}

export async function getUserCar(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { carId } = req.query;
    if (!carId || typeof carId !== "string") {
      res.status(400).json({ message: "Car ID is required" });
      return;
    }

    const car = await prisma.car.findUnique({
      where: {
        id: carId,
        userId: userId,
      },
      include: {
        User: true,
        CarImages: true,
      },
    });

    if (!car) {
      res
        .status(403)
        .json({ message: "You are not allowed to access this car" });
      return;
    }

    res.json({ car, message: "success get user car" });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving car",
      error: (error as Error).message,
    });
  }
}

export async function getCarsUser(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const cars = await prisma.car.findMany({
      where: { userId },
      include: {
        CarImages: true,
      },
    });
    res.json({ cars, message: "success get user cars" });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving cars",
      error: (error as Error).message,
    });
  }
}

export const getUserNotifications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const id = req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: {
        Car: {
          userId: id,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        ActivityLog: {
          include: {
            Car: {
              select: {
                vin: true,
              },
            },
          },
        },
        Car: {
          include: {
            User: {
              select: {
                lastName: true,
                firstName: true,
              },
            },
          },
        },
      },
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
