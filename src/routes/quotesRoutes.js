import { Quotes } from "../models/Quotes.js"
import { selectQuote, quoteExists } from "./commonFunctions.js"
import { requireUserToken, reqLimit } from "./middleware.js"
import _ from "lodash"

export const quotesRoutes = (app) => {
  //resultados perPage para todas as rotas com limite de resultado. padrao: 5
  const perPage = 5

  // toda rota/ serviço que nao tiver "all" no nome retornará até 5 itens
  //todas as quotes SEM limite
  //descartar
  // app.get("/all_quotes", reqLimit(200), async (req, res) => {
  //   try {
  //     const response = await Quotes.find()
  //     res.status(200).json(response)
  //   } catch (error) {
  //     res.status(400).json({ message: error })
  //   }
  // })

  //busca especifica SEM limite
  // descartar 
  // app.post("/search_all_quotes", reqLimit(200), async (req, res) => {
  //   try {
  //     const response = await selectQuote(req.body)
  //     res.status(200).json(response)
  //   } catch (error) {
  //     res.status(400).json({ message: error })
  //   }
  // })

  //todas as quotes COM limite de 5 por page
  // usar apenas essa rota pra com/sem query
  app.get(`/get_quotes`, reqLimit(200), async (req, res) => {
    try {
      const searchquery = _.omit(req.query, ['page', 'sort'])
      console.log("sss", searchquery)
      const sort = req.query.sort === "ascending" ? 1 : -1
      const page = req.query.page ? parseInt(req.query.page) : 1
      const skipItems = (page - 1) * perPage
      const response = await selectQuote(searchquery, sort, skipItems, perPage)
      // console.log("ppp")
      //  console.log(response)
      res.status(200).json(response)
    } catch (error) {
      console.log("ERROROTA: ", error)
      res.status(400).json({ message: error })
    }
  })

  app.patch("/edit_quote", reqLimit(40), requireUserToken, async (req, res) => {
    try {
      console.log("req.query: ", req.query)
      console.log("rqbody: ", req.body)
      const {quotes, message} = await selectQuote(req.query)
      if (quotes) {
        const response = await Quotes.updateOne(
          quotes[0],
          { ...req.body }
        )
        console.log("rr")
        console.log(response)
        response ? res.status(200).send(true) : res.status(400).send({ message: "Erro ao editar quote" })
      } else {
        res.status(400).send(false)
      }
    } catch (error) {
      res.status(400).json({ message: error })
    }
  })

  app.delete("/delete_quote", reqLimit(25), requireUserToken, async (req, res) => {
    try {
      const quoteId = { _id: req.query.quoteId }
      const userId = req.query.userId
      //console.log(await selectQuote(quoteId))
      //let findingQuote = (await selectQuote(quoteId)).foundQuote
      //let selectedQuote = findingQuote[0]
      let selectedQuote = await selectQuote(quoteId)
      selectedQuote = selectedQuote.quotes[0]
      console.log("SS:")
      console.log( selectedQuote)
      

      if (selectedQuote.uploadByUser === userId) {
        const response = await Quotes.deleteMany(quoteId)
        if (response.deletedCount > 0) {
          res.status(200).send({ selectedQuote })
        }
      } else {
        res.status(400).send({ message: "Você não tem permissão para excluir essa quote" })
      }
    } catch (error) {
      console.log(error)
      res.status(400).json({ message: error })
    }
  })

  app.post("/add_quote", reqLimit(50), requireUserToken, async (req, res) => {
    const quote = req.body
    try {
      const newQuote = new Quotes(quote)
      const savedQuote = await newQuote.save()
      res.status(200).json(savedQuote)
    } catch (error) {
      res.status(400).json({ message: error })
    }
  })
}