# Contribuindo para nogode

Obrigado por seu interesse em contribuir! Este guia vai ajudá-lo a começar.

## 🚀 Começando

### Pré-requisitos

- Node.js >= 16
- npm ou yarn

### Setup do Projeto

1. Clone o repositório:
```bash
git clone https://github.com/dilanl0pezn/nogode.git
cd nogode
```

2. Instale as dependências:
```bash
npm install
```

3. Compile o projeto:
```bash
npm run build
```

4. Execute os exemplos:
```bash
npm run dev
npm run dev:nest
```

## 📝 Estrutura do Projeto

```
go-errors-node/
├── src/
│   ├── core/           # Funções core e classes de erro
│   ├── nestjs/         # Integração com NestJS
│   ├── types/          # Definições de tipos TypeScript
│   └── utils/          # Utilitários (logger, etc)
├── examples/           # Exemplos de uso
├── dist/              # Build output (não commitado)
└── README.md
```

## 🔨 Desenvolvimento

### Compilar

```bash
npm run build
```

### Limpar build

```bash
npm run clean
```

## 📐 Padrões de Código

- Use TypeScript com strict mode
- Siga as convenções de nomenclatura:
  - PascalCase para classes e tipos
  - camelCase para funções e variáveis
  - UPPER_CASE para constantes
- Documente funções públicas com JSDoc
- Mantenha funções pequenas e focadas

## 🧪 Testes

Ao adicionar novas funcionalidades:

1. Adicione exemplos em `examples/`
2. Teste manualmente sua funcionalidade
3. Verifique que o build funciona: `npm run build`

## 📦 Submitting Changes

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -am 'Adiciona nova feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

### Mensagens de Commit

Use mensagens claras e descritivas:

- `feat: adiciona nova funcionalidade`
- `fix: corrige bug específico`
- `docs: atualiza documentação`
- `refactor: refatora código existente`
- `test: adiciona ou atualiza testes`

## 💡 Ideias para Contribuições

- Adicionar mais tipos de erro customizados
- Melhorar a documentação com mais exemplos
- Criar testes unitários
- Adicionar suporte para outros frameworks
- Melhorar tratamento de erros assíncronos
- Adicionar utilitários para retry e circuit breaker

## 🤝 Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 📞 Ajuda

Se tiver dúvidas:

- Abra uma issue no GitHub
- Entre em contato através de discussões

Obrigado por contribuir! 🎉
