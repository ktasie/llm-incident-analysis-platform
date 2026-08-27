# Gold Standard Incident Corpus

| Incident Class                              | Example Scenario                       | Representative Events                                                                                               | Gold-Label Focus                                     |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Authentication Failure**                  | Invalid username during login          | `REQUEST_RECEIVED` → `REQUEST_ROUTED` → `USER_NOT_FOUND` → `DOWNSTREAM_SERVICE_ERROR` → `RESPONSE_SENT`             | **Auth Service**, invalid user credentials           |
| **Authentication Failure**                  | Incorrect password                     | `REQUEST_RECEIVED` → `REQUEST_ROUTED` → `INVALID_PASSWORD` → `DOWNSTREAM_SERVICE_ERROR` → `RESPONSE_SENT`           | **Auth Service**, password validation failure        |
| **Authentication Failure**                  | JWT generation failure                 | `REQUEST_RECEIVED` → `REQUEST_ROUTED` → `USER_AUTHENTICATED` → `JWT_GENERATION_FAILED` → `DOWNSTREAM_SERVICE_ERROR` | **Auth Service**, token generation failure           |
| **Database Connection Failure**             | Database unavailable during login      | `REQUEST_RECEIVED` → `REQUEST_ROUTED` → `DATABASE_QUERY_FAILED` → `DOWNSTREAM_SERVICE_ERROR`                        | **Auth Service**, database dependency failure        |
| **Database Connection Failure**             | Database failure during photo upload   | `PHOTO_UPLOAD_STARTED` → `DATABASE_QUERY_FAILED` → `DOWNSTREAM_SERVICE_ERROR`                                       | **Photo Service**, database dependency failure       |
| **Database Connection Failure**             | Database failure while saving comment  | `COMMENT_CREATED` → `DATABASE_QUERY_FAILED`                                                                         | **Comment Service**, database dependency failure     |
| **Database Connection Failure**             | Database failure while processing like | `LIKE_CREATED` → `DATABASE_QUERY_FAILED`                                                                            | **Like Service**, database dependency failure        |
| **Application Crash / Exception**           | Unexpected application exception       | `REQUEST_RECEIVED` → `REQUEST_ROUTED` → `SERVICE_EXCEPTION` → `DOWNSTREAM_SERVICE_ERROR`                            | Failing service and application exception            |
| **Application Crash / Exception**           | Photo upload crashes unexpectedly      | `PHOTO_UPLOAD_STARTED` → `SERVICE_EXCEPTION`                                                                        | **Photo Service**, application failure               |
| **Timeout Error**                           | Photo upload exceeds timeout threshold | `PHOTO_UPLOAD_STARTED` → `OPERATION_TIMEOUT` → `DOWNSTREAM_SERVICE_ERROR`                                           | **Photo Service**, timeout caused by slow dependency |
| **Storage Failure** _(optional extension)_  | Blob upload fails                      | `PHOTO_UPLOAD_STARTED` → `BLOB_UPLOAD_FAILED` → `DOWNSTREAM_SERVICE_ERROR`                                          | **Photo Service**, storage dependency failure        |
| **Input Validation** _(optional extension)_ | Unsupported file uploaded              | `PHOTO_UPLOAD_STARTED` → `INVALID_FILE_TYPE`                                                                        | **Photo Service**, invalid client request            |


# Gold Labels for each scenerio
For every incident, prepare hidden labels like thtis:

| Scenario | Incident Class              | Affected Service        | Root Cause             | Expected Confidence |
| -------- | --------------------------- | ----------------------- | ---------------------- | ------------------- |
| A1       | Authentication Failure      | Auth                    | User not found         | High                |
| A2       | Authentication Failure      | Auth                    | Invalid password       | High                |
| A3       | Authentication Failure      | Auth                    | JWT generation failure | High                |
| D1       | Database Connection Failure | Auth                    | Database query failure | High                |
| D2       | Database Connection Failure | Photo                   | Database query failure | High                |
| D3       | Database Connection Failure | Comment                 | Database query failure | High                |
| D4       | Database Connection Failure | Like                    | Database query failure | High                |
| C1       | Application Crash           | Gateway/Auth/Photo/etc. | Service exception      | Medium              |
| T1       | Timeout Error               | Photo                   | Operation timeout      | High                |
| S1       | Storage Failure             | Photo                   | Blob upload failure    | High                |
| V1       | Input Validation            | Photo                   | Invalid file type      | High                |

