###################
# DEVELOPMENT
###################
FROM node:18.17.0 as development

RUN apt update && apt upgrade -y

ENV NODE_ENV development

WORKDIR /usr/src/app

CMD npm install && npm run start:dev

###################
# BUILD FOR PRODUCTION
###################
FROM node:18.17.0-alpine3.18 As build

RUN apk update && apk upgrade --no-cache

WORKDIR /usr/src/app

COPY . .

RUN npm ci

RUN npm run build

RUN npm prune --production

###################
# PRODUCTION
###################
FROM node:18.17.0-alpine3.18 As production

RUN apk update && apk upgrade --no-cache

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules  ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist          ./dist

USER node

CMD node dist/main.js