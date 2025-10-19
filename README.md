# Anonimização de Dados

Web app didático. Lê planilhas, classifica campos sensíveis e anonimiza com regras claras. Processamento local no navegador.

## Contexto
Projeto didático da disciplina **Gestão de TI**. Objetivo: anonimizar dados a partir de uma amostra. Implementação como sistema web.

## Demo
https://borgescodes.github.io/anonimizador

## Funcionalidades
- Upload de **.xlsx**, **.xls** e **.csv** por drag and drop ou botão.
- **Normalização avançada** de texto (correções UTF-8/Latin-1, Unicode, remoção de controles).
- **Classificação** de colunas sensíveis e quase identificadoras.
- **Anonimização determinística** por tipo de dado.
- Filtro de linhas e **paginação**.
- Exportação para **CSV** e **XLSX**.
- Botão **“Carregar exemplo”** para testar sem arquivos.

## Regras de anonimização
- E-mail → `tok_xxxx@exemplo.com`.
- Telefone → `(**) *****-1234`.
- CPF/ID/RG → `tok_xxxx` (hash estável).
- Nome/Mãe → `REMOVIDO`.
- Endereço/Logradouro/Número/Complemento → `OCULTO`.
- Datas → `YYYY-MM`.
- Cidade → inicial + `***`.
- CEP → `12345-XXX`.

## Como usar
1. Abra a página do projeto.
2. Envie a planilha.
3. Marque as opções desejadas.
4. Baixe o resultado em CSV ou XLSX.

## Stack
- HTML + CSS + JavaScript.
- Tailwind via CDN.
- SheetJS `xlsx` no navegador.
- Sem back-end. 100% local.

## Estrutura
```
index.html
script.js
styles.css
assets/
  favicon.ico
```

## Rodando local
- Abra `index.html` no navegador ou use o Live Server do VS Code.
