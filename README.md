# NOVA 5.1

NOVA 5.1 — архитектурно усиленная версия NOVA 4.0. В этой сборке реализован рабочий web-chat с отдельными сессиями, нормальной передачей истории, защитой от повторного запроса, понятной обработкой API-ошибок, Global STOP, Cloud AI и опциональным OpenAI-compatible Local AI.

## Запуск

Node.js 18+.

1. Скопируйте `.env.example` в `.env`.
2. Для облачного AI задайте `OPENAI_API_KEY` и при необходимости `OPENAI_MODEL`.
3. Для локального AI задайте `LOCAL_AI_URL` (например, OpenAI-compatible endpoint Ollama) и `LOCAL_AI_MODEL`.
4. `npm install`
5. `npm start`
6. Откройте `http://localhost:3000`.

## Важно

Интерфейс содержит разделы архитектуры NOVA 5.1, но реальное управление Windows, браузером, кодом, Sandbox, Web Search, RAG, Multi-Agent и другими инструментами требует отдельных backend/tool implementations и разрешений. Эта сборка не притворяется, что такие действия уже выполнены.

### Архитектура

Runtime → State → Orchestrator → Tool Bus → Policy Engine → Capabilities → Sandbox → Tool → Verifier.

Global STOP и Policy должны оставаться вне контроля модели.

### Исправление ошибки API credits

При `429` или отсутствии кредитов техническая ошибка не добавляется в историю чата, поэтому она не будет появляться бесконечной серией сообщений. Пользователь получает одно понятное уведомление. Для работы без облачных кредитов можно настроить локальный OpenAI-compatible provider через `LOCAL_AI_URL`.


## NOVA 5.1 — AI Reliability
- Cloud circuit breaker: после `NO_CREDITS` запросы к Cloud не повторяются до cooldown.
- Single-decision failover: при проблеме Cloud NOVA делает максимум один fallback-запрос к Local AI.
- Provider state: `AVAILABLE`, `NO_CREDITS`, `ERROR`, `OFFLINE`.
- Технические ошибки не записываются в историю чата.
- `GET /api/providers` показывает состояние провайдеров.
- `CLOUD_COOLDOWN_MS` задаёт интервал перед новой проверкой Cloud (по умолчанию 60 секунд).
