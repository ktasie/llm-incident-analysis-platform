timestamp
service
severity: info, warn, error
correlationId
event
message
metadata

Gateway

| Level | Event                    | When                                |
| ----- | ------------------------ | ----------------------------------- |
| INFO  | REQUEST_RECEIVED         | Every request enters the gateway    |
| INFO  | JWT_VALIDATED            | JWT successfully verified           |
| INFO  | REQUEST_ROUTED           | Request forwarded to a microservice |
| INFO  | RESPONSE_SENT            | Response returned to client         |
| WARN  | JWT_MISSING              | No Authorization header             |
| WARN  | JWT_INVALID              | Token verification failed           |
| ERROR | DOWNSTREAM_SERVICE_ERROR | Microservice returned an error      |
| ERROR | SERVICE_EXCEPTION        | Unexpected exception                |

Auth Service
| Level | Event |
| ----- | --------------------- |
| INFO | USER_AUTHENTICATED |
| INFO | JWT_ISSUED |
| WARN | USER_NOT_FOUND |
| WARN | INVALID_PASSWORD |
| ERROR | DATABASE_QUERY_FAILED |
| ERROR | JWT_GENERATION_FAILED |
| ERROR | SERVICE_EXCEPTION |

Photo Service
| Level | Event |
| ----- | ---------------------- |
| INFO | PHOTO_UPLOAD_STARTED |
| INFO | PHOTO_UPLOAD_COMPLETED |
| WARN | INVALID_FILE_TYPE |
| WARN | PHOTO_NOT_FOUND |
| ERROR | BLOB_UPLOAD_FAILED |
| ERROR | DATABASE_QUERY_FAILED |
| ERROR | OPERATION_TIMEOUT |
| ERROR | SERVICE_EXCEPTION |

Comment Service
| Level | Event |
| ----- | --------------------- |
| INFO | COMMENT_CREATED |
| INFO | COMMENTS_RETRIEVED |
| WARN | INVALID_COMMENT |
| ERROR | DATABASE_QUERY_FAILED |
| ERROR | COMMENT_SAVE_FAILED |
| ERROR | SERVICE_EXCEPTION |

Like Service
| Level | Event |
| ----- | --------------------- |
| INFO | LIKE_CREATED |
| INFO | LIKE_REMOVED |
| INFO | LIKES_RETRIEVED |
| WARN | ALREADY_LIKED |
| ERROR | DATABASE_QUERY_FAILED |
| ERROR | SERVICE_EXCEPTION |
