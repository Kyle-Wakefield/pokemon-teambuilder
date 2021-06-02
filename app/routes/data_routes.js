// Express docs: http://expressjs.com/en/api.html
const express = require('express')

// // this is a collection of methods that help us detect situations when we need
// // to throw a custom error
// const customErrors = require('../../lib/custom_errors')
//
// // we'll use this function to send 404 when non-existant document is requested
// const handle404 = customErrors.handle404
//
// // this is middleware that will remove blank fields from `req.body`, e.g.
// // { pokemon: { title: '', text: 'foo' } } -> { pokemon: { text: 'foo' } }
// const removeBlanks = require('../../lib/remove_blank_fields')

// a file with all the species names
const names = require('../pokemon-data/names')

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// get all species names that contain a string
router.get('/names', (req, res, next) => {
  const filteredNames = names.filter(name => name.includes(req.body.searchString.toLowerCase()))
  // capitalize the names, including characters after a " " or "-" (ex: mr. mime => Mr. Mime, ho-oh => Ho-Oh)
  const capitalizedNames = filteredNames.map(name => {
    let capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
    for (let i = 0; i < name.length; i++) {
      if (name.charAt(i) === ' ' || name.charAt(i) === '-') {
        capitalizedName = capitalizedName.slice(0, i + 1) + name.charAt(i + 1).toUpperCase() + capitalizedName.slice(i + 2)
      }
    }
    return capitalizedName
  })
  res.status(200).json({names: capitalizedNames})
})

module.exports = router
