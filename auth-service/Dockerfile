FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps
# ✅ Copy EVERYTHING (src, validators, migrations, etc.)
COPY . .

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3001

CMD ["npm", "start"]
