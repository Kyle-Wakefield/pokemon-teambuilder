#!/bin/bash

API="http://localhost:4741"
URL_PATH="/names"

curl "${API}${URL_PATH}" \
  --include \
  --request GET \
  --header "Content-Type: application/json" \
  --data '{
    "searchString": "'"${STRING}"'"
  }'

echo
