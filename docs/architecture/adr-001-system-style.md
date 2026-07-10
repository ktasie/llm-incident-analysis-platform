# Proposed Architecture v1

```text
                                     ┌──────────────────┐
                                     │    Frontend      │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │   API Gateway    │
                                     └────────┬─────────┘
                                              │
               ┌──────────────┬───────────────┼───────────────┬──────────────┐
               ▼              ▼               ▼               ▼              ▼

        ┌──────────┐   ┌──────────┐    ┌──────────┐    ┌──────────┐
        │   Auth   │   │ Comment  │    │   Like   │    │  Photo   │
        │ Service  │   │ Service  │    │ Service  │    │ Service  │
        └────┬─────┘   └────┬─────┘    └────┬─────┘    └────┬─────┘
             │              │               │               │
             └──────────────┴───────────────┴───────────────┘
                                    │
                                    ▼

                         ┌────────────────────┐
                         │ Central Log Store  │
                         │ (Mongo Collection) │
                         └─────────┬──────────┘
                                   │
                                   ▼

                      ┌──────────────────────────┐
                      │ Incident Analysis Service│
                      └─────────┬────────────────┘
                                │
                     Retrieve Incident Logs
                                │
                                ▼

                        ┌────────────────┐
                        │  OpenAI API    │
                        └────────┬───────┘
                                 │
                                 ▼

                    ┌─────────────────────────┐
                    │ Structured RCA Response │
                    └─────────────────────────┘


```

# Additional Service

## Logging-service

- Receive logs
- Store logs
- Query logs
- Filter logs

## Incident Analysis Service

1. Receive incident request
2. Query logs
3. Build prompt
4. Call OpenAI
5. Return analysis

# Dashboard Architecture

Create a separate operational dashboard do not touch the existing frontend

## incident-dashboard

- View logs
- Search logs
- Select incident
- Run AI analysis
- Compare manual vs AI

> Add middleware to all existing service as Correlation IDs.
> Inside existing services inject fault injection layer

# Updated Repo structure

```text
microservices-platform/

frontend/

incident-dashboard/

gateway/

services/
├── auth-service
├── comment-service
├── like-service
├── photo-service
├── logging-service
└── incident-analysis-service

docker-compose.yml

```
