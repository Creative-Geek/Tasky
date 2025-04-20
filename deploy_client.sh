#!/usr/bin/env bash

if [ -z "$REACT_APP_API_URL" ]
then
  echo "REACT_APP_API_URL is not set"
  exit 1
fi

wasp build
cd .wasp/build/web-app

npm install && REACT_APP_API_URL=$REACT_APP_API_URL npm run build

cp -r build dist

dockerfile_contents=$(cat <<EOF
FROM pierrezemb/gostatic
CMD [ "-fallback", "index.html" ]
COPY ./dist/ /srv/http/
EOF
)

dockerignore_contents=$(cat <<EOF
node_modules/
EOF
)

echo "$dockerfile_contents" > Dockerfile
echo "$dockerignore_contents" > .dockerignore

railway up