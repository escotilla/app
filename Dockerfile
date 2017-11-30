FROM node:carbon

WORKDIR /app

COPY package.json /app

RUN npm install
CMD npm run build

COPY . /app

CMD npm run server
EXPOSE 8000