import express from "express";
import { register,login, verifyOtp, addToCart, getCart, removeCart,updateProfile, forgetPasswordOtpSend, verifyOtpForPasswrodReset, updatePassword, updateProfilePassword,fetchUser,fetchTimeSlot, slotBooking , fetchAllDoctors, fetchAllSpecialisations } from "../controllers/user/userController";
import { user } from "../middleware/auth";
import { validateData } from "../middleware/zod.validation";
import { addCartSchema } from "../schemas/cart.schema";
import { drBooking } from "../controllers/booking/bookingController";
const router = express.Router();

router.route("/register").post(register)
router.route("/verify-otp").post(verifyOtp)
router.route("/login").post(login)

router.route("/cart").post(user, validateData(addCartSchema), addToCart)
router.route("/cart/:storeId").get(user, getCart).delete(user, removeCart)
router.route('/update-profile').put(user,updateProfile)
router.route('/forget-password').post(forgetPasswordOtpSend)
router.route('/verify-otp-for-password-reset').post(verifyOtpForPasswrodReset)
router.route("/update-password").put(updatePassword)
router.route("/change-profile-password").put(user,updateProfilePassword)
router.route("/fetch-user-details").get(user,fetchUser)
router.route("/time-slots/:id").get(user,fetchTimeSlot)
router.route("/booking").post(user,slotBooking)
router.route("/dr-booking").post(user,drBooking)
router.route("/specialisations/:uniqueName").get(fetchAllSpecialisations)
router.route("/doctors/:uniqueName").get(fetchAllDoctors)
export default router;
