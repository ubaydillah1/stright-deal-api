import prisma from "../config/prismaClient";
import { supabase } from "../config/supabaseClient";
import generateUniqueSlug from "../utils/generateUniqueCarSlug";
import { Response, Request } from "express";

interface CustomRequest extends Request {
  files?: {
    images?: any | any[];
  };
}

export async function createCarForm(req: Request, res: Response) {
  const {
    miliage,
    transmission_type,
    isSoloOwner,
    color,
    loanOrLeaseStatus,
    loanCompany,
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
    TiresType,
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
    "loanCompany",
    "remainingBalance",
    "isTradeIn",
    "plannedSaleTime",
    "additionalFeature",
    "exteriorCondition",
    "interiorDamage",
    "additionalDisclosures",
    "keyCount",
    "tireSetCount",
    "tireReplacementTimeframe",
    "TiresType",
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

  // Return only the missing fields
  if (missingFields.length > 0) {
    res.status(400).json({
      message: "Missing required fields",
      missingFields,
    });
    return;
  }

  try {
    const slug = await generateUniqueSlug(carName);

    const validMileage = parseInt(miliage, 10);
    const validRemainingBalance = parseFloat(remainingBalance);
    const validKeyCount = parseInt(keyCount, 10);
    const validTireSetCount = parseInt(tireSetCount, 10);
    const validIsSoloOwner = isSoloOwner === "true";
    const validIsTradeIn = isTradeIn === "true";
    const validHasOriginalFactoryRims = hasOriginalFactoryRims === "true";
    const validHasMechanicalIssues = hasMechanicalIssues === "true";
    const validIsDriveable = isDriveable === "true";
    const validHasAccidentOrClaimStatus = hasAccidentOrClaimStatus === "true";
    const validAdditionalFeature = Array.isArray(additionalFeature)
      ? additionalFeature
      : [additionalFeature];

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
        isTradeIn: validIsTradeIn,
        plannedSaleTime,
        additionalFeature: validAdditionalFeature,
        exteriorCondition,
        interiorDamage,
        additionalDisclosures,
        keyCount: validKeyCount,
        tireSetCount: validTireSetCount,
        tireReplacementTimeframe,
        TiresType,
        hasOriginalFactoryRims: validHasOriginalFactoryRims,
        hasMechanicalIssues: validHasMechanicalIssues,
        isDriveable: validIsDriveable,
        hasAccidentOrClaimStatus: validHasAccidentOrClaimStatus,
        overallConditionStatus,
        plannedSaleTimeline,
        slug,
      },
    });

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
