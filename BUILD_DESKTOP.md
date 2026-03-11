# Ruído Rosa — Build Desktop (.exe)

## Pré-requisitos

- Node.js 18+ (https://nodejs.org)
- Git

## Passos

### 1. Clone o repositório

```bash
git clone <URL_DO_REPO>
cd <PASTA_DO_PROJETO>
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Instale o Electron e Electron Builder (dev)

```bash
npm install --save-dev electron electron-builder
```

### 4. Build do frontend (Vite)

```bash
npm run build
```

Isso gera a pasta `dist/` com o app compilado.

### 5. Gere o .exe portátil

```bash
npx electron-builder --win portable --config electron-builder.yml
```

O executável será criado em `release/`.

### 6. Estrutura final

```
/release/
  RuidoRosa-1.0.0-Portable.exe   ← executável portátil
```

Copie para um pendrive e rode em qualquer Windows 64-bit.

## Atalhos

- **F11** → Fullscreen
- O app abre direto, sem navegador

## Notas

- Todos os dados ficam no IndexedDB do Electron (local, offline).
- A pasta `data/` pode ser usada para arquivos extras no futuro.
- O app funciona 100% offline — nenhuma conexão com internet necessária.
- Para modo desenvolvimento com Electron:
  ```bash
  npm run build && npx electron electron/main.js
  ```
