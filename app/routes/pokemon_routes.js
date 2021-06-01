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
    .then(handle404)
    // if findById is successful, send the team's pokemons array down the promise chain
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
    .then(handle404)
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
    // check if a team was found
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
// PATCH /pokemons/:id
router.patch('/pokemons/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.pokemon.owner

  Pokemon.findById(req.params.id)
    .then(handle404)
    .then(pokemon => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, pokemon)

      // pass the result of Mongoose's `.update` to the next `.then`
      return pokemon.updateOne(req.body.pokemon)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /pokemons/:id
router.delete('/pokemons/:id', requireToken, (req, res, next) => {
  Pokemon.findById(req.params.id)
    .then(handle404)
    .then(pokemon => {
      // throw an error if current user doesn't own `pokemon`
      requireOwnership(req, pokemon)
      // delete the pokemon ONLY IF the above didn't throw
      pokemon.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
