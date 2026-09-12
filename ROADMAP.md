# Basic Chatbot Development Roadmap & Learning Assessment

## 1. Current State & Assessment

You are currently at the **Multi-turn LLM Backend & Guardrailing** stage. You have advanced from simple one-shot LLM prompts to a structured, API-driven backend.

### What is Currently Implemented
- **Backend Framework**: Express 5 with TypeScript and `tsx` execution.
- **LLM Integration**: Local model execution via `ollama` SDK (`minicpm5-2b` with reasoning enabled via `think: 'medium'`).
- **System Prompting & Guardrails**: System instructions enforcing an executive assistant persona, jailbreak prevention, and strict domain boundaries (rejecting coding queries, asking clarifying questions).
- **Multi-Turn Context**: In-memory message history tracking previous user and assistant turns.
- **API Testing**: Bruno API collection (`chatbot-api/`) configured for testing `POST /chat`.

### Current Limitations
- **Global In-Memory State**: A single global `history` array is shared across all incoming requests; conversations will interleave if used by multiple clients or sessions.
- **Unbounded Context Growth**: History accumulates indefinitely without pruning or token management, which will eventually degrade performance or hit context limits.
- **Blocking Responses**: Non-streaming responses (`res.json`) increase perceived latency, especially when using models with reasoning steps.
- **No Input Validation**: Lack of checks for malformed payloads, empty prompts, or Ollama connection timeouts.
- **Headless Interface**: Interactions are currently restricted to HTTP clients like Bruno.

---

## 2. Phased Roadmap

### Phase 1: Backend Fundamentals & Session Isolation
- [ ] **Session & Conversation Management**:
  - Accept a `sessionId` (or `conversationId`) in request payloads.
  - Store conversation histories in an isolated map (`Map<string, ChatHistoryEntry[]>`) or local lightweight store (SQLite).
  - Add session lifecycle endpoints:
    - `POST /sessions` (create session)
    - `GET /chat/:sessionId` (retrieve session history)
    - `DELETE /chat/:sessionId` (reset/clear session history)
- [ ] **Streaming Responses (Server-Sent Events / SSE)**:
  - Migrate `ollama.chat` to streaming mode (`stream: true`).
  - Stream token chunks to the client over SSE (`text/event-stream`) for lower time-to-first-token (TTFT).

### Phase 2: Context Management & Robustness
- [ ] **Context Window & History Pruning**:
  - Implement a sliding window (e.g., retain the last $N$ turns) or token-based truncation while preserving the initial system prompt.
  - Optional: Explore conversation summarization when history exceeds a token threshold.
- [ ] **Schema Validation & Error Handling**:
  - Integrate request validation (e.g., Zod) for incoming messages and parameters.
  - Add graceful error handling and status reporting when the Ollama service is unreachable or errors out.

### Phase 3: Agentic Capabilities (Tool & Function Calling)
- [ ] **Tool Definition & Execution**:
  - Equip the assistant with deterministic tools (e.g., `get_current_time`, `calculate_date`, `create_task_reminder`).
  - Handle tool invocation loops: model requests tool call -> backend executes tool -> tool output returned to model -> final response generated.

### Phase 4: User Interfaces & Clients
- [ ] **Interactive CLI Client**:
  - Build a terminal-based interactive REPL using `meow` and Node's `readline` / `@clack/prompts` to chat directly in the terminal.
- [ ] **Frontend Web UI**:
  - Build a lightweight React + Vite chat interface with message bubbles, loading states, and live token streaming.

### Phase 5: Persistence & Production Readiness
- [ ] **Persistent Storage**:
  - Persist conversation logs and sessions to SQLite / PostgreSQL / Redis.
- [ ] **Configuration & Environment**:
  - Support environment-based configuration for model selection, temperature, and port settings via `.env`.
