-- 1. TABELA USERS (Para guardar dados do usuário e autenticação)
CREATE TABLE users (
    -- ID primário e auto-incrementado
    id SERIAL PRIMARY KEY,
    
    -- Nome de usuário
    username VARCHAR(100) UNIQUE NOT NULL,
    
    -- Email (Também deve ser único para login e contato)
    email VARCHAR(100) UNIQUE NOT NULL,
    
    -- Senha armazenada como hash (bcrypt)
    password_hash VARCHAR(255) NOT NULL,
    
    -- Data de criação do registro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA SENSORS (Para guardar os dados de cada sensor registrado)
CREATE TABLE sensors (
    -- ID primário e auto-incrementado
    id SERIAL PRIMARY KEY,
    
    -- Nome amigável do sensor (ex: "Jardim", "Cozinha")
    name VARCHAR(100) NOT NULL,
    
    -- ID único do sensor (usado para a API de status)
    sensor_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Chave estrangeira ligando o sensor ao usuário que o cadastrou
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status atual do nível (ex: Normal, Atenção, Alerta)
    status VARCHAR(50) NOT NULL,
    
    -- Nível atual de umidade/água/gás (o valor que está sendo simulado)
    current_level INTEGER,
    
    -- Data de criação do registro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- no .env mude as configurações do banco