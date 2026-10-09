FROM node:22-alpine AS build
WORKDIR /app
# better-sqlite3 est un module natif : on prévoit de quoi le compiler si aucun binaire précompilé n'existe
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    DATABASE_PATH=/data/dashboard.db
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./package.json
# la base SQLite vit dans /data (volume) ; l'application tourne sans les droits root
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "build/index.js"]
