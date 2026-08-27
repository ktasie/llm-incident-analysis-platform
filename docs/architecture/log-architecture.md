# Logging Service
This exists to support:
- Incident corpus creation
- Manual log inspection
- LLM-assisted incident analysis

Collects logs from gatewawy, auth, comment, like and photo

## Persists Logs

```json
{
  "_id": "...",
  "timestamp": "2026-07-10T18:32:00Z",
  "service": "photo-service",
  "severity": "ERROR",
  "correlationId": "abc123",
  "message": "Azure Blob upload failed",
  "metadata": {
    "userId": "12345",
    "photoId": "67890"
  }
}

```

## Query Logs
Allow dashboard adn incident analysis service to retrieve logs

## Internal Architecture

```text
logging-service

controllers/
├── logs.controller.js
├── incidents.controller.js

services/
├── log-ingestion.service.js
├── log-query.service.js
├── incident-detection.service.js

models/
├── log.model.js
├── incident.model.js

routes/
├── logs.routes.js
├── incidents.routes.js

```

### Endppoints

POST /logs

GET /logs

GET /logs/:correlationId

GET /logs/search

GET /incidents

GET /incidents/:incidentId

POST /incident-window