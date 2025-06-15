FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3002

CMD ["npm", "start"]