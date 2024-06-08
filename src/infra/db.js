import mongoose from "mongoose"
// Connection with mongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    // const collections = await mongoose.connection.db.listCollections().toArray()
    // console.log('collections:', collections)
    console.log("Successful connection with the database!")
  } catch (error) {
    console.error("Failed to connect with the database:", error.message)
    process.exit(1)
  }
}