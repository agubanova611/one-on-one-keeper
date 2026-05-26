# 🚀 Деплой 1:1 Keeper на Vercel

## Предварительные требования

- Аккаунт на [Vercel](https://vercel.com)
- Аккаунт на [Supabase](https://supabase.com)
- GitHub репозиторий (рекомендуется)

---

## Шаг 1: Подготовка репозитория

### Инициализируйте Git (если ещё не сделано)

```bash
cd one-on-one-keeper
git init
git add .
git commit -m "Initial commit: 1:1 Keeper app"
```

### Создайте репозиторий на GitHub

1. Создайте новый репозиторий на [GitHub](https://github.com/new)
2. Следуйте инструкциям для push:

```bash
git remote add origin https://github.com/yourusername/one-on-one-keeper.git
git branch -M main
git push -u origin main
```

---

## Шаг 2: Подготовка Supabase для продакшена

### 1. Обновите Site URL

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. **Authentication** → **URL Configuration**
4. Обновите:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: добавьте
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**`

### 2. Включите необходимые провайдеры

**Authentication** → **Providers**:
- Email/Password (включён по умолчанию)
- Google (опционально): добавьте Client ID и Secret

### 3. Настройте Realtime

**Database** → **Replication**:
Убедитесь, что таблицы включены для Realtime:
- `meetings`
- `action_items`
- `reminders`

---

## Шаг 3: Деплой на Vercel

### Через GitHub (рекомендуется)

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **"New Project"**
3. Импортируйте ваш GitHub репозиторий
4. Настройте проект:

**Framework Preset**: Next.js

**Build Command**: `npm run build`

**Output Directory**: `.next`

**Environment Variables** (нажмите "Env" и добавьте):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

5. Нажмите **"Deploy"**

### Через Vercel CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой
cd one-on-one-keeper
vercel

# Для продакшена
vercel --prod
```

---

## Шаг 4: Настройка после деплоя

### 1. Обновите Supabase Redirect URLs

После успешного деплоя добавьте production URL:

**Authentication** → **URL Configuration** → **Redirect URLs**:
```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/login
https://your-app.vercel.app/**
```

### 2. Настройте домен (опционально)

1. Vercel Dashboard → **Settings** → **Domains**
2. Добавьте ваш домен (например, `app.yoursite.com`)
3. Обновите **Site URL** в Supabase

### 3. Обновите Environment Variables

Если используете кастомный домен:
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Добавьте `NEXT_PUBLIC_SITE_URL=https://your-domain.com`

---

## Шаг 5: Локальная разработка

Для локальной разработки создайте `.env.local`:

```bash
# Скопируйте пример
cp .env.example .env.local

# Заполните реальными значениями из Supabase
# Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Запустите:
```bash
npm run dev
```

---

## Возможные проблемы

### Ошибка аутентификации после деплоя

**Проблема**: Пользователи не могут войти после деплоя

**Решение**: 
1. Проверьте Redirect URLs в Supabase
2. Убедитесь, что Site URL соответствует production URL

### Ошибка CORS

**Проблема**: CORS error в консоли

**Решение**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Добавьте production URL в разрешённые

### Realtime не работает

**Проблема**: Изменения не отображаются в реальном времени

**Решение**:
1. Проверьте включён ли Realtime для таблиц
2. Supabase → Database → Replication

---

## Полезные ресурсы

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
