import mongoose from "mongoose"

// Obs.: Toda propriedade que não for explícita se refere à Quote. Por ex.: "author" e "date" é "author" e "date" da Quote. "uploadByUser" e "uploadDate" são explícitas logo se refere ao Upload em si e não à Quote.

const QuoteSchema = new mongoose.Schema(
    {
        quotes: {
            type: Array,
            items: {
                type: Array,
                quote: { type: String },
                author: { type: String }
            }
        },
        tags: {
            type: Array,            
            items: { type: String }
        },
        author: {
            type: String,
        },
        context: { type: String },
        source: { type: String },
        date: { type: String },
        uploadDate: { type: String },
        lastEditDate: { type: String},
        uploadByUser: { type: String },
        quoteType: { type: String }
    }, {collation: { locale: 'pt', strength: 2 }}
)
//QuoteSchema.path('tags').index({ tags: { text: true, } })

export const Quotes = mongoose.model('Quotes', QuoteSchema)
