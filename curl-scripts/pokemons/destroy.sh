#!/bin/bash

API="http://localhost:4741"
URL_PATH="/teams/${TEAM_ID}/pokemons/${POKEMON_ID}"

curl "${API}${URL_PATH}" \
  --include \
  --request DELETE \
  --header "Authorization: Bearer ${TOKEN}"

echo
