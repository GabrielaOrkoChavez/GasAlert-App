# GasAlert-App

Este é o repositório destinado ao app de nosso sistema de aprendizagem 😃

No app haverá:
- sistema de login e cadastro
- sistema de cadastro de sensores de nível de gás
- CRUD do sensor
- edição de senha do usuário

O principal objetivo do app é o monitoramento de gás.

Baixe o arquivo e crie dentro da pasta GASALERT

.env - exemplo:
```bash
# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=senai
DB_NAME=teste
DB_PORT=5432
PORT=3000
````
Instalar dependências
```bash
npm init -y
npm install express pg dotenv bcryptjs
````

Crie no pgAdmin, etc, o banco de dados que está na pasta -> banco de dados 

Ele estará rodando na porta http://localhost:3000/
