FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN apk add --no-cache curl openssl && curl -o global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
