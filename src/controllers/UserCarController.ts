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
import { supabase } from "../config/supabaseClient";
import generateUniqueSlug from "../utils/generateUniqueCarSlug";
import { Response, Request } from "express";

interface CustomRequest extends Request {
  files?: {
    images?: any | any[];
  };
}

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

export async function createCarForm(req: Request, res: Response) {
  const {
    miliage,
    transmission_type,
    isSoloOwner,
    color,
    loanOrLeaseStatus,
    loanCompany,
    monthlyPayment,
    monthsRemaining,
    purchaseOptionAmount,
    remainingBalance,
    isTradeIn,
    plannedSaleTime,
    additionalFeature,
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
    carName,
    userId,
  } = req.body;

  const files = (req as CustomRequest).files?.images;

  // Validate required fields
  const requiredFields = [
    "miliage",
    "transmission_type",
    "isSoloOwner",
    "color",
    "loanOrLeaseStatus",
    "isTradeIn",
    "plannedSaleTime",
    "additionalFeature",
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
    "carName",
    "userId",
  ];

  const missingFields: string[] = [];

  // Check for missing fields
  requiredFields.forEach((field) => {
    if (!req.body[field]) {
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

  if (!isValidEnumValue(TransmissionType, transmission_type)) {
    enumValidationErrors.push(
      getEnumValidationError(
        TransmissionType,
        "transmission_type",
        transmission_type
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

  if (!isValidEnumValue(ExteriorCondition, exteriorCondition)) {
    enumValidationErrors.push(
      getEnumValidationError(
        ExteriorCondition,
        "exteriorCondition",
        exteriorCondition
      )
    );
  }

  if (!isValidEnumValue(InteriorDamage, interiorDamage)) {
    enumValidationErrors.push(
      getEnumValidationError(InteriorDamage, "interiorDamage", interiorDamage)
    );
  }

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

  if (enumValidationErrors.length > 0) {
    res.status(400).json({
      message: "Invalid enum values",
      errors: enumValidationErrors,
    });
    return;
  }
  try {
    const slug = await generateUniqueSlug(carName);

    const validMileage = parseInt(miliage, 10);
    const validRemainingBalance = parseFloat(remainingBalance);
    const validKeyCount = parseInt(keyCount, 10);
    const validTireSetCount = parseInt(tireSetCount, 10);
    const validMonthlyPayment = parseFloat(monthlyPayment);
    const validMonthsRemaining = parseFloat(monthsRemaining);
    const validPurchaseOptionAmount = parseFloat(purchaseOptionAmount);
    const validIsSoloOwner = isSoloOwner === "true";
    const validIsTradeIn = isTradeIn === "true";
    const validHasOriginalFactoryRims = hasOriginalFactoryRims === "true";
    const validHasMechanicalIssues = hasMechanicalIssues === "true";
    const validIsDriveable = isDriveable === "true";
    const validHasAccidentOrClaimStatus = hasAccidentOrClaimStatus === "true";
    const validAdditionalFeature = Array.isArray(additionalFeature)
      ? additionalFeature
      : [additionalFeature];

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
        transmission_type,
        isSoloOwner: validIsSoloOwner,
        color,
        loanOrLeaseStatus,
        loanCompany,
        remainingBalance: validRemainingBalance,
        monthlyPayment: validMonthlyPayment,
        monthsRemaining: validMonthsRemaining,
        purchaseOptionAmount: validPurchaseOptionAmount,
        isTradeIn: validIsTradeIn,
        plannedSaleTime,
        additionalFeature: validAdditionalFeature,
        exteriorCondition,
        interiorDamage,
        additionalDisclosures,
        keyCount: validKeyCount,
        tireSetCount: validTireSetCount,
        tireReplacementTimeframe,
        tiresType,
        hasOriginalFactoryRims: validHasOriginalFactoryRims,
        hasMechanicalIssues: validHasMechanicalIssues,
        isDriveable: validIsDriveable,
        hasAccidentOrClaimStatus: validHasAccidentOrClaimStatus,
        overallConditionStatus,
        plannedSaleTimeline,
        slug,
      },
    });

    console.log(files);

    if (files) {
      const fileArray = Array.isArray(files) ? files : [files];

      const uploadPromises = fileArray.map(async (file) => {
        const fileName = `${newCar.id}_${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
          .from("car-images")
          .upload(fileName, file.data, {
            contentType: file.mimetype,
          });

        if (error) throw new Error(`Upload failed: ${error.message}`);

        const {
          data: { publicUrl },
        } = supabase.storage.from("car-images").getPublicUrl(fileName);

        await prisma.carImage.create({
          data: {
            carId: newCar.id,
            imageUrl: publicUrl,
          },
        });

        return publicUrl;
      });

      await Promise.all(uploadPromises);
    }

    const carWithImages = await prisma.car.findUnique({
      where: { id: newCar.id },
      include: {
        CarImages: true,
      },
    });

    res.status(201).json(carWithImages);
  } catch (error) {
    const e = error as Error;
    res.status(500).json({ message: "Error creating car", error: e.message });
  }
}
