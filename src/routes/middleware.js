import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { rateLimit } from 'express-rate-limit'
dotenv.config()
const secretKey = process.env.SECRET_KEY

export function reqLimit(maxRequests, time=60) {
    return rateLimit({
      windowMs: time * 60 * 1000, 
      max: maxRequests,
      message: {message: "Limite de solicitações atingido. Tente novamente daqui 1 hora."}
    })
  }

export const requireUserToken = (req, res, next) => {
    let userToken
    if(req.headers['authorization']){
        const rawUserToken = req.headers['authorization']
        userToken = rawUserToken.replace('Bearer ', '').trim()
    }
    else{
        res.send({message: "Sem header de token de autorização."})
    }

    if(!userToken) {
        return res.status(401).json({message: "Token de usuário não fornecido. Faça login."})
    }

    try {
        const legitToken = jwt.verify(userToken, secretKey)
        if(legitToken) {
            next()
        } else {
            return res.status(401).json({message: "Token de usuário inválido. Faça login."})
        }
    } catch (error) {
        console.log(error)
        if (error instanceof jwt.TokenExpiredError) {            
            return res.status(498).json({ message: "Token de usuário expirado. Faça login novamente." })            
        }
    }
}

export const requireTempToken = (req, res, next) => {
    let tempToken
    if(req.headers['tempauthorization']){
        const rawtempToken = req.headers['tempauthorization']
        tempToken = rawtempToken.replace('Bearer ', '').trim()
    }
    else{
        res.send({message: "Sem header de token temporário."})
    }

    if(!tempToken) {
        return res.status(401).json({message: "Token temporário não encontrado. Tente novamente."})
    }

    try {
        const legitToken = jwt.verify(tempToken, secretKey)
        if(legitToken) {
            next()
        } else {
            return res.status(401).json({message: "Token temporário inválido. Tente novamente."})
        }
    } catch (error) {
        console.log(error)
        if (error instanceof jwt.TokenExpiredError) {            
            return res.status(498).json({ message: "Token temporário expirado. Tente novamente." })
            
        }
    }
}