# ft_transcendence_backend

## Description:
This repository hosts the API implementation for the ft_transcendence project.

this project is about creating a PingPong website where users will play PingPong game in real-time with others,
with a nice user interface, a chat, and real-time notification and missaging.

## Requirements
  - docker
  - docker compose

## How To Run
  - cp .env.example .env 
  - edit .env (e.x: add your intra and google credentials)
  - docker compose up production (or development)
  - open API docs at $SERVER_HOST/api/docs
  - open Database client (dbeaver) http://localhost:$DATABASE_CLIENT_PORT

## Tech Stack
  - nestJs with typescript
  - prisma
  - jwt + passport
  - socket.io
  - docker and github action for CI

## Demo:
![](https://github.com/TN19N/ft_transcendence_backend/tree/main/demo/recorde.mkv)