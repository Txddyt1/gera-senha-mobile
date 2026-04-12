const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('./database');
const { authenticateToken } = require('./middleware/authMiddleware');
const {
  decryptPasswordValue,
  encryptPasswordValue,
} = require('./utils/passwordCrypto');

const app = express();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildCorsOptions() {
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origem nao permitida pelo CORS.'));
    },
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createJwtToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'development-secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function sanitizeSavedPassword(row) {
  return {
    id: row.id,
    appName: row.app_name,
    value: decryptPasswordValue({
      authTag: row.auth_tag,
      encryptedValue: row.encrypted_value,
      iv: row.iv,
    }),
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString(),
  };
}

app.use(cors(buildCorsOptions()));
app.use(express.json());

app.get('/health', (request, response) => {
  response.json({
    status: 'ok',
  });
});

app.get('/signin', (request, response) => {
  response.json({
    message: 'Rota publica disponivel. Utilize POST /signin com email e senha para autenticar.',
  });
});

app.post('/signup', async (request, response) => {
  const {
    confirmPassword,
    email,
    name,
    password,
  } = request.body || {};

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name || '').trim();

  if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
    return response.status(400).json({
      message: 'Nome, email, senha e confirmacao de senha sao obrigatorios.',
    });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return response.status(400).json({
      message: 'O email informado nao esta em um formato valido.',
    });
  }

  if (password !== confirmPassword) {
    return response.status(400).json({
      message: 'As senhas informadas precisam ser iguais.',
    });
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return response.status(409).json({
        message: 'Ja existe uma conta cadastrada para este email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [normalizedName, normalizedEmail, hashedPassword],
    );

    return response.status(201).json({
      message: 'Conta criada com sucesso.',
      user: {
        id: result.insertId,
        name: normalizedName,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Nao foi possivel concluir o cadastro.',
    });
  }
});

app.post('/signin', async (request, response) => {
  const { email, password } = request.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return response.status(400).json({
      message: 'Email e senha sao obrigatorios.',
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );

    if (rows.length === 0) {
      return response.status(401).json({
        message: 'Email ou senha incorretos.',
      });
    }

    const user = rows[0];
    const passwordIsValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsValid) {
      return response.status(401).json({
        message: 'Email ou senha incorretos.',
      });
    }

    const token = createJwtToken(user);

    return response.json({
      message: 'Login realizado com sucesso.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Nao foi possivel realizar o login.',
    });
  }
});

app.get('/session', authenticateToken, (request, response) => {
  response.json({
    message: 'Sessao validada com sucesso.',
    user: {
      id: request.user.sub,
      email: request.user.email,
      name: request.user.name,
    },
  });
});

app.get('/passwords', authenticateToken, async (request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, app_name, encrypted_value, iv, auth_tag, created_at
       FROM saved_passwords
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [request.user.sub],
    );

    return response.json({
      passwords: rows.map(sanitizeSavedPassword),
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Nao foi possivel listar as senhas salvas.',
    });
  }
});

app.post('/passwords', authenticateToken, async (request, response) => {
  const { appName, value } = request.body || {};
  const normalizedAppName = String(appName || '').trim();

  if (!normalizedAppName || !value) {
    return response.status(400).json({
      message: 'Nome do aplicativo e senha sao obrigatorios.',
    });
  }

  try {
    const encryptedPassword = encryptPasswordValue(value);
    const [result] = await pool.query(
      `INSERT INTO saved_passwords
        (user_id, app_name, encrypted_value, iv, auth_tag)
       VALUES (?, ?, ?, ?, ?)`,
      [
        request.user.sub,
        normalizedAppName,
        encryptedPassword.encryptedValue,
        encryptedPassword.iv,
        encryptedPassword.authTag,
      ],
    );

    const [rows] = await pool.query(
      `SELECT id, app_name, encrypted_value, iv, auth_tag, created_at
       FROM saved_passwords
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [result.insertId, request.user.sub],
    );

    return response.status(201).json({
      password: sanitizeSavedPassword(rows[0]),
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Nao foi possivel salvar a senha.',
    });
  }
});

app.delete('/passwords/:id', authenticateToken, async (request, response) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM saved_passwords WHERE id = ? AND user_id = ?',
      [request.params.id, request.user.sub],
    );

    if (result.affectedRows === 0) {
      return response.status(404).json({
        message: 'Senha salva nao encontrada.',
      });
    }

    return response.json({
      message: 'Senha removida com sucesso.',
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Nao foi possivel remover a senha.',
    });
  }
});

app.get('/signout', authenticateToken, (request, response) => {
  response.json({
    message: 'Logout autorizado. Remova o token JWT do cliente.',
    user: {
      id: request.user.sub,
      email: request.user.email,
      name: request.user.name,
    },
  });
});

app.use((error, request, response, next) => {
  if (error?.message === 'Origem nao permitida pelo CORS.') {
    return response.status(403).json({
      message: error.message,
    });
  }

  return next(error);
});

module.exports = app;
