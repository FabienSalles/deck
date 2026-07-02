## Architecture Overview

```mermaid
graph TD
    A[Client] --> B[API Gateway]
    B --> C[Service A]
    B --> D[Service B]
    C --> E[Database]
    D --> E
```

Note: Mermaid diagrams are rendered automatically by the mermaid plugin. No extra configuration needed.

---

## Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant G as API Gateway
    participant S as Service
    participant D as Database

    U->>G: HTTP Request
    G->>S: Forward Request
    S->>D: Query Data
    D-->>S: Result Set
    S-->>G: JSON Response
    G-->>U: HTTP Response
```

Note: Sequence diagrams are useful for illustrating communication between components. The mermaid plugin handles rendering and sizing automatically.
