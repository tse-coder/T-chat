import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
    {
      sender: String,
      receiver: String,
      message: String,
    },
    { timestamps: true }
)

const Message = new mongoose.model("message", messageSchema)

export default Message