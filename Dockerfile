FROM node:20-alpine
WORKDIR /app

ARG VITE_SHOPIFY_API_KEY
ENV VITE_SHOPIFY_API_KEY=$VITE_SHOPIFY_API_KEY

COPY package*.json ./
RUN npm install --omit=dev

COPY web/package*.json ./web/
RUN npm --prefix web install

COPY . .
RUN npm --prefix web run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
