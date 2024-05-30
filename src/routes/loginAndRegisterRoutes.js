import twilio from "twilio"
import { User } from "../models/User.js";
import { userExists } from "./commonFunctions.js";
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'
import dayjs from "dayjs";
import { reqLimit } from "./middleware.js";

export const loginAndRegisterRoutes = (app) => {
    
    const secretKey = process.env.SECRET_KEY

    //variaveis globais para funcionamento da API Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifySid = process.env.TWILIO_VERIFY_SID
    const client = twilio(accountSid, authToken)   
    
    createTempToken(dayjs())

    app.post("/login", reqLimit(20, 10), async (req, res) => {
        try {
            const {email, password} = req.body
            const user = await userExists({ email: email })
            console.log(user)
            if (user) {
                const userId = user._id
                const username = user.username
                const correctCredentials = bcrypt.compare(password, user.password)
                if (correctCredentials) {
                    const userToken = createUserToken(user._id)
                    res.status(200).json({ userToken: userToken, userId: userId, username: username })
                }
            }
            else if (!correctCredentials) {
                res.status(401).json({ message: "Login/Senha incorreto(s)" })
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: error })
        }

    })
    app.post("/send_code", reqLimit(5, 10), async (req, res) => {
        try {
            const {email} = req.body
            //verifica se o email ja existe no DB
            let exist = await userExists({ email: email })

            if (exist) {
                res.status(409).json({ message: "E-mail já cadastrado" });
            }
            else if (!exist) {
                const verification = await client.verify.v2.services(verifySid)
                    .verifications.create({
                        channelConfiguration: {
                            template_id: 'd-ab018621f4d84d32a83a746a5f69053e',
                            from: 'stancapdb@gmail.com',
                            from_name: 'Stancap'
                        }, to: email, channel: 'email'
                    })

                const verificationStatus = verification.status
                //console.log(`verification.status: ${verificationStatus}`)
                console.log(verification)
                res.status(200).json({
                    message: "Código de verificação enviado para o e-mail",
                    response: verificationStatus
                })
            }
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: error })
        }
    })

    app.post("/check_code", reqLimit(5, 10), async (req, res) => {
        try {
            console.log("REQBODY...: ", req.body)
            const {email, code} = req.body
            console.log("email: ", email)
            console.log("code: ", code)

            const exist = await userExists({ email: email })
            if (!exist) {
                const verification_check = await client.verify.v2.services(verifySid)
                    .verificationChecks
                    .create({ to: email, code: code })
                const verificationCheckStatus = verification_check.status
                //caso o codigo verificado por email seja aprovado, cria o User por enquanto apenas com o email:
                if (verificationCheckStatus == "approved") {
                    res.status(200).json({
                        message: "E-mail verificado com sucesso",
                        response: email
                    })
                } else {
                    res.status(400).json({
                        message: "Código inválido ou expirado: tente novamente"
                    })
                }
            }
        } catch (error) { res.status(400).json({ message: error }) }
    })

    app.post("/register", reqLimit(5, 10), async (req, res) => {
        try {            
            console.log("REQBODY: ", req.body)
            const {email, username} = req.body
            let password
            const selectedUser = await userExists({ email: email })
            console.log("selectedUser: ", selectedUser)
            try {
                password = await bcrypt.hash(req.body.password, 10)
            } catch (error) {
                res.status(400).json({ message: error })
            }
            
            if (!selectedUser) {
                const newUser = new User({                   
                    username: username,
                    email: email,
                    password: password
                })
                const savedUser = await newUser.save()
                console.log("savedUser: ", savedUser)

                res.status(200).json({
                    message: "Usuário cadastrado com sucesso",
                    response: savedUser
                })
            } else if (selectedUser) {
                //redundancia pois email ja foi verificado em rota anterior
                res.status(409).json({ message: "E-mail já cadastrado" });
            }
        } catch (error) { res.status(400).json({ message: error }) }
    })

    function createUserToken(userId) {
        const payload = {
            userId: userId
        }
        const userToken = jwt.sign(payload, secretKey, { expiresIn: '700h' })
        return userToken
    }

    // não está sendo usado no momento pois o CORS evita solicitacoes fora do site (MAIN_DOMAIN no env)
    function createTempToken(genericString) {
        const payload = {
            genericString: genericString
        }
        const tempToken = jwt.sign(payload, secretKey, { expiresIn: '30m' })
        return tempToken
    }
}