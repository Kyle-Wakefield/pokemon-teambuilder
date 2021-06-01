#!/bin/bash

API="http://localhost:4741"
URL_PATH="/teams/${TEAM_ID}/pokemons/${POKEMON_ID}"

curl "${API}${URL_PATH}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
--header "Authorization: Bearer ${TOKEN}" \
--data '{
    "pokemon": {
      "nickname": "'"${NICKNAME}"'",
      "species": "'"${SPECIES}"'",
      "ability": "'"${ABILITY}"'",
      "moves": ["'"${M1}"'", "'"${M2}"'", "'"${M3}"'", "'"${M4}"'"]
    }
  }'

echo
