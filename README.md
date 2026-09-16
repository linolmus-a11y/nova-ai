# NOVA 3.0
Безопасное ядро и интерфейс NOVA 3.0.

Запуск:
1. Node.js 20+
2. Скопировать `.env.example` в `.env`
3. Добавить `OPENAI_API_KEY`
4. `npm install`
5. `npm start`

Архитектурный принцип:
AI → Orchestrator → Tool Bus → Policy Engine → Permission → Sandbox → Tool → Verification.

Windows Agent, удалённое управление и выполнение кода здесь оставлены как безопасные точки расширения, а не как неконтролируемый доступ к ПК.
