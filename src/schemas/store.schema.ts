import * as z from "zod";

const numericRegex = /^\d+$/;

export const addStoreSchema = z.object({
  storeName: z.string().trim().min(1, "shop name cannot be empty"),
  uniqueName: z
    .string()
    .trim()
    .min(1, "unique name cannot be empty")
    .max(30, "unique name cannot be longer than 30 characters")
    .toLowerCase()
    .regex(
      /^[a-z0-9-_]+$/,
      "Shop name can only contain lowercase letters, numbers, hyphens, and underscores"
    ),
  category: z.string(),
  retail: z.boolean().default(false),
  wholesale: z.boolean().default(false),
  latitude: z.number(),
  longitude: z.number(),
  district: z.string(), //enum set here
  city: z.string().trim().min(1, "city cannot be empty"),
  address: z.string().trim().optional(),
  storeOwnerName: z.string().trim().min(1, "shop owner name cannot be empty"),
  phone: z
    .string()
    .trim()
    .min(1, "phone number cannot be empty")
    .regex(numericRegex, "enter a valid phone number"),
  whatsapp: z
    .string()
    .min(10, "enter a valid whatsapp number")
    .regex(numericRegex, "enter a valid phone number"),
  email: z.string().max(0).or(z.string().email()),
  subscriptionPlan: z.string(), //enum set here
  bio: z.string().optional(),
  shopImgUrl: z.string(),
  otp: z.string().min(6, "invalid otp").max(6, "invalid otp"),
  storeProviding:z.string().optional()
});

export type IAddStoreSchema = z.infer<typeof addStoreSchema>;

export const checkDetailsAndSendOtp = addStoreSchema.pick({
  phone: true,
  uniqueName: true,
});

export type ICheckDetailsAndSendOtp = z.infer<typeof checkDetailsAndSendOtp>;

export const updateStoreSchema = addStoreSchema
  .omit({
    uniqueName: true,
    category: true,
    otp: true,
    phone: true
  })
  //   .omit({  : true })
  .partial();

export type IUpdateStoreSchema = z.infer<typeof updateStoreSchema>;
