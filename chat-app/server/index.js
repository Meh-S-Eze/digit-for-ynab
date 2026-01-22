
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { supabase } from './db.js';
import { clientManager } from './clientManager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize dependencies
// clientManager is imported directly
// supabase is initialized on import

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Static Files (Production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, '../client/dist')));

// --- OAuth & Auth Routes ---

// 1. Redirect to YNAB
// 1. Email/Password Registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const { data: existing, error: searchError } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email);

    if (searchError) throw searchError;
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const { data: newUser, error: createError } = await supabase
      .from('auth_users')
      .insert([{
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) throw createError;

    // Create Session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        token: sessionId,
        user_id: newUser.id,
        expires_at: sessionExpiresAt.toISOString()
      }]);

    if (sessionError) throw sessionError;

    // Set Cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiresAt
    });

    res.json({ authenticated: true, user: { email: newUser.email, id: newUser.id } });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// 2. Email/Password Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find User
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create Session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        token: sessionId,
        user_id: user.id,
        expires_at: sessionExpiresAt.toISOString()
      }]);

    if (sessionError) throw sessionError;

    // Set Cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionExpiresAt
    });

    res.json({ authenticated: true, user: { email: user.email, id: user.id } });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. Start YNAB OAuth Flow (Connect)
app.get('/api/ynab/connect', (req, res) => {
  // Ensure user is authenticated first (via cookie)
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).send('Please login first');
  }

  const clientId = process.env.YNAB_CLIENT_ID;
  const redirectUri = process.env.YNAB_REDIRECT_URI;
  const state = crypto.randomBytes(16).toString('hex');
  // TODO: Store state with session to verify on callback for security

  const url = `https://app.ynab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
  res.redirect(url);
});

// 4. Redirect to YNAB (Legacy/Direct - deprecate or redirect to login?)
// Keeping it but it might be confusing if used directly without session.
// For now, let's assume /api/ynab/connect is the way. 
// If we receive a request here and are not logged in, we should probably fail or ask to login.
// But the prompt says "PRESERVE: Existing YNAB token logic". 
// However, the Goal is "YNAB connection is no longer required for account creation".
// So I'll remove the old direct /api/auth/ynab route to avoid confusion, 
// as the user requested "/api/ynab/connect - starts YNAB OAuth (user already authenticated)".

// 5. Callback
app.get('/api/auth/ynab/callback', async (req, res) => {
  const { code } = req.query;
  const sessionId = req.cookies.sessionId; // Start of session check

  if (!code) {
    return res.status(400).send('No code provided');
  }

  // We Need a Session to link YNAB to
  if (!sessionId) {
    return res.status(401).send('Authentication required to link YNAB account. Please login first.');
  }

  try {
    // Exchange Code for Token
    const tokenResponse = await axios.post('https://app.ynab.com/oauth/token', {
      client_id: process.env.YNAB_CLIENT_ID,
      client_secret: process.env.YNAB_CLIENT_SECRET,
      redirect_uri: process.env.YNAB_REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code.toString()
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Get User Info from YNAB
    const userResponse = await axios.get('https://api.ynab.com/v1/user', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const ynabId = userResponse.data.data.user.id;

    // DB Operations
    // Verify Session & User
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return res.status(401).send('Invalid or expired session.');
    }

    const userId = session.user_id;

    // 2. Store YNAB Connection (Upsert)
    const { error: upsertError } = await supabase
      .from('ynab_connections')
      .upsert({
        user_id: userId,
        ynab_id: ynabId,
        access_token,
        refresh_token,
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'user_id' }); // Ensure one connection per user

    if (upsertError) throw upsertError;

    // Redirect to App Settings or Chat
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/app/chat`); // Go to chat after linking

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.status(500).send(`Authentication Failed: ${error.message}`);
  }
});

// 3. Check Session / Me
// 3. Check Session / Me
app.get('/api/auth/me', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ authenticated: false });

  try {
    // Verify Session & Get User
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        user_id,
        auth_users (
          id,
          email
        )
      `)
      .eq('token', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session || !session.auth_users) {
      res.clearCookie('sessionId');
      return res.status(401).json({ authenticated: false });
    }

    const user = session.auth_users;

    // Check for YNAB connection
    const { data: connection, error: connError } = await supabase
      .from('ynab_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    // connection might be null if not found, which is fine
    const hasYnab = !!connection;
    const ynabToken = connection ? connection.access_token : null;

    return res.json({
      authenticated: true,
      user: { email: user.email, id: user.id },
      hasYnab,
      ynabToken
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('sessionId');
  res.json({ success: true });
});


// --- Existing Routes ---

// Init OpenRouter (Stateless per request now)
const initOpenRouter = (apiKey) => {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });
};

// GET /api/models
app.post('/api/models', async (req, res) => {
  const openRouterKey = req.headers['x-openrouter-key'];

  if (!openRouterKey) {
    return res.status(400).json({ error: 'Missing x-openrouter-key header' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openRouterKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Sort explicitly by name or id
    const sortedModels = (data.data || []).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ data: sortedModels });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  // Check for Session Cookie first
  const sessionId = req.cookies.sessionId;
  let ynabToken = req.headers['x-ynab-token'];

  if (sessionId && !ynabToken) {
    // Resolve session to token
    try {
      // 1. Get User from Session
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', sessionId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (session) {
        const userId = session.user_id;
        // 2. Get YNAB Token for User
        const { data: connection } = await supabase
          .from('ynab_connections')
          .select('access_token')
          .eq('user_id', userId)
          .single();

        if (connection) {
          ynabToken = connection.access_token;
        }
      }
    } catch (err) {
      console.error("Session resolution failed", err);
    }
  }

  if (!ynabToken) {
    return res.status(401).json({ error: "Unauthorized. Please login with YNAB or provide a token." });
  }

  try {
    const mcpClient = await clientManager.getClient(ynabToken);
    const result = await mcpClient.listTools();
    // Note: listTools doesn't give budgets. 
    // We need to call the tool 'list_budgets' OR access YNAB API directly here.
    // Accessing YNAB API directly is easier/faster for just a list.

    const response = await fetch('https://api.ynab.com/v1/budgets', {
      headers: { 'Authorization': `Bearer ${ynabToken}` }
    });
    const data = await response.json();
    res.json(data.data.budgets);

  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const openRouterKey = req.headers['x-openrouter-key'];
  let ynabToken = req.headers['x-ynab-token'];
  const budgetId = req.headers['x-ynab-budget-id']; // Optional specific budget
  const model = req.headers['x-openrouter-model'] || 'deepseek/deepseek-chat';
  const sessionId = req.cookies.sessionId;

  // --- Session Auth Logic ---
  if (sessionId && (!ynabToken || ynabToken === 'undefined')) {
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', sessionId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (session) {
        const userId = session.user_id;
        const { data: connection } = await supabase
          .from('ynab_connections')
          .select('access_token')
          .eq('user_id', userId)
          .single();

        if (connection) {
          ynabToken = connection.access_token;
        }
      }
    } catch (err) {
      console.error("Session resolution failed", err);
    }
  }
  // --------------------------

  if (!openRouterKey || !ynabToken) {
    return res.status(401).json({ error: 'Missing API keys or Auth Session' });
  }

  try {
    // 1. Get cached/new MCP client for this user
    const mcpClient = await clientManager.getClient(ynabToken);

    // 2. Get available tools
    const tools = await mcpClient.listTools();

    // 3. Initialize OpenRouter
    const openai = initOpenRouter(openRouterKey);

    // 4. Initial Chat Completion
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      tools: tools.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }))
    });

    const message = completion.choices[0].message;

    // 5. Tool execution capability
    if (message.tool_calls) {
      const toolResults = [];
      for (const toolCall of message.tool_calls) {
        // If budgetId is set, inject it into tool arguments if missing?
        // Or expect the LLM to know? 
        // Better: The MCP server already has the token. The budgetId might need to be passed in args.
        // We'll rely on the LLM to ask for it or use "last used" if that logic existed.
        // For now, raw execution.

        // Inject budget_id if the tool accepts it and it was provided in headers?
        // This depends on the specific MCP tool definitions. 
        // Let's assume standard execution for now. 

        const args = JSON.parse(toolCall.function.arguments);
        // Simple Injection hack: if tool has 'budget_id' param and args is missing it, add it
        if (budgetId && !args.budget_id) {
          args.budget_id = budgetId;
        }

        const result = await mcpClient.callTool(toolCall.function.name, args);
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // 6. Follow-up completion with tool results
      const secondResponse = await openai.chat.completions.create({
        model: model,
        messages: [...messages, message, ...toolResults]
      });

      return res.json({ message: secondResponse.choices[0].message });
    }

    res.json({ message });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

// Start Server
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
