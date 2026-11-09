# Frontend: Create React App built to static files, served by nginx.
#
# Every REACT_APP_* value is inlined into the bundle by `react-scripts build`,
# so they are build arguments, not runtime environment variables. Changing one
# means rebuilding the image — and it means none of them can hold a secret,
# since anyone can read them out of the served JavaScript.

FROM node:20-alpine AS build

WORKDIR /app

# Copied separately so the install layer is only invalidated by manifest
# changes, not by every source edit.
COPY package.json package-lock.json ./
RUN npm ci

COPY public ./public
COPY src ./src

ARG REACT_APP_JUDGE0_URL
ARG REACT_APP_JUDGE0_HOST
ARG REACT_APP_JUDGE0_KEY
ARG REACT_APP_COLLAB_WS_URL
ARG REACT_APP_COLLAB_ENABLED

# CRA treats warnings as errors when CI is set, which breaks the build on
# things like an unused import. Unset it explicitly — many CI runners set it.
ENV CI=false
ENV GENERATE_SOURCEMAP=false

RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
