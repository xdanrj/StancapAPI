import twilio from "twilio"
import { User } from "../models/User.js"
import { selectUser, userExists } from "./commonFunctions.js"
import { requireUserToken } from "./middleware.js"
import _ from "lodash"
import bcrypt from 'bcrypt'
import { reqLimit } from "./middleware.js"

export const userRoutes = (app) => {
  //variaveis globais para funcionamento da API Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifySid = process.env.TWILIO_VERIFY_SID
  const client = twilio(accountSid, authToken)
  const secretKey = process.env.SECRET_KEY

  async function functionEditUser(query, body) {
    const entries = Object.entries(body)
    const data = Object.fromEntries(entries.slice(1))

    if (query.quantity > 1) {
      await User.updateMany(
        query.query,
        { ...data }
      )
    }
    else if (query.quantity == 1) {
      await User.updateOne(
        query.query,
        { ...data },
      )
    }
    return query
  }

  // rota que retorna todos os usernames existentes
  app.get("/all_users", async (req, res) => {
    try {
      const response = await User.find().lean()
      const finalResponse = response.map((user) => user.username)
      console.log(finalResponse)
      res.status(200).send(finalResponse)

    } catch (error) {
      res.status(400).json({ message: error })
      console.log(error)
    }
  })

  //rota que retorna apenas o username usando _id como filtro
  app.post("/search_user", async (req, res) => {
    try {
      const foundUser = await selectUser(req.body)
      res.status(200).json(foundUser.username)
    } catch (error) {
      res.status(400).json({ message: error })
    }
  })

  app.patch("/edit_user", reqLimit(5, 10), requireUserToken, async (req, res) => {
    try {
      const selectedUser = await selectUser(req.body)
      const response = await functionEditUser(selectedUser, req.body)
      res.status(200).json(response)
    } catch (error) { res.status(400).json({ message: error }) }
  })

  app.post("/change_password_send", reqLimit(5, 10), async (req, res) => {
    try {
      const email = req.body.email
      const selectedUser = await userExists({ email: email })
      if (selectedUser) {
        const verification = await client.verify.v2.services(verifySid)
          .verifications.create({
            channelConfiguration: {
              template_id: 'd-2126cb679bac48daba466e2fe1682b2e',
              from: 'stancapdb@gmail.com',
              from_name: 'Stancap'
            }, to: email, channel: 'email'
          })
          verification()
        res.status(200).json({
          message: "Código de recuperação enviado para o e-mail",
          response: selectedUser
        })
      } else {
        res.status(200).json({ message: "E-mail não encontrado" })
      }
    } catch (error) { res.status(400).json({ message: error }) }
  })

  app.post("/change_password_check", reqLimit(5, 10), async (req, res) => {
    try {
      const otpCode = req.body.code
      const email = req.body.email
      const newPassword = req.body.newPassword

      const verification_check = await client.verify.v2.services(verifySid).verificationChecks.create({ to: email, code: otpCode })

      if (verification_check.status == "approved") {
        await User.updateOne(
          { email: email },
          { password: await bcrypt.hash(newPassword, 10) })
        res.status(200).json({
          message: "Senha alterada com sucesso"
        })
      } else {
        res.status(400).json({ message: "Código de verificação incorreto ou expirado" })
      }
    } catch (error) { res.status(400).json({ message: error }) }
  })
}