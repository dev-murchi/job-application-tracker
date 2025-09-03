FROM node:22-alpine

RUN apk --no-cache update

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start"] 
