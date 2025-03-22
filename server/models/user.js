import mongoose from "mongoose"

const mySchema = new mongoose.Schema(
    {
      name: String,
      password: String,
      pp: String,
      status: String,
    },
    { timestamps: true }
);

const User = new mongoose.model("user", mySchema);

export default User