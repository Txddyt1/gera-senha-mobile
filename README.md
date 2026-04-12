# Demo

Aplicação full stack desenvolvida com Expo/React Native, Node.js e MySQL. O projeto combina autenticação básica com JWT, geração de senhas e histórico persistido no banco por usuário autenticado.

O app foi pensado para funcionar tanto na web quanto no mobile, com a mesma base de interface e uma API dedicada para cadastro, login e validação de sessão.

## Principais funcionalidades

- Cadastro de usuários com validação de e-mail único
- Validação de e-mail por regex no backend
- Confirmação de senha no cadastro
- Criptografia de senha com `bcryptjs` antes de salvar no banco
- Login com retorno de token JWT
- Persistência de sessão no cliente
- Logout com remoção da sessão local
- Geração de senhas aleatórias no app
- Histórico de senhas salvo no MySQL por usuário autenticado
- Criptografia reversível das senhas geradas antes de salvar no banco
- Execução da stack com Docker Compose

## Como a autenticação funciona

### Cadastro

Na rota `POST /signup`, a API valida:

- nome obrigatório
- e-mail obrigatório
- e-mail em formato válido
- existência prévia do e-mail no banco
- igualdade entre `password` e `confirmPassword`

Se tudo estiver correto, a senha é criptografada com `bcryptjs` e o usuário é salvo no MySQL.

### Login

Na rota `POST /signin`, a API:

- busca o usuário pelo e-mail
- compara a senha enviada com o hash salvo no banco
- gera um token JWT quando as credenciais são válidas

O cliente salva a sessão autenticada com:

- `localStorage` na versão web
- `AsyncStorage` na versão mobile

As senhas geradas são salvas no MySQL em uma tabela vinculada ao usuário autenticado. Antes de gravar, o backend criptografa o valor da senha com `crypto` usando AES-256-GCM. A chave é derivada de uma constante fixa no código para fins acadêmicos; em produção, a chave deve ficar fora do código.

### Validação de sessão

Quando o app inicia, o frontend tenta restaurar a sessão salva e chama a rota `GET /session` para confirmar se o token ainda é válido.

### Logout

O logout chama `GET /signout` com o token JWT e, em seguida, remove a sessão do cliente.

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
- Nginx para servir a versão web exportada

## Estrutura principal do projeto

- `App.js`: fluxo principal entre telas
- `src/context/`: controle global da autenticação
- `src/screams/`: telas da aplicação
- `src/services/`: consumo da API e persistência da sessão
- `src/utils/`: utilitários de senha e ajustes de layout
- `server/src/`: API Express
- `server/database/init.sql`: estrutura inicial da tabela de usuários
- `docker-compose.yml`: orquestração de banco, API e frontend web

## Como rodar o projeto

### Pré-requisitos

- Node.js instalado
- npm instalado
- Docker e Docker Compose, se quiser subir a stack completa com containers
- Android Studio ou Expo Go, se quiser testar a versão mobile

## Rodando sem Docker

### 1. Backend

Na pasta `server`:

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Por padrão, a API sobe em:

```text
http://localhost:3001
```

### 2. Frontend

Na raiz do projeto:

```bash
npm install
npm start
```

Comandos disponíveis:

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

### Observação para Android Emulator

No emulador Android, o app usa `http://10.0.2.2:3001` como fallback para acessar a API local do host.

## Rodando com Docker

Para subir banco, API e versão web:

```bash
docker compose up --build
```

Serviços expostos:

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

### Públicas

- `GET /signin`
- `POST /signup`
- `POST /signin`

### Autenticadas

- `GET /session`
- `GET /passwords`
- `POST /passwords`
- `DELETE /passwords/:id`
- `GET /signout`

Envie o cabeçalho:

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

- As credenciais de usuários ficam no MySQL
- O histórico de senhas geradas fica salvo no MySQL
- O histórico de senhas é separado por usuário autenticado
- As senhas geradas ficam criptografadas no banco e são descriptografadas pelo backend ao listar para o usuário dono
- O token JWT é validado no backend antes de liberar rotas protegidas
- O projeto possui versão web e mobile usando a mesma base de negócio

## Objetivo do projeto

Este repositório demonstra uma implementação simples e funcional de autenticação com JWT em uma aplicação Expo/React Native, integrando frontend, backend, banco relacional e Docker em uma única entrega.
