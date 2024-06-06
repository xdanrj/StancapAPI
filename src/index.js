import express from "express";
import mongoose from "mongoose";
import { connectDB } from "./infra/db.js";
import { quotesRoutes } from "./routes/quotesRoutes.js";
import {userRoutes} from "./routes/userRoutes.js";
import { loginAndRegisterRoutes } from "./routes/loginAndRegisterRoutes.js";
import dotenv from "dotenv"
dotenv.config()
const PORT = process.env.PORT || 3002;
const app = express();

app.use(express.json());

mongoose.set("strictQuery", false);

app.use(
  // Added to capture user email
  express.urlencoded({
    extended: true,
  })
)

app.listen(PORT, () => {
  console.log(`API pronta: http://localhost:${PORT}`);
})

connectDB()

app.get("/", async (req, res) => {
  res.status(200).send({ message: "API is ready to go!" });
})

userRoutes(app)
quotesRoutes(app)
loginAndRegisterRoutes(app)

export default app