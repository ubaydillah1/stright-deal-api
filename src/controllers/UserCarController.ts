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

interface CustomRequest extends Request {
  files?: {
    images?: any | any[];
  };
}

function isValidEnumValue(enumObj: any, value: any): boolean {
  return Object.values(enumObj).includes(value);
}

function getEnumValues(enumObj: any): string[] {
  return Object.values(enumObj);
}

export async function createCarForm(req: Request, res: Response) {
  const userId = (req as any).user.id;
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

  // **Cek Validitas Enum dalam Array**
  const invalidExterior = exteriorCondition.filter(
    (item: any) => !isValidEnumValue(ExteriorCondition, item)
  );
  if (invalidExterior.length > 0) {
    enumErrors.push(
      `Invalid exteriorCondition values: ${invalidExterior.join(
        ", "
      )}. Available options: ${getEnumValues(ExteriorCondition).join(", ")}`
    );
  }

  const invalidInterior = interiorDamage.filter(
    (item: any) => !isValidEnumValue(InteriorDamage, item)
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
      },
    });

    await prisma.notification.create({ data: { carId: newCar.id } });

    res.status(201).json(newCar);
  } catch (error) {
    const e = error as Error;
    console.log(e.message);
    res.status(500).json({ message: "Error creating car", error: e.message });
  }
}

export async function updateCarForm(req: Request, res: Response) {
  const userId = (req as any).user.id;
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
    (item: any) => !isValidEnumValue(ExteriorCondition, item)
  );
  if (invalidExterior.length > 0) {
    enumErrors.push(
      `Invalid exteriorCondition values: ${invalidExterior.join(
        ", "
      )}. Available options: ${getEnumValues(ExteriorCondition).join(", ")}`
    );
  }

  const invalidInterior = interiorDamage.filter(
    (item: any) => !isValidEnumValue(InteriorDamage, item)
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
      },
    });

    res.status(200).json(updatedCar);
  } catch (error) {
    const e = error as Error;
    console.log(e.message);
    res.status(500).json({ message: "Error updating car", error: e.message });
  }
}

export async function uploadImages(req: Request, res: Response) {
  const { carId } = req.body;
  const files = (req as CustomRequest).files?.images;

  if (!carId) {
    res.status(400).json({ message: "Car ID is required" });
    return;
  }

  try {
    const existingImages = await prisma.carImage.count({
      where: { carId },
    });

    const fileArray = Array.isArray(files) ? files : [files];

    if (existingImages + fileArray.length > 5) {
      res.status(400).json({
        message: "Maximum of 5 images allowed per car",
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

export async function getUserCar(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
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

export async function getCarsUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const cars = await prisma.car.findMany({
      where: { userId },
    });
    res.json({ cars, message: "success get user cars" });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving cars",
      error: (error as Error).message,
    });
  }
}
