FROM node:24.12-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
USER node
EXPOSE 4006
CMD ["node", "app.js"]
