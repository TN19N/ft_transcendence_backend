###################
# DEVELOPMENT
###################
FROM node:18.17.0-alpine3.18 as development

RUN apk update && apk upgrade --no-cache

ENV NODE_ENV development

WORKDIR /usr/src/app

RUN npm install -g npm@latest

CMD npm install && npm run start:dev

###################
# BUILD FOR PRODUCTION
###################
FROM node:18.17.0-alpine3.18 As build
RUN apk update && apk upgrade --no-cache

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN npm install -g npm@latest

RUN npm ci

RUN npm run build

USER node

###################
# PRODUCTION
###################
FROM node:18.17.0-alpine3.18 As production

RUN apk update && apk upgrade --no-cache && apk add --no-cache curl

ENV NODE_ENV production

WORKDIR /usr/src/app

RUN npm install -g npm@latest

COPY --chown=node:node --from=build /usr/src/app/prisma        ./prisma
COPY --chown=node:node --from=build /usr/src/app/node_modules  ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist          ./dist

RUN npm prune --production

RUN chown -R node:node .

USER node

CMD npx prisma migrate deploy && node dist/main.js
