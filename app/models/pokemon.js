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
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

const Pokemon = mongoose.model('Pokemon', pokemonSchema)

module.exports = {
  pokemonSchema,
  Pokemon
}
