# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制package文件并安装所有依赖
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段 - 使用nginx服务静态文件
FROM nginx:alpine

# 复制构建好的文件到nginx
COPY --from=build /app/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]