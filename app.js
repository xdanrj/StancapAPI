import express from "express";
import mongoose from "mongoose";
import { connectDB } from "./src/infra/db.js";
import { quotesRoutes } from "./src/routes/quotesRoutes.js";
import {userRoutes} from "./src/routes/userRoutes.js";
import { loginAndRegisterRoutes } from "./src/routes/loginAndRegisterRoutes.js";
import dotenv from "dotenv"
import helmet from "helmet";
import cors from "cors";
dotenv.config()
const PORT = process.env.PORT || 3000;
const CORS_URL = process.env.CORS_URL || '*'
console.log("CORS AQUI: ", CORS_URL)
const app = express();
  
app.use(helmet())

var corsOptions = {
  origin: CORS_URL,
  optionsSuccessStatus: 200 
}
app.use(cors(corsOptions))

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