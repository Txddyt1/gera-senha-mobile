# Demo

Aplicacao full stack desenvolvida com Expo/React Native, Node.js e MySQL. O projeto combina autenticacao basica com JWT, geracao de senhas e historico local por usuario autenticado.

O app foi pensado para funcionar tanto na web quanto no mobile, com a mesma base de interface e uma API dedicada para cadastro, login e validacao de sessao.

## Principais funcionalidades

- Cadastro de usuarios com validacao de email unico
- Validacao de email por regex no backend
- Confirmacao de senha no cadastro
- Criptografia de senha com `bcryptjs` antes de salvar no banco
- Login com retorno de token JWT
- Persistencia de sessao no cliente
- Logout com remocao da sessao local
- Geracao de senhas aleatorias no app
- Historico local de senhas separado por usuario autenticado
- Execucao da stack com Docker Compose

## Como a autenticacao funciona

### Cadastro

Na rota `POST /signup`, a API valida:

- nome obrigatorio
- email obrigatorio
- email em formato valido
- existencia previa do email no banco
- igualdade entre `password` e `confirmPassword`

Se tudo estiver correto, a senha e criptografada com `bcryptjs` e o usuario e salvo no MySQL.

### Login

Na rota `POST /signin`, a API:

- busca o usuario pelo email
- compara a senha enviada com o hash salvo no banco
- gera um token JWT quando as credenciais sao validas

O cliente salva a sessao autenticada com:

- `localStorage` na versao web
- `AsyncStorage` na versao mobile

### Validacao de sessao

Quando o app inicia, o frontend tenta restaurar a sessao salva e chama a rota `GET /session` para confirmar se o token ainda e valido.

### Logout

O logout chama `GET /signout` com o token JWT e, em seguida, remove a sessao do cliente.

## Stack utilizada

### Frontend

- Expo
- React Native
- React Hooks
- Context API
- AsyncStorage

### Backend

- Node.js
- Express
- MySQL
- mysql2
- bcryptjs
- jsonwebtoken

### Infraestrutura

- Docker
- Docker Compose
- Nginx para servir a versao web exportada

## Estrutura principal do projeto

- `App.js`: fluxo principal entre telas
- `src/context/`: controle global da autenticacao
- `src/screams/`: telas da aplicacao
- `src/services/`: consumo da API e persistencia local
- `src/utils/`: utilitarios de senha e ajustes de layout
- `server/src/`: API Express
- `server/database/init.sql`: estrutura inicial da tabela de usuarios
- `docker-compose.yml`: orquestracao de banco, API e frontend web

## Como rodar o projeto

### Pre-requisitos

- Node.js instalado
- npm instalado
- Docker e Docker Compose, se quiser subir a stack completa com containers
- Android Studio ou Expo Go, se quiser testar a versao mobile

## Rodando sem Docker

### 1. Backend

Na pasta `server`:

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Por padrao, a API sobe em:

```text
http://localhost:3001
```

### 2. Frontend

Na raiz do projeto:

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

Se quiser apontar o frontend para outra URL da API, crie um arquivo `.env` na raiz com base em `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Observacao para Android Emulator

No emulador Android, o app usa `http://10.0.2.2:3001` como fallback para acessar a API local do host.

## Rodando com Docker

Para subir banco, API e versao web:

```bash
docker compose up --build
```

Servicos expostos:

- Frontend web: `http://localhost:8080`
- API: `http://localhost:3001`
- MySQL: `localhost:3307`

Credenciais do banco no host:

```text
host: localhost
port: 3307
user: demo_user
password: demo_pass
database: demo_auth
```

## Rotas principais da API

### Publicas

- `GET /signin`
- `POST /signup`
- `POST /signin`

### Autenticadas

- `GET /session`
- `GET /signout`

Envie o cabecalho:

```text
Authorization: Bearer <jwt>
```

### Exemplo de cadastro

```json
{
  "name": "Maria",
  "email": "maria@email.com",
  "password": "12345678",
  "confirmPassword": "12345678"
}
```

### Exemplo de login

```json
{
  "email": "maria@email.com",
  "password": "12345678"
}
```

## Detalhes importantes

- As credenciais de usuarios ficam no MySQL
- O historico de senhas geradas fica salvo localmente no dispositivo
- O historico local e separado por usuario autenticado
- O token JWT e validado no backend antes de liberar rotas protegidas
- O projeto possui versao web e mobile usando a mesma base de negocio

## Objetivo do projeto

Este repositorio demonstra uma implementacao simples e funcional de autenticacao com JWT em uma aplicacao Expo/React Native, integrando frontend, backend, banco relacional e Docker em uma unica entrega.
