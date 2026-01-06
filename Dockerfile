FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

COPY . .

RUN npm ci
RUN npm rebuild better-sqlite3
RUN npm run build
RUN npm prune --production

# Final stage
FROM node:20-alpine

RUN apk add --no-cache nginx sqlite-dev

WORKDIR /app

COPY --from=builder /app /app

COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 8080

ENV NODE_ENV=production

CMD /bin/sh -c "PORT=3000 npm start & PORT=3001 npx tsx server/index.ts & nginx -g 'daemon off;'; wait"