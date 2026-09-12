import express from 'express'
import { encode } from 'gpt-tokenizer';

import sessionManager from './session/session-manager';
import { ChatHistoryEntry, Chat, MAX_HISTORY_LENGTH, MAX_TOKENS } from './chatmanager/chat-manager';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const ChatHistoryRepository: Record<string, ChatHistoryEntry[]> = {};

app.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  if (ChatHistoryRepository[sessionId]) {
    console.log(`[GET] /session/${sessionId} - Session found.`);
    res.json({ sessionId, history: ChatHistoryRepository[sessionId] });
  } else {
    console.log(`[GET] /session/${sessionId} - Session not found.`);
    res.status(404).json({ error: 'Session not found' });
  }
});

app.post('/session', async (req, res) => {
  const sessionId = sessionManager.GenerateSessionId();

  ChatHistoryRepository[sessionId] = [];

  console.log(`[POST] /session - New session created with ID: ${sessionId}`);

  res.json({ sessionId });
});

app.delete('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  if (ChatHistoryRepository[sessionId]) {
    delete ChatHistoryRepository[sessionId];
    console.log(`[DELETE] /session/${sessionId} - Session deleted.`);
    res.json({ message: 'Session deleted' });
  } else {
    console.log(`[DELETE] /session/${sessionId} - Session not found.`);
    res.status(404).json({ error: 'Session not found' });
  }
});


app.post('/chat', async (req, res) => {
  const { message } = req.body;
  const sessionId = req.headers['session-id'] as string;

  // Implement message validation here. Externalize this once it grows bigger.
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (typeof ChatHistoryRepository[sessionId] === 'undefined') {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log(`[POST] /chat - ${sessionId} - Request Body:`, req.body);
  const messageTokens = encode(message).length;
  const inputTokens = ChatHistoryRepository[sessionId].reduce((acc, entry) => acc + encode(entry.entry.content).length, 0) + messageTokens;
  console.log(`[POST] /chat - ${sessionId} - Input Tokens:`, inputTokens);

  ChatHistoryRepository[sessionId].push({ sessionId, entry: { role: 'user', content: message } });

  const response = await Chat(sessionId, ChatHistoryRepository[sessionId]);

  // Limit the history to the maximum length
  if (ChatHistoryRepository[sessionId].length > MAX_HISTORY_LENGTH) {
    ChatHistoryRepository[sessionId].shift();
  }

  ChatHistoryRepository[sessionId].push({ sessionId, entry: { role: 'assistant', content: response.message.content } });

  const outputTokens = encode(response.message.content).length;

  const chatHistorySize = ChatHistoryRepository[sessionId].reduce((acc, entry) => acc + encode(entry.entry.content).length, 0);

  if (chatHistorySize > MAX_TOKENS) {
    console.warn(`[POST] /chat - ${sessionId} - Chat history size exceeds maximum tokens. Consider truncating history.`);
  }

  console.log(`[POST] /chat - ${sessionId} - Response:`, response);
  console.log(`[POST] /chat - ${sessionId} - Chat history size:`, chatHistorySize);
  console.log(`[POST] /chat - ${sessionId} - Output Tokens:`, outputTokens);
  console.log(`[POST] /chat - ${sessionId} - History length:`, ChatHistoryRepository[sessionId].length);

    res.json(response);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});