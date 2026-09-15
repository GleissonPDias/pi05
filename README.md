Estrutura de pastas:

my-react-app/
├── public/ # Arquivos estáticos públicos (favicon, index.html)
├── src/
│ ├── assets/ # Imagens, fontes e ícones globais
│ ├── components/ # Componentes reutilizáveis (botões, modais)
│ │ └── Button/
│ │ ├── index.jsx
│ │ └── styles.css
│ ├── contexts/ # Contextos do React para estado global
│ ├── hooks/ # Custom hooks reutilizáveis
│ ├── pages/ # Telas ou páginas principais da aplicação
│ ├── routes/ # Configuração de rotas (React Router)
│ ├── services/ # Comunicação com APIs (Axios, Fetch)
│ ├── utils/ # Funções utilitárias e formatadores
│ ├── App.jsx # Componente raiz
│ └── main.jsx # Ponto de entrada da aplicação
├── package.json
└── vite.config.js /
