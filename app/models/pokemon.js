const mongoose = require('mongoose')

const pokemonSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true
  },
  species: {
    type: String,
    required: true
  },
  ability: {
    type: String,
    required: true
  },
  moves: {
    type: [String],
    required: true
  }
}, {
  timestamps: true
})

module.exports = pokemonSchema
