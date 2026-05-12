FROM node:22-alpine AS build

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api
ARG API_INTERNAL_URL=http://api:4000
ARG NEXT_PUBLIC_SITE_URL=https://sotik77.ru
ARG NEXT_PUBLIC_STORE_BRAND=sotik77
ARG NEXT_PUBLIC_SOTIK_AVITO_REVIEWS_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_STORE_BRAND=$NEXT_PUBLIC_STORE_BRAND
ENV NEXT_PUBLIC_SOTIK_AVITO_REVIEWS_URL=$NEXT_PUBLIC_SOTIK_AVITO_REVIEWS_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
