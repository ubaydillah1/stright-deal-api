import {
  AdditionalDisclosures,
  ConditionStatus,
  ExteriorCondition,
  InteriorDamage,
  LoanOrLeaseStatus,
  PlannedSaleTime,
  PlannedSaleTimeline,
  TireReplacementTimeframe,
  TransmissionType,
  TiresType,
} from "@prisma/client";
import prisma from "../config/prismaClient";
import { Response, Request } from "express";
import { supabase } from "../config/supabaseClient";

function isValidEnumValue(enumObj: any, value: string): boolean {
  return Object.values(enumObj).includes(value);
}

function getEnumValues(enumObj: any): string[] {
  return Object.values(enumObj);
}

function getEnumValidationError(
  enumObj: any,
  field: string,
  value: string
): string {
  const availableOptions = getEnumValues(enumObj);
  return `Invalid ${field}: "${value}". Available options are: ${availableOptions.join(
    ", "
  )}`;
}

function validateStringArray(field: string, value: any): string | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return `Invalid ${field}: Must be an array of strings.`;
  }
  return null;
}

function validateEnumArray(
  enumObj: any,
  field: string,
  values: any[]
): string | null {
  const invalidValues = values.filter(
    (value) => !isValidEnumValue(enumObj, value)
  );
  if (invalidValues.length > 0) {
    return `Invalid ${field}: "${invalidValues.join(
      ", "
    )}". Available options are: ${getEnumValues(enumObj).join(", ")}`;
  }
  return null;
}

export async function createCarForm(req: Request, res: Response) {
  let {
    miliage,
    transmissionType,
    isSoleOwner,
    color,
    loanOrLeaseStatus,
    loanCompany,
    monthlyPayment,
    monthsRemaining,
    purchaseOptionAmount,
    remainingBalance,
    isTradeIn,
    plannedSaleTime,
    additionalFeatures,
    anyAdditionalFeatures,
    exteriorCondition,
    interiorDamage,
    additionalDisclosures,
    keyCount,
    tireSetCount,
    tireReplacementTimeframe,
    tiresType,
    hasOriginalFactoryRims,
    hasMechanicalIssues,
    isDriveable,
    hasAccidentOrClaimStatus,
    overallConditionStatus,
    plannedSaleTimeline,
  } = req.body;

  const userId = (req as any).user.id;

  // Convert string to array if necessary
  if (typeof exteriorCondition === "string") {
    exteriorCondition = exteriorCondition.split(",");
  }
  if (typeof interiorDamage === "string") {
    interiorDamage = interiorDamage.split(",");
  }

  // Validate required fields
  const requiredFields = [
    "miliage",
    "transmissionType",
    "isSoleOwner",
    "color",
    "loanOrLeaseStatus",
    "isTradeIn",
    "plannedSaleTime",
    "additionalFeatures",
    "exteriorCondition",
    "interiorDamage",
    "additionalDisclosures",
    "keyCount",
    "tireSetCount",
    "tireReplacementTimeframe",
    "tiresType",
    "hasOriginalFactoryRims",
    "hasMechanicalIssues",
    "isDriveable",
    "hasAccidentOrClaimStatus",
    "overallConditionStatus",
    "plannedSaleTimeline",
  ];

  const missingFields: string[] = [];

  // Check for missing fields
  requiredFields.forEach((field) => {
    if (req.body[field] === undefined || req.body[field] === null) {
      missingFields.push(field);
    }
  });

  if (loanOrLeaseStatus === LoanOrLeaseStatus.Loan) {
    if (!loanCompany) missingFields.push("loanCompany");
    if (!remainingBalance) missingFields.push("remainingBalance");
  }

  if (loanOrLeaseStatus === LoanOrLeaseStatus.Lease) {
    if (!monthlyPayment) missingFields.push("monthlyPayment");
    if (!monthsRemaining) missingFields.push("monthsRemaining");
    if (!purchaseOptionAmount) missingFields.push("purchaseOptionAmount");
  }

  // Return only the missing fields
  if (missingFields.length > 0) {
    res.status(400).json({
      message: "Missing required fields",
      missingFields,
    });
    return;
  }

  // Validate enum values
  const enumValidationErrors: string[] = [];

  if (!isValidEnumValue(TransmissionType, transmissionType)) {
    enumValidationErrors.push(
      getEnumValidationError(
        TransmissionType,
        "transmissionType",
        transmissionType
      )
    );
  }

  if (!isValidEnumValue(LoanOrLeaseStatus, loanOrLeaseStatus)) {
    enumValidationErrors.push(
      getEnumValidationError(
        LoanOrLeaseStatus,
        "loanOrLeaseStatus",
        loanOrLeaseStatus
      )
    );
  }

  if (!isValidEnumValue(PlannedSaleTime, plannedSaleTime)) {
    enumValidationErrors.push(
      getEnumValidationError(
        PlannedSaleTime,
        "plannedSaleTime",
        plannedSaleTime
      )
    );
  }

  const exteriorConditionError = validateEnumArray(
    ExteriorCondition,
    "exteriorCondition",
    exteriorCondition
  );
  if (exteriorConditionError) enumValidationErrors.push(exteriorConditionError);

  const interiorDamageError = validateEnumArray(
    InteriorDamage,
    "interiorDamage",
    interiorDamage
  );
  if (interiorDamageError) enumValidationErrors.push(interiorDamageError);

  if (!isValidEnumValue(TireReplacementTimeframe, tireReplacementTimeframe)) {
    enumValidationErrors.push(
      getEnumValidationError(
        TireReplacementTimeframe,
        "tireReplacementTimeframe",
        tireReplacementTimeframe
      )
    );
  }

  if (!isValidEnumValue(ConditionStatus, overallConditionStatus)) {
    enumValidationErrors.push(
      getEnumValidationError(
        ConditionStatus,
        "overallConditionStatus",
        overallConditionStatus
      )
    );
  }

  if (!isValidEnumValue(PlannedSaleTimeline, plannedSaleTimeline)) {
    enumValidationErrors.push(
      getEnumValidationError(
        PlannedSaleTimeline,
        "plannedSaleTimeline",
        plannedSaleTimeline
      )
    );
  }

  if (!isValidEnumValue(AdditionalDisclosures, additionalDisclosures)) {
    enumValidationErrors.push(
      getEnumValidationError(
        AdditionalDisclosures,
        "additionalDisclosures",
        additionalDisclosures
      )
    );
  }

  if (!isValidEnumValue(TiresType, tiresType)) {
    enumValidationErrors.push(
      getEnumValidationError(TiresType, "tiresType", tiresType)
    );
  }

  // Validate string arrays
  const arrayValidationErrors: string[] = [];

  const additionalFeaturesError = validateStringArray(
    "additionalFeatures",
    additionalFeatures
  );
  if (additionalFeaturesError)
    arrayValidationErrors.push(additionalFeaturesError);

  if (enumValidationErrors.length > 0 || arrayValidationErrors.length > 0) {
    res.status(400).json({
      message: "Validation errors",
      errors: [...enumValidationErrors, ...arrayValidationErrors],
    });
    return;
  }

  try {
    const validMileage = parseInt(miliage, 10);
    const validRemainingBalance = parseFloat(remainingBalance);
    const validKeyCount = parseInt(keyCount, 10);
    const validTireSetCount = parseInt(tireSetCount, 10);
    const validMonthlyPayment = parseFloat(monthlyPayment);
    const validMonthsRemaining = parseFloat(monthsRemaining);
    const validPurchaseOptionAmount = parseFloat(purchaseOptionAmount);

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
        user: {
          connect: { id: userId },
        },
        miliage: validMileage,
        transmissionType,
        isSoleOwner,
        color,
        loanOrLeaseStatus,
        loanCompany,
        remainingBalance: validRemainingBalance,
        monthlyPayment: validMonthlyPayment,
        monthsRemaining: validMonthsRemaining,
        purchaseOptionAmount: validPurchaseOptionAmount,
        isTradeIn,
        plannedSaleTime,
        additionalFeatures,
        anyAdditionalFeatures,
        exteriorCondition,
        interiorDamage,
        additionalDisclosures,
        keyCount: validKeyCount,
        tireSetCount: validTireSetCount,
        tireReplacementTimeframe,
        tiresType,
        hasOriginalFactoryRims,
        hasMechanicalIssues,
        isDriveable,
        hasAccidentOrClaimStatus,
        overallConditionStatus,
        plannedSaleTimeline,
      },
    });

    res.status(201).json(newCar);
  } catch (error) {
    const e = error as Error;
    res.status(500).json({ message: "Error creating car", error: e.message });
  }
}

interface CustomRequest extends Request {
  files?: {
    images?: any | any[];
  };
}

export async function uploadImages(req: Request, res: Response) {
  const { carId } = req.body;
  const files = (req as CustomRequest).files?.images;

  if (!carId) {
    res.status(400).json({ message: "Car ID is required" });
    return;
  }

  if (!files || (Array.isArray(files) && files.length === 0)) {
    res.status(400).json({ message: "No images provided" });
    return;
  }

  try {
    // Pastikan files adalah array
    const fileArray = Array.isArray(files) ? files : [files];

    // Upload setiap file ke Supabase
    const uploadPromises = fileArray.map(async (file) => {
      const fileName = `${carId}_${Date.now()}_${file.name}`;

      // Upload file ke Supabase Storage
      const { data, error } = await supabase.storage
        .from("car-images")
        .upload(fileName, file.data, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Dapatkan URL publik file yang diunggah
      const {
        data: { publicUrl },
      } = supabase.storage.from("car-images").getPublicUrl(fileName);

      // Simpan URL gambar ke database menggunakan Prisma
      await prisma.carImage.create({
        data: {
          carId,
          imageUrl: publicUrl,
        },
      });

      return publicUrl;
    });

    // Tunggu semua file selesai diunggah
    const uploadedUrls = await Promise.all(uploadPromises);

    // Kirim respons sukses
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
