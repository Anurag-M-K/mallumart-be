import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import Store from "../../models/storeModel";
import Advertisement from "../../models/advertisementModel";
import { calculateDistance } from "../../utils/interfaces/common";
import { populate } from "dotenv";
import Category from "../../models/categoryModel";
import mongoose from "mongoose";
import Product from "../../models/productModel";
import ProductSearch from "../../models/productSearch";
import jwt from "jsonwebtoken";
import twilio from "twilio";
const { TWILIO_ACCOUNT_SID, TWILIO_AUTHTOKEN } = process.env;
const twilioclient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTHTOKEN, {
  lazyLoading: true,
});

const twilioServiceId = process.env.TWILIO_SERVICE_ID;
export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const storeOwner: any = await Store.findOne({ phone });
    if (!storeOwner) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("password ",password)
    console.log("storeowner.password ",storeOwner.password)

    const match = await bcrypt.compare(password, storeOwner.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = storeOwner.generateAuthToken(storeOwner._id);
    res.status(200).json({
      _id: storeOwner._id,
      name: storeOwner.storeOwnerName,
      email: storeOwner.email,
      token: token,
      status: "ok",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchStore = asyncHandler(
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    const storeId: any = req?.store._id;
    try {
      const store = await Store.findOne({ _id: storeId }).populate({
        path: "category",
        model: "categories", // Model name
        select: "name", // Field to select
      });
      if (!store) {
        res.status(404).json({ message: "No store found" });
        return;
      }
      res.status(200).json(store);
    } catch (error) {
      next(error);
    }
  }
);

export const updateLiveStatus = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId: string = req.store._id;
    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    // store.live = req.body.storeLiveStatus;
    await store.save();

    return res
      .status(200)
      .json({ message: "Store status updated successfully", store });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const AddAdvertisement = async (req: any, res: Response) => {
  try {
    const storeId = req.store;
    const { image } = req.body;

    const newAdvertisement = new Advertisement({
      image,
      store: storeId,
    });
    await newAdvertisement.save();
    res.status(201).json({ message: "Advertisement added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAdvertisement = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const advertisementId = req.params.advertisementId;

      const advertisement = await Advertisement.findByIdAndDelete(
        advertisementId
      );

      if (!advertisement) {
        res.status(404).json({ message: "Advertisement not found" });
        return;
      }

      res.status(200).json({ message: "Advertisement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export const fetchAllAdvertisement = async (req: any, res: Response) => {
  try {
    const storeId = req.store;
    const advertisements = await Advertisement.find({ store: storeId });
    res.status(200).json(advertisements);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchStoresNearBy = async (req: Request, res: Response) => {
  try {
    const { longitude, latitude } = req.params;
    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const nearStores = await Store.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 10000, // in meters
        },
      },
      status:"active"
    }).populate("category", "name icon");

    // distance geting wrong. need to work on this
    const storeWithDistance = nearStores.map((store) => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        store.location.coordinates[1],
        store.location.coordinates[0]
      );
      return {
        ...store.toObject(),
        category: store.category,
        distance: distance.toFixed(2),
      };
    });

    res.status(200).json(storeWithDistance);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchStoreByUniqueName = async (req: Request, res: Response) => {
  try {
    const { uniqueName } = req.params; // Destructure the id from req.params
    console.log("unique name ", uniqueName);
    const store: any = await Store.findOne({ uniqueName: uniqueName }).populate(
      "category",
      "name"
    ); // Correctly pass the id to findById method
    console.log("Reached be ", store);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    let storeData: any = { store, productCategories: [] };

    if (store.category) {
      const CId = store.category._id.toString();

      const category = await Category.find({ parentId: CId }).lean();

      if (category && category.length > 0) {
        store.productCategories = category;
        storeData = { store, productCategories: [...category] };
      } else {
        return res.status(200).json(storeData);
      }
    }

    res.status(200).json(storeData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchAllStore = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const store = await Store.find().populate({
        path: "category",
        model: "categories", // Model name
        select: "name", // Field to select
      });
      if (!store) {
        res.status(404).json({ message: "No store found" });
        return;
      }
      res.status(200).json(store);
    } catch (error) {
      next(error);
    }
  }
);

export const fetchStoreByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId, longitude, latitude }: any = req.query;

    let response;
    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "longitude and latitude are required" });
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      response = await Store.find({
        category: categoryId,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 10000, // in meters
          },
        },
        status:"active"
      });
    } else {
      response = await Store.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 10000,
          },
        },
        status:"active",
      });
    }
    if (!response || response.length === 0) {
      return res.status(404).json({ message: "No stores found" });
    }

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchStoresByProductName = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      let productName: any = req.query.searchTerm;
      console.log("req.query ", req.query);
      console.log("reqched back ", productName);

      if (!productName) {
        res.status(400).json({ message: "Product name is required" });
      }

      if (productName) {
        const trimmedSearchTerm = productName.trim();
        const productSearch = await ProductSearch.findOne({
          productName: trimmedSearchTerm,
        });
        if (productSearch) {
          await ProductSearch.findOneAndUpdate(
            { productName: trimmedSearchTerm },
            { $inc: { searchCount: 1 } }
          );
        } else {
          await ProductSearch.create({
            productName: trimmedSearchTerm,
            searchCount: 1,
          });
        }
      }

      //ensure product name is a string
      productName =
        typeof productName === "string"
          ? decodeURIComponent(productName).trim()
          : "";
      //finding the product that mathc the product name
      const products = await Product.find({
        name: { $regex: productName, $options: "i" }, // Case-insensitive search
      });

      //extracts store ids from the product
      const storeIds = products.map((product) => product.store);

      const stores = await Store.find({ _id: { $in: storeIds } }).populate(
        "category",
        "name"
      );

      if (stores.length === 0) {
        res
          .status(404)
          .json({ message: "No stores found for the given product" });
      }

      res.status(200).json(stores);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export const changePassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password, newPassword, reEnterPassword } = req.body;
    const user = req.store._id;

    if (newPassword !== reEnterPassword) {
      res
        .status(400)
        .json({ message: "Password mismatch. Please type same password" });
    }

    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const userData: any = await Store.findById(user);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, userData.password);
    if (match) {
      const hashPassword = await bcrypt.hash(reEnterPassword, 10);

      await Store.findByIdAndUpdate(
        user,
        {
          password: hashPassword,
        },
        { new: true }
      );

      res.status(200).json({ message: "Password updated successfully" });
    } else {
      res.status(400).json({ message: "Current password is incorrect" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPasswordOtpSendToPhone = async (req:Request,res:Response)=>{
  try {
    const {phone} = req.body
    const store = await Store.findOne({phone})
    
    if(!store){
      return res.status(404).json({message:"Invalid number"})
    }

    if(!twilioServiceId){
      return res.status(500).json({message:"Twilio service id is not configured"})
    };

    const otpResponse = await twilioclient.verify.v2
    .services(twilioServiceId)
    .verifications.create({
      to: `+91${phone}`,
      channel: "sms",
    });

    const token = jwt.sign(
      {phone},
      process.env.JWT_SECRET_FOR_PASSWORD_RESET!,
      {expiresIn:"10m"}
    );
    res.status(201).json({
      message:`otp send successfully : ${JSON.stringify(otpResponse)}`,
      otpSend:true,
      token,
    })

  } catch (error) {
    console.log(error)
    res.status(500).json({message:"Internal server error"})
  }
}

export const OtpVerify = async (req:Request,res:Response) => {
  try {
    const { token, otp } = req.body;
    const decodedPhone: any = jwt.verify(
      token,
      process.env.JWT_SECRET_FOR_PASSWORD_RESET!
    );

    const store = await Store.findOne({ phone: decodedPhone.phone });

    if (!store) {
      return res.status(404).json({ message: "Invalid token" });
    }
    if (!twilioServiceId) {
      return res
        .status(500)
        .json({ message: "Twilio service ID is not configured." });
    }

    const verifiedResponse = await twilioclient.verify.v2
      .services(twilioServiceId)
      .verificationChecks.create({
        to: `+91${decodedPhone.phone}`,
        code: otp,
      });

    //mark user as verified if otp is verified true
    if (verifiedResponse.status === "approved") {
      res.status(200).json({
        message: `OTP verified successfully : ${JSON.stringify(
          verifiedResponse
        )}`,
        verified: true,
      });
    } else {
      res.status(400).json({ message: "Otp is wrong" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" ,error});
  }
}


export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    

    const decodedPhone: any = jwt.verify(
      token,
      process.env.JWT_SECRET_FOR_PASSWORD_RESET!
    );

    const user = await Store.findOne({ phone: decodedPhone.phone });

    if (!user) {
      res.status(404).json({ message: "User not found for this number" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    const response = await Store.findByIdAndUpdate(
      user,
      {
        password: hashPassword,
      },
      { new: true }
    );
    res
      .status(201)
      .json({
        message: "Password changed successfully",
        response,
        updated: true,
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" ,error});
  }
};