# Hafif Node.js image - Chrome/Chromium GEREK YOK
FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# Bağımlılıkları yükle
COPY package*.json ./
RUN npm install --production

# Uygulama dosyalarını kopyala
COPY . .

# Port
ENV PORT=3001
EXPOSE 3001

# Başlat
CMD ["node", "server.js"]
