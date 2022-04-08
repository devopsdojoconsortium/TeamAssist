FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# RUN npm install
# If you are building your code for production
RUN npm ci

# Bundle app source
COPY index.html debug.html server.js favicon.ico ./
COPY css ./css/ 
COPY images ./images/ 
COPY sounds ./sounds
COPY dist ./dist/ 

EXPOSE 80

CMD [ "node", "server.js" ]