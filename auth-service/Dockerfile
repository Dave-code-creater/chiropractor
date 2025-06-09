FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

# ✅ Copy EVERYTHING (src, validators, migrations, etc.)
COPY . .

CMD ["node", "src/index.js"]
