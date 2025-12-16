#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Скрипт развёртывания системы "Книги Сказочного Края"
# Для Ubuntu 20.04+ / Debian 11+
# ═══════════════════════════════════════════════════════════════

set -e  # Прерывать при ошибках

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
APP_NAME="library"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN=""  # Укажите ваш домен или IP
DB_NAME="library_db"
DB_USER="lib_user"
DB_PASSWORD="radostnochitat"  # ИЗМЕНИТЕ НА БЕЗОПАСНЫЙ ПАРОЛЬ!
NODE_VERSION="20"

# Функции вывода
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Проверка прав root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Запустите скрипт с правами root (sudo)"
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════
# 1. УСТАНОВКА СИСТЕМНЫХ ПАКЕТОВ
# ═══════════════════════════════════════════════════════════════
install_packages() {
    print_header "1. Установка системных пакетов"
    
    apt update
    apt install -y curl wget git nginx mysql-server
    
    # Установка Node.js через NodeSource
    if ! command -v node &> /dev/null; then
        print_info "Установка Node.js ${NODE_VERSION}..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt install -y nodejs
    fi
    
    # Установка PM2 глобально
    if ! command -v pm2 &> /dev/null; then
        print_info "Установка PM2..."
        npm install -g pm2
    fi
    
    print_success "Системные пакеты установлены"
}

# ═══════════════════════════════════════════════════════════════
# 2. НАСТРОЙКА MYSQL
# ═══════════════════════════════════════════════════════════════
setup_mysql() {
    print_header "2. Настройка MySQL"
    
    # Запуск и автозапуск MySQL
    systemctl start mysql
    systemctl enable mysql
    
    # Создание пользователя и базы данных
    print_info "Создание базы данных и пользователя..."
    
    mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
    
    print_success "MySQL настроен"
}

# ═══════════════════════════════════════════════════════════════
# 3. КОПИРОВАНИЕ ФАЙЛОВ ПРИЛОЖЕНИЯ
# ═══════════════════════════════════════════════════════════════
deploy_app() {
    print_header "3. Развёртывание приложения"
    
    # Создание директории
    mkdir -p ${APP_DIR}
    
    # Если скрипт запущен из директории проекта
    if [ -f "./dist/index.html" ]; then
        print_info "Копирование собранного frontend..."
        cp -r ./dist/* ${APP_DIR}/
    else
        print_warning "Папка dist не найдена. Скопируйте собранные файлы в ${APP_DIR}/"
    fi
    
    # Копирование backend
    if [ -d "./server" ]; then
        print_info "Копирование backend..."
        mkdir -p ${APP_DIR}/server
        cp -r ./server/* ${APP_DIR}/server/
    elif [ -d "./public/server" ]; then
        print_info "Копирование backend из public/server..."
        mkdir -p ${APP_DIR}/server
        cp -r ./public/server/* ${APP_DIR}/server/
    fi
    
    print_success "Файлы скопированы"
}

# ═══════════════════════════════════════════════════════════════
# 4. НАСТРОЙКА BACKEND
# ═══════════════════════════════════════════════════════════════
setup_backend() {
    print_header "4. Настройка Backend"
    
    cd ${APP_DIR}/server
    
    # Создание .env файла
    print_info "Создание файла .env..."
    cat > .env << EOF
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
PORT=3001
EOF
    
    # Установка зависимостей
    print_info "Установка npm зависимостей..."
    npm install --production
    
    # Импорт схемы базы данных
    if [ -f "schema.sql" ]; then
        print_info "Импорт схемы базы данных..."
        mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < schema.sql
        print_success "Схема базы данных импортирована"
    fi
    
    # Запуск через PM2
    print_info "Запуск API сервера через PM2..."
    pm2 delete ${APP_NAME}-api 2>/dev/null || true
    pm2 start server.js --name "${APP_NAME}-api"
    pm2 save
    pm2 startup systemd -u root --hp /root
    
    print_success "Backend настроен и запущен"
}

# ═══════════════════════════════════════════════════════════════
# 5. НАСТРОЙКА NGINX
# ═══════════════════════════════════════════════════════════════
setup_nginx() {
    print_header "5. Настройка Nginx"
    
    # Определение server_name
    if [ -z "$DOMAIN" ]; then
        SERVER_NAME=$(hostname -I | awk '{print $1}')
        print_warning "Домен не указан. Используется IP: ${SERVER_NAME}"
    else
        SERVER_NAME=$DOMAIN
    fi
    
    # Создание конфигурации Nginx
    print_info "Создание конфигурации Nginx..."
    
    cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    # Корневая директория с frontend
    root ${APP_DIR};
    index index.html;

    # Логи
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Кэширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend Routing (для SPA приложений React)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API Proxy (перенаправление запросов на Backend)
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
    
    # Активация конфигурации
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # Проверка конфигурации
    nginx -t
    
    # Перезагрузка Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    print_success "Nginx настроен"
}

# ═══════════════════════════════════════════════════════════════
# 6. НАСТРОЙКА FIREWALL (UFW)
# ═══════════════════════════════════════════════════════════════
setup_firewall() {
    print_header "6. Настройка Firewall"
    
    if command -v ufw &> /dev/null; then
        ufw allow ssh
        ufw allow 'Nginx Full'
        ufw --force enable
        print_success "Firewall настроен"
    else
        print_warning "UFW не установлен. Пропускаем настройку firewall."
    fi
}

# ═══════════════════════════════════════════════════════════════
# 7. ЗАВЕРШЕНИЕ
# ═══════════════════════════════════════════════════════════════
finish() {
    print_header "Развёртывание завершено!"
    
    # Получение IP адреса
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                    📚 ГОТОВО!                             ║"
    echo "╠═══════════════════════════════════════════════════════════╣"
    echo "║                                                           ║"
    echo "║  Приложение доступно по адресу:                          ║"
    echo "║  🌐 http://${SERVER_IP}                                   "
    echo "║                                                           ║"
    echo "║  Полезные команды:                                       ║"
    echo "║  • pm2 status         - статус приложений                ║"
    echo "║  • pm2 logs           - просмотр логов                   ║"
    echo "║  • pm2 restart all    - перезапуск                       ║"
    echo "║  • systemctl restart nginx - перезапуск Nginx            ║"
    echo "║                                                           ║"
    echo "║  Файлы приложения: ${APP_DIR}                            "
    echo "║  Логи Nginx: /var/log/nginx/${APP_NAME}_*.log            "
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_warning "Не забудьте изменить пароль базы данных на безопасный!"
}

# ═══════════════════════════════════════════════════════════════
# ГЛАВНАЯ ФУНКЦИЯ
# ═══════════════════════════════════════════════════════════════
main() {
    print_header "📚 Книги Сказочного Края - Установка"
    
    check_root
    
    # Запрос домена/IP
    read -p "Введите домен или IP сервера (или Enter для автоопределения): " DOMAIN
    
    install_packages
    setup_mysql
    deploy_app
    setup_backend
    setup_nginx
    setup_firewall
    finish
}

# Запуск
main "$@"
