import express, { Request, Response } from "express";

const router = express.Router();

router.get("/vehicle-list", (req: Request, res: Response) => {
  res.json({
    message: "sucess",
  });
});

export default router;
