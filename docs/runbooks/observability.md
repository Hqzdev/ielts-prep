# Логи и диагностика

HTTP-граница создаёт request ID, возвращает его в `X-Request-ID`, добавляет Server-Timing и записывает JSON-событие `http_request`. Поля: operation, method, status, success, durationMs, requestId, traceId. Operation — стабильное имя контракта, а не URL с query/идентификаторами.

AsyncLocalStorage передаёт контекст во вложенные операции. AI-адаптер записывает длительность и исход `ai.transcribe`, `ai.assess`, `ai.speak`, `ai.word`, `ai.conversation_feedback`, открытия и чтения потока. Окончание HTTP-запроса с NDJSON означает открытие потока; длительность всей генерации фиксируется отдельным AI-событием.

Очередь пишет `assessment_queue_dispatch` с claimed/dispatched/failed и `assessment_queue_reconcile` со stale/recovered. Ошибки запуска/восстановления содержат ID задания. Секреты, email, текст эссе, транскрипты, prompt и аудио не добавляются в эти логи.

При жалобе найдите request ID, затем operation/status и вложенные события с тем же trace ID. 401 — проверить сессию; 403 — membership/роль; 409 — ревизию или дедлайн; ошибки AI — соответствующую операцию и сохранённое состояние assessment/job. Нельзя повторять создание ресурса только из-за отсутствия ответа в браузере.

Для выбранного хостинга JSON-события нужно направить в централизованный сборщик: доля 5xx, p50/p95 HTTP/AI, возраст и ошибки очереди, число восстановленных jobs. Порог задержек устанавливается по реальной нагрузке. Экспортёр, dashboard, retention и alerts облака пока не подключены. Локальный traceId предназначен для корреляции и не заявляется распределённой OpenTelemetry-трассой.
