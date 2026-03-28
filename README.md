# Demo

Projeto em React Native com Expo para geracao e historico de senhas.

## Pre-requisitos

- Node.js instalado
- npm instalado
- Expo Go no celular ou emulador Android/iOS configurado

## Instalacao

Na raiz do projeto, execute:

```bash
npm install
```

## Como rodar

Para iniciar o servidor de desenvolvimento do Expo:

```bash
npm start
```

Depois disso, escolha uma das opcoes abaixo:

- `a` para abrir no Android
- `i` para abrir no iOS
- `w` para abrir na Web
- Ou escaneie o QR Code com o app Expo Go

## Comandos disponiveis

```bash
npm start
npm run android
npm run ios
npm run web
```

## Estrutura principal

- `App.js`: fluxo principal entre login, cadastro, home e historico
- `src/screams/`: telas da aplicacao
- `src/services/`: persistencia local e integracao com clipboard
- `src/utils/`: utilitarios, incluindo geracao de senha

## Observacoes

- O historico de senhas e salvo localmente no dispositivo com `AsyncStorage`
- Para rodar no navegador, use `npm run web`
