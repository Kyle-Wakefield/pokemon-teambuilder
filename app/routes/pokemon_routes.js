// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for pokemons
const pokemon = require('../models/pokemon')
const Pokemon = pokemon.Pokemon
const Team = require('../models/team')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership
// this function throws an error if we try to add a pokemon to a team that's already full
const requireTeamSlot = customErrors.requireTeamSlot

// this is middleware that will remove blank fields from `req.body`, e.g.
// { pokemon: { title: '', text: 'foo' } } -> { pokemon: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /teams/:id/pokemons
router.get('/teams/:id/pokemons', requireToken, (req, res, next) => {
  Team.findById(req.params.id)
    // check if the team was found
    .then(handle404)
    // check if the user owns the team
    .then(team => requireOwnership(req, team))
    // send the team's pokemons array down the promise chain
    .then(team => team.pokemons)
    // respond with status 200 and JSON of the pokemons
    .then(pokemons => res.status(200).json({ pokemons: pokemons }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /pokemons/:id
router.get('/pokemons/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Pokemon.findById(req.params.id)
    // check if the pokemon was found
    .then(handle404)
    // check if the user owns the pokemon
    .then(pokemon => requireOwnership(req, pokemon))
    // if `findById` is successful, respond with 200 and "pokemon" JSON
    .then(pokemon => res.status(200).json({ pokemon: pokemon.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /pokemons
router.post('/teams/:id/pokemons', requireToken, (req, res, next) => {
  req.body.pokemon.owner = req.user.id

  Team.findById(req.params.id)
    // check if the team was found
    .then(handle404)
    // check if the user owns the team
    .then(team => requireOwnership(req, team))
    // check if the team has space for another pokemon
    .then(requireTeamSlot)
    // If the team passes the checks above, create a new pokemon and add it to the team
    .then(team => {
      Pokemon.create(req.body.pokemon)
      // respond to successful `create` with status 201 and JSON of new "pokemon"
        .then(pokemon => {
          team.pokemons.push(pokemon)
          team.save()
          res.status(201).json({ pokemon: pokemon.toObject() })
        })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /teams/:teamId/pokemons/:pokemonId
router.patch('/teams/:teamId/pokemons/:pokemonId', requireToken, removeBlanks, (req, res, next) => {
  Team.findById(req.params.teamId)
    // check if the team was found
    .then(handle404)
    // check if the user owns the team
    .then(team => requireOwnership(req, team))
    // find the pokemon to update
    .then(team => {
      Pokemon.findById(req.params.pokemonId)
        // check if the pokemon was found
        .then(handle404)
        // check if the user owns the pokemon
        .then(pokemon => requireOwnership(req, pokemon))
        .then(pokemon => {
          // find the pokemon in the team's pokemon array
          const indexToUpdate = team.pokemons.findIndex(element => element._id.toString() === pokemon._id.toString())
          // throw an error if the pokemon isn't in the team's pokemons array
          if (indexToUpdate < 0) {
            throw new customErrors.PokemonError('Cannot update pokemon, pokemon does not match team')
          }
          // update the pokemon in the array and the database
          pokemon.set(req.body.pokemon)
          pokemon.save()
          team.pokemons[indexToUpdate] = pokemon
          team.save()
          return pokemon
        })
        .then((pokemon) => {
          res.status(200).json({ pokemon: pokemon.toObject() })
        })
    })
    // if an error occurs, pass it to the handler
    // send back 204 and no content if the deletion succeeded
    .catch(next)
})

// DESTROY
// DELETE /teams/:teamId/pokemons/:pokemonId
router.delete('/teams/:teamId/pokemons/:pokemonId', requireToken, (req, res, next) => {
  Team.findById(req.params.teamId)
    // check if the team was found
    .then(handle404)
    // check if the user owns the team
    .then(team => requireOwnership(req, team))
    // if the team passes the checks above, find the pokemon to remove
    .then(team => {
      Pokemon.findById(req.params.pokemonId)
        // check if the pokemon was found
        .then(handle404)
        // check if the user owns the pokemon
        .then(pokemon => requireOwnership(req, pokemon))
        .then(pokemon => {
          // find the pokemon in the team's pokemon array
          const indexToDelete = team.pokemons.findIndex(element => element._id.toString() === pokemon._id.toString())
          // throw an error if the pokemon isn't in the team's pokemons array
          if (indexToDelete < 0) {
            throw new customErrors.PokemonError('Cannot delete pokemon, pokemon does not match team')
          }
          // remove the pokemon from the array and delete the pokemon from the database
          team.pokemons.splice(indexToDelete, 1)
          pokemon.deleteOne()
          team.save()
          res.sendStatus(204)
        })
        .catch(next)
    })
    // if an error occurs, pass it to the handler
    // send back 204 and no content if the deletion succeeded
    .catch(next)
})

module.exports = router
