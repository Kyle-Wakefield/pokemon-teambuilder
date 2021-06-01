const mongoose = require('mongoose')
const pokemonSchema = require('./pokemon.js')

const teamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  pokemons: {
    type: [pokemonSchema],
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

module.exports = mongoose.model('Team', teamSchema)
