# LMS Week 6 Web - Express.js Application

Приложение на Node.js/Express для выполнения задания LMS Week 6.

## Структура проекта

```
.
├── app.js              # Основная логика приложения (маршруты)
├── index.js            # Точка входа (запуск сервера)
├── package.json        # Зависимости проекта
├── .env.example        # Пример переменных окружения
└── .gitignore          # Игнорируемые файлы
```

## Установка

```bash
npm install
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

Переменные:
- `WORDPRESS_URL` - URL вашего WordPress (Railway.app)
- `PORT` - порт приложения (по умолчанию 3000)

## Запуск

```bash
node index.js
```

## Реализованные маршруты

### 1. `/login/` (GET/POST)
Возвращает логин пользователя в виде текста.

**Пример:**
```bash
curl https://your-app.onrender.com/login/
# Ответ: c23defe5-07d3-4de0-b01a-32c82d7fcfc1
```

### 2. `/insert/` (POST)
Принимает данные (login, password, URL) и сохраняет пользователя в MongoDB.

**Пример:**
```bash
curl -X POST https://your-app.onrender.com/insert/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "login=testuser&password=testpass&URL=mongodb://..."
```

### 3. `/render/` (POST)
Рендерит Pug-шаблон с переданными данными.

**Параметры:**
- Query: `addr` - URL Pug-шаблона
- Body: JSON с данными для шаблона

**Пример:**
```bash
curl -X POST 'https://your-app.onrender.com/render/?addr=http://kodaktor.ru/j/unsafe_0ebdb' \
  -H "Content-Type: application/json" \
  -d '{"random2":"0.4433","random3":"0.1199"}'
```

### 4. `/wordpress/` (GET/POST)
Проксирует запросы к WordPress, развернутому на Railway.app.

**Примеры:**
```bash
# Главная страница WordPress
curl https://your-app.onrender.com/wordpress/

# API - получить пост с ID 1
curl https://your-app.onrender.com/wordpress/wp-json/wp/v2/posts/1
```

### 5. `/code/` (GET/POST)
Возвращает исходный код файла app.js.

### 6. `/sha1/:input/` (GET/POST)
Возвращает SHA1 хеш переданной строки.

**Пример:**
```bash
curl https://your-app.onrender.com/sha1/hello/
# Ответ: aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
```

### 7. `/req/` (GET/POST)
Делает HTTP-запрос по указанному адресу и возвращает ответ.

## Деплой

### Render.com (основное приложение)

1. Подключите GitHub репозиторий
2. Установите переменную окружения `WORDPRESS_URL`
3. Deploy

### Railway.app (WordPress)

1. Используйте шаблон WordPress: https://railway.app/template/wordpress
2. После деплоя настройте WordPress
3. Создайте пост с ID 1 и заголовком = вашему логину
4. Скопируйте URL и используйте в `WORDPRESS_URL`

## Зависимости

- **express** ^5.1.0 - веб-фреймворк
- **body-parser** ^1.20.2 - парсинг тела запросов
- **mongoose** ^5.8.11 - работа с MongoDB
- **pug** ^3.0.3 - рендеринг шаблонов
- **http-proxy-middleware** ^3.0.5 - проксирование запросов

## Как это работает

### app.js
Экспортирует функцию, которая принимает зависимости и создает Express приложение:
```javascript
export default function (express, bodyParser, ..., httpProxy) {
  const app = express();
  // настройка маршрутов
  return app;
}
```

### index.js
Импортирует зависимости, создает приложение и запускает сервер:
```javascript
import createApp from "./app.js";
const app = createApp(express, bodyParser, ...);
app.listen(process.env.PORT || 3000);
```

### Прокси для WordPress
Приложение определяет тип WordPress (обычный или WordPress.com) и настраивает соответствующий прокси:
- Для обычного WordPress (Railway) - простой прокси без изменений
- Для WordPress.com - прокси с маппингом ID постов

## Лицензия

ISC
