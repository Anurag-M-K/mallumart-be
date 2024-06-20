import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface IUser {
  _id: string;
  username:string;
  fullName: string;
  email: string;
  password: string;
  generateAuthToken: (userId: string) => string;
  phone:string;
  otp:string;
  isVerified: boolean;
  order:Schema.Types.ObjectId[];

}

const userSchema = new Schema<IUser>(
  {
    username:{
      type:String,

    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone:{
      type:String,
      required:true,
    },
    otp:{
      type:String,
    },
    isVerified: {
      type:Boolean,
      default: false,
      required:true
    },
    order:[
      {
        type:Schema.Types.ObjectId,
        ref:"Order"
      }
    ]
   

  },
  {
    timestamps: true,
  }
);

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(12);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// generate auth token
userSchema.methods.generateAuthToken = function (userId: string): string {
  return jwt.sign({ _id: userId }, "userSecrete", { expiresIn: "7d" });
};

const User = model<IUser>("users", userSchema);

export default User;
