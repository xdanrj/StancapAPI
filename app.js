import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { connectDB } from "./src/infra/db.js";
import { quotesRoutes } from "./src/routes/quotesRoutes.js";
import {userRoutes} from "./src/routes/userRoutes.js";
import { loginAndRegisterRoutes } from "./src/routes/loginAndRegisterRoutes.js";
import dotenv from "dotenv"
dotenv.config()
const PORT = process.env.PORT || 3000;
const app = express();

const corsOptions = {
  origin: process.env.MAIN_DOMAIN, 
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());

mongoose.set("strictQuery", false);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(
  // Added to capture user email
  express.urlencoded({
    extended: true,
  })
)

app.listen(PORT, () => {
  console.log(`API ready to use`);
})

connectDB()

app.get("/", async (req, res) => {
  res.status(200).send({ message: "API is ready to go!" });
});
//nem todas rotas precisam do token
//app.use(requireUserToken)

userRoutes(app)
quotesRoutes(app)
loginAndRegisterRoutes(app)