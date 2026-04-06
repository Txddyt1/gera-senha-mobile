# Demo

Aplicacao Expo com gerador de senhas, historico local por usuario autenticado e API Node.js com MySQL para cadastro, login e logout com JWT.

## O que foi implementado

- `POST /signup` com validacao de email unico, regex de email, confirmacao de senha e hash com `bcryptjs`
- `POST /signin` com validacao de credenciais e retorno de token JWT
- `GET /signin` como rota publica informativa
- `GET /signout` como rota autenticada por token JWT
- Persistencia de sessao no cliente com `localStorage` na web e `AsyncStorage` no mobile
- Remocao do token ao fazer logout
- Docker Compose com frontend web, API e MySQL

## Estrutura principal

- `App.js`: fluxo entre login, cadastro, home e historico
- `src/screams/`: telas da aplicacao
- `src/services/`: API, persistencia da sessao e historico local
- `server/src/`: API Express com MySQL e JWT
- `server/database/init.sql`: criacao inicial da tabela `users`

## Rodando sem Docker

### Frontend

```bash
npm install
npm start
```

Comandos disponiveis:

```bash
npm run android
npm run ios
npm run web
npm run web:export
```

### Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

## Rodando com Docker

```bash
docker compose up --build
```

Servicos:

- Frontend web: `http://localhost:8080`
- API: `http://localhost:3001`
- MySQL: `localhost:3307`

## Rotas da API

### Publicas

- `GET /signin`
- `POST /signup`
- `POST /signin`

Exemplo de cadastro:

```json
{
  "name": "Maria",
  "email": "maria@email.com",
  "password": "12345678",
  "confirmPassword": "12345678"
}
```

Exemplo de login:

```json
{
  "email": "maria@email.com",
  "password": "12345678"
}
```

### Autenticada

- `GET /signout`

Envie o cabecalho:

```text
Authorization: Bearer <jwt>
```
