# tsgrep

**tsgrep** is a library that leverages JavaScript/TypeScript's Abstract Syntax Tree (AST) to perform precise and efficient searches within your codebase. Unlike traditional text-based search tools, tsgrep understands the structure of your code, enabling advanced queries that are both accurate and context-aware.

## 🚀 Features

- **AST-Based Search**: Utilizes JavaScript/TypeScript's AST for accurate code structure analysis.
- **Precise Matching**: Supports searching for specific nodes, functions, variables, and more.
- **Flexible Querying**: Allows for complex queries to match various code patterns.
- **Regular Expression Support**: Integrates regex for powerful pattern matching.
- **File and Directory Filtering**: Search within specific files or directories, or exclude certain paths.
- **Cross-Platform**: Works on Windows, macOS, and Linux.

## 📦 Installation

To install tsgrep:

```bash
npm i tsgrep
```
## 🏗️ Architecture

### High-level Architecture

```mermaid
flowchart LR
    subgraph A[API]
        S[search.ts]
    end

    subgraph Q[Query]
        QC[queryCache.ts]
        GR[grammar.peggy]
        UTL[utils.ts]
    end

    subgraph O[Orchestration]
        SM[searchManager.ts]
        WP[workerPool.ts]
    end

    subgraph W[Workers]
        W1[scan.worker.ts]
        MT[matcher.ts]
    end

    subgraph L[Libraries]
        FG[fast-glob]
        IG[ignore]
        BAB[Babel Parser]
    end

    S --> QC
    QC --> GR
    QC --> UTL
    S --> SM
    S --> FG
    S --> IG
    S --> WP
    WP --> W1
    W1 --> MT
    MT --> BAB
```

### Search Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as search.ts
    participant Q as queryCache
    participant M as searchManager
    participant P as workerPool
    participant W as scan.worker
    participant T as matcher

    U->>S: search(expression, options)
    S->>Q: parseQuery(expression)
    Q-->>S: QueryNode
    S->>M: startProgressReporting()
    S->>S: findFiles()
    alt No files found
        S-->>U: []
    else Files found
        S->>P: processBatches(files)
        par Each batch
            P->>W: postMessage(batch)
            W->>T: scanForMatches()
            T-->>W: results
            W-->>P: batch results
            P->>M: onBatchResults()
        end
        S->>M: flushProgress()
        S->>S: dedupeResults()
        S-->>U: final results
    end
```

### Worker-side Scanning Algorithm

```mermaid
flowchart TD
    A[Receive files & query] --> B{Next file?}
    B -->|Yes| C[Read file source]
    C --> D[Parse with Babel]
    D --> E[Traverse AST]
    E --> F{Match node?}
    F -->|Yes| G[Add to results]
    F -->|No| E
    E -->|Done| H[Return results]
    B -->|No| H
    D -->|Error| I[Skip file]
```

### Progress Reporting

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Reporting : start
    state Reporting {
        [*] --> Waiting
        Waiting --> Processing : batch received
        Processing --> Waiting : results stored
        Waiting --> Flushing : interval reached
        Flushing --> Waiting : progress emitted
    }
    Reporting --> Idle : stop
```

### Batching and Concurrency

```mermaid
flowchart LR
    A[Files] --> B[Split into batches]
    B --> C[Worker 1]
    B --> D[Worker 2]
    B --> E[Worker N]
    C --> F[Results]
    D --> F
    E --> F
```

### Core Data Types

```mermaid
classDiagram
    class QueryNode {
        +type: String
        +children: Array
        +value: Any
    }
    
    class SearchResult {
        +file: String
        +line: Number
        +content: String
    }
    
    class SearchOptions {
        +ignore: Array
        +gitignore: Boolean
        +batchSize: Number
    }
    
    QueryNode --> SearchResult
    SearchOptions --> SearchResult
```

## 🧪 Usage

### Using it as an API

```javascript
import { search } from 'tsgrep';
// use search(<Expression>, <Directory>, <Options>) to get matches
```

### Search with AST Queries

For more advanced searches, use AST queries to match specific patterns:

```bash
tsgrep "FunctionDeclaration[id=Identifier[name=\"myFunction\"]]"
```

### [Grammar Usage Guide](GRAMMAR_USAGE_GUIDE.md)