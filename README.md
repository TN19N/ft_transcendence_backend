# ft_transcendence_backend

## Description:
This repository hosts the API implementation for the ft_transcendence project.

This project is about creating a Ping-Pong website where users will play Ping-Pong game in real-time with others,
with a nice user interface, a chat, and real-time notification and messaging.

## Requirements
  - docker
  - docker compose

## How To Run
  - cp .env.example .env 
  - edit .env (e.x: add your 42 and google credentials)
  - docker compose up production (or development)
  - open API docs at $SERVER_HOST/api/docs
  - open Database client (dbeaver) http://localhost:$DATABASE_CLIENT_PORT

## Tech Stack
  - NestJs with typescript
  - prisma
  - jwt + passport
  - socket.io
  - docker and github action for CI

## env:
``` bash
# Backend
BACKEND_HOST="backend"
BACKEND_PORT="9000"

# JWT
JWT_SECRET="nmy1ZWSX63Y9ks4"

# Encryption (should be 32 bytes long)
ENCRYPT_KEY="7uYAW8QYIGcZQC27J3694fHzTdU4rRlG"

# Intra 42 OAuth
# from: https://profile.intra.42.fr/oauth/applications
INTRA42_CLIENT_ID="client_id"
INTRA42_CLIENT_SECRET="client_secret"
# redirect url is http://localhost:$BACKEND_PORT/api/v1/auth/intra42

# google OAuth
# from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="client_id"
GOOGLE_CLIENT_SECRET="client_secret"
# redirect url is http://localhost:$BACKEND_PORT/api/v1/auth/google

# Database
DATABASE_HOST="database"
DATABASE_PORT="7000"
DATABASE_USER="TN19N"
DATABASE_PASSWORD="j5q2r4L5flaVI3Sm89"
DATABASE_NAME="ft_transcendence_db"

# don't change this
DATABASE_CLIENT_PORT="8978"

# Server Host (the port should be the same as the backend port)
SERVER_HOST="http://localhost:9000"
```