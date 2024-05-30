import { User } from "../models/User.js"
import { Quotes } from "../models/Quotes.js"
import mongoose from "mongoose"
import _ from "lodash"

export let QuotesLabels =
  [
    { label: "Autor", value: "author" },
    { label: "Tags", value: "tags" },
    { label: "Source", value: "source" },
    { label: "Upload por", value: "uploadByUsername" },
    { label: "Contexto", value: "context" },
    { label: "Ordem", value: "sort" },
    { label: "Tipo", value: "quoteType" }
  ]

export function getPropertyLabel(rawValue) {
  let response
  const findLabel = QuotesLabels.find((prop) => prop.value === rawValue)
  findLabel ? response = findLabel.label : response = null
  return response
}

// Função que seleciona o usuário através de qualquer propriedade. Usa sempre o primeiro objeto da requisição ( {propriedade: valorDaPropriedade} ). Serve para selecionar o usuário caso a rota não explicite a propriedade selecionada.
export async function selectUser(searchQuery) {
  let property = Object.keys(searchQuery)[0]
  let target = searchQuery[property]
  let query = { [property]: target }

  if (property !== "_id") {
    return false
  }

  let foundUser = await User.find(searchQuery).lean()
  if (foundUser) {
    return _.pick(foundUser[0], "username")
  } else {
    return false
  }
}

// Essa função permite selecionar qualquer usuário usando qualquer propriedade como filtro. Recebe como parâmetro um único OBJETO (propriedade: valorPropriedade)
export async function userExists(proprietyTarget) {
  const user = await User.findOne(proprietyTarget)
  if (user) {
    return user
  }
  else {
    return false
  }
}

export async function selectQuote(searchQueryArg, sort, skipItems = null, limit = null) {
  const searchQueryKeys = Object.keys(searchQueryArg)
  const searchQuery = searchQueryArg
  let quotesQtd
  let queriesToDo = {}

  console.log("searchQuery: ", searchQuery)
  if (searchQueryKeys.includes("uploadByUsername")) {
    console.log("entrou no if upuser")
    let foundUser = await User.find({ username: searchQuery.uploadByUsername })
    foundUser = foundUser[0]
    if (foundUser) {
      const userId = _.pick(foundUser, "_id")
      const userIdStr = userId._id.toString()
      delete searchQuery.uploadByUsername
      let uploadByUsernameQuery = { uploadByUser: userIdStr }
      queriesToDo = { ...queriesToDo, ...uploadByUsernameQuery }
    } else {
      queriesToDo = { ...queriesToDo, ...{ "uploadByUsername": null } }
    }
  }

  if (searchQueryKeys.includes("tags")) {
    let tagsToSearch = searchQuery.tags.split(",")
    tagsToSearch = tagsToSearch.map(tag => tag.trim())
    delete searchQuery.tags
    let tagsQuery = { tags: { $in: tagsToSearch } }
    queriesToDo = { ...queriesToDo, ...tagsQuery }
  }
  queriesToDo = { ...queriesToDo, ...searchQuery }
  console.log("oo: ", queriesToDo)

  let quotesCount = {}
  let findingQuotes = []
  let successQueries = []
  let failedQueries = []
  let mostQueryRes = null

  const fullQueryTry = await Quotes.find
    (queriesToDo)
    .sort({ uploadDate: sort })
    .skip(skipItems)
    .limit(limit).lean()

  //console.log("fullquerytry: ", fullQueryTry)

  const failedTags = []
  if (fullQueryTry.length > 0) {
    successQueries = fullQueryTry
    quotesQtd = await Quotes.countDocuments(queriesToDo)
  } else {
    for (const [key, value] of Object.entries(queriesToDo)) {
      console.log("entrou loop 1")
      console.log("key: ", key)
      console.log("value: ", value)
      let keyValuePair
      if (value["$in"]) {
        keyValuePair = `{"${key}":{"$in":${JSON.stringify(tagsArr)}}}`
      } else {
        keyValuePair = `{"${key}":"${value}"}`
      }
      const quotes = await Quotes.find({ [key]: value })
        .sort({ uploadDate: sort })
        .skip(skipItems)
        .limit(limit)
        .lean()
      findingQuotes.push(...quotes)
      // contabiliza a query com mais resultados        
      quotesCount[keyValuePair] = (quotesCount[keyValuePair] || 0) + quotes.length
    }

    let maxQuotes = -1
    //define qual query teve mais resultados
    for (const [key, value] of Object.entries(quotesCount)) {
      if (value > maxQuotes) {
        maxQuotes = value
        mostQueryRes = { [key]: value }
      }
    }
    console.log("quotesCount: ", quotesCount)

    const qtsCntKeys = _.keys(quotesCount)
    let doneQueries = qtsCntKeys.map(str => JSON.parse(str))
    doneQueries = _.merge({}, ...doneQueries)
    const mQrKey = Object.keys(mostQueryRes)[0]
    mostQueryRes = JSON.parse(mQrKey)
    quotesQtd = await Quotes.countDocuments(mostQueryRes)

    console.log("mostQueryRes: ", mostQueryRes)
    console.log("qtsCntKeys: ", qtsCntKeys)
    console.log("doneQueries: ", doneQueries)

    if (findingQuotes.length > 0) {
      for (const key in doneQueries) {
        let keyAdded = false
        for (const obj of findingQuotes) {
          if (obj[key] !== mostQueryRes[key]) {
            if (!keyAdded) {
              failedQueries.push(key)
              keyAdded = true
            }
          } else {
            successQueries.push(obj)
          }
        }
      }
    } else {
      //console.log("kkk: ", _.keys(doneQueries)[0])
      failedQueries.push(_.keys(doneQueries)[0])
    }
    console.log("findingQuotes.length:", findingQuotes.length)
    console.log("failedQueries: ", failedQueries)
    // console.log("successQueries: ", successQueries)
  }

  let message = null
  let frmtFailedQueries = failedQueries.map((k) => getPropertyLabel(k) || k).join(" + ")
  let frmtFailedTags = failedTags.join(" , ")
  console.log("failedQueries: ", failedQueries)
  console.log("quotesQtd: ", quotesQtd)
  console.log("failedTags: ", failedTags)
  if (failedTags.length > 0) {
    message = `Tag(s): ${frmtFailedTags} não encontrada(s). Apague-a(s) da pesquisa.`
  }
  else if (failedQueries.length > 0 && successQueries.length > 0) {
    message = `Resultados de apenas ${getPropertyLabel(..._.keys(mostQueryRes))}.
    ${frmtFailedQueries} não encontrado(s)`
  } else if (successQueries.length === 0) {
    message = `${frmtFailedQueries} não encontrado(s).
    Reduza o escopo da pesquisa.`
  }
  return { quotes: successQueries, message: message, quotesQtd: quotesQtd }
}

// Essa função permite selecionar qualquer quote usando qualquer propriedade como filtro. Recebe como parâmetro um único OBJETO (propriedade: valorPropriedade)
export async function quoteExists(proprietyTarget) {
  const quote = await Quotes.findOne({ proprietyTarget })
  if (quote) {
    return true
  }
  else {
    return false
  }
}