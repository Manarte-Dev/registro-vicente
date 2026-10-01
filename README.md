# Registro Igreja

Aplicação web para cadastrar membros da igreja com **foto** e **dados pessoais**, pensada para uso no **celular**.

Os dados ficam guardados **localmente no navegador** (IndexedDB) — não há servidor nem banco na nuvem.

## Funcionalidades

- Tirar foto ou escolher da galeria
- Cadastrar: nome, telefone, data de nascimento, endereço e observações
- Listar, buscar, editar e excluir membros
- Exportar e importar backup em JSON

## Como publicar no GitHub Pages

### 1. Criar o repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome sugerido: `registro-igreja`
3. Deixe **Public** e crie o repositório

### 2. Enviar os arquivos

No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Aplicação de registro de membros da igreja"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/registro-igreja.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu usuário do GitHub.

### 3. Ativar o GitHub Pages

1. No repositório, vá em **Settings → Pages**
2. Em **Source**, escolha **Deploy from a branch**
3. Branch: `main` | Pasta: `/ (root)`
4. Clique **Save**
5. Em alguns minutos o site estará em:

   `https://SEU_USUARIO.github.io/registro-igreja/`

### 4. Usar no celular

1. Abra o link no navegador do celular (Chrome ou Safari)
2. Opcional: **Adicionar à tela inicial** para abrir como app

## Backup dos dados

Como os dados ficam só no navegador:

- Use **Exportar backup** (menu ☰) com frequência
- Guarde o arquivo `.json` em local seguro (Google Drive, e-mail, etc.)
- Para restaurar, use **Importar backup**

> **Atenção:** limpar dados/cache do navegador apaga todos os cadastros se não houver backup.

## Testar localmente

Abra `index.html` diretamente no navegador para testes básicos. Para câmera e PWA completos, use um servidor local ou publique no GitHub Pages (HTTPS).

```bash
npx serve .
```

## Estrutura

```
├── index.html
├── css/styles.css
├── js/
│   ├── app.js
│   ├── db.js
│   └── export.js
├── manifest.json
├── sw.js
├── icon.svg
└── icon-192.png
```
