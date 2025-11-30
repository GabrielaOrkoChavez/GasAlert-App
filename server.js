// server.js

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Pool de Conexão com o PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middlewares
app.use(express.json()); 
app.use(express.static('public')); 

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota de CADASTRO (POST /register)
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const checkExisting = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2', 
            [username, email]
        );

        if (checkExisting.rows.length > 0) {
            const existing = checkExisting.rows[0];
            if (existing.username === username) {
                return res.status(409).json({ message: 'Nome de usuário já está em uso.' });
            }
            if (existing.email === email) {
                return res.status(409).json({ message: 'Email já está em uso.' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)', 
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota de LOGIN (POST /login)
app.post('/login', async (req, res) => {
    const { username: loginIdentifier, password } = req.body; 

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, username, password_hash FROM users WHERE username = $1 OR email = $1', 
            [loginIdentifier]
        );
         
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        res.status(200).json({ 
            message: `Bem-vindo, ${user.username}! Login realizado com sucesso.`,
            user_id: user.id 
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- ROTAS DE PERFIL E SENHA (NOVAS) ---

// Rota para OBTER os dados básicos do usuário (Nome e Email)
// GET /user/:user_id
app.get('/user/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query('SELECT username, email FROM users WHERE id = $1', [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para ALTERAR SENHA
// PUT /user/:user_id/password
app.put('/user/:user_id/password', async (req, res) => {
    const { user_id } = req.params;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
    }

    try {
        // 1. Busca a senha hash atual
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const userHash = result.rows[0].password_hash;

        // 2. Compara a senha atual fornecida com o hash no DB
        const isMatch = await bcrypt.compare(current_password, userHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // 3. Gera novo hash e atualiza a senha
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newHashedPassword, user_id]
        );

        res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao alterar senha.' });
    }
});


// --- ROTAS DE SENSORES ---

// Rota de CADASTRO de SENSORES (POST /sensors)
app.post('/sensors', async (req, res) => {
    const { name, sensor_id, user_id } = req.body; 

    if (!name || !sensor_id || !user_id) {
        return res.status(400).json({ message: 'Dados incompletos (Nome, ID do sensor e ID do usuário são obrigatórios).' });
    }

    try {
        const checkSensor = await pool.query('SELECT * FROM sensors WHERE sensor_id = $1', [sensor_id]);
        if (checkSensor.rows.length > 0) {
            return res.status(409).json({ message: 'ID de Sensor já está em uso.' });
        }

        const initialLevel = Math.floor(Math.random() * (300 - 120 + 1)) + 120; 

        await pool.query(
            'INSERT INTO sensors (name, sensor_id, user_id, status, current_level) VALUES ($1, $2, $3, $4, $5)', 
            [name, sensor_id, user_id, 'Normal', initialLevel] 
        );

        res.status(201).json({ message: 'Sensor cadastrado com sucesso!', name, sensor_id });
    } catch (error) {
        console.error('Erro ao cadastrar sensor:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar sensor.' });
    }
});

// Rota para LISTAR SENSORES (GET /sensors)
app.get('/sensors', async (req, res) => {
    const { user_id } = req.query; 

    if (!user_id) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório para listar sensores.' });
     }
     
    try {
        const result = await pool.query(
            'SELECT name, sensor_id, created_at, status, current_level FROM sensors WHERE user_id = $1 ORDER BY created_at DESC', 
            [user_id]
        );
     
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar sensores:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar sensores.' });
    }
});

// Rota para SIMULAR STATUS e NÍVEL (GET /sensor-status/:sensor_id)
app.get('/sensor-status/:sensor_id', async (req, res) => {
    const { sensor_id } = req.params;

    const minLevel = 100; 
    const maxLevel = 800; 
    const levelChange = Math.floor(Math.random() * 40) - 20; 
    let lastLevel = 0;
    let sensorName = 'Sensor Desconhecido';

    try {
        const lastLevelResult = await pool.query('SELECT current_level, name FROM sensors WHERE sensor_id = $1', [sensor_id]);
        if (lastLevelResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sensor não encontrado.' });
        }
     
        lastLevel = lastLevelResult.rows[0].current_level;
        sensorName = lastLevelResult.rows[0].name;

        if (lastLevel === 0 || lastLevel === null) {
             lastLevel = Math.floor(Math.random() * (300 - 120 + 1)) + 120; 
        }

        let level = Math.max(minLevel, Math.min(maxLevel, lastLevel + levelChange));


        let status = 'Inativo'; 
        let statusIcon = '⚪'; 

        if (level >= 120 && level <= 300) {
            status = 'Normal';
            statusIcon = '🟢'; 
        } else if (level > 300 && level < 700) {
            status = 'Atenção';
            statusIcon = '⚠️';
        } else if (level >= 700) {
            status = 'Alerta: Vazamento!';
            statusIcon = '🚨';
        } else if (level < 120) { 
            status = 'Baixo Nível';
            statusIcon = '📉';
        }

        await pool.query(
            'UPDATE sensors SET status = $1, current_level = $2 WHERE sensor_id = $3',
            [status, level, sensor_id]
        );

        res.status(200).json({
            sensor_id,
            name: sensorName, 
            status,
            level,
            statusIcon,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao simular status do sensor:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao simular status.' });
    }
});


// Rota para EDITAR um sensor (PUT /sensors/:sensor_id)
app.put('/sensors/:sensor_id', async (req, res) => {
    const { sensor_id: old_sensor_id } = req.params;
    const { name, new_sensor_id } = req.body; 

    if (!name || !new_sensor_id) {
        return res.status(400).json({ message: 'Nome e Novo ID do sensor são obrigatórios.' });
    }

    try {
        if (old_sensor_id !== new_sensor_id) {
            const checkExisting = await pool.query('SELECT sensor_id FROM sensors WHERE sensor_id = $1', [new_sensor_id]);
            if (checkExisting.rows.length > 0) {
                return res.status(409).json({ message: 'O novo ID do sensor já está sendo usado.' });
            }
        }

        const result = await pool.query(
            'UPDATE sensors SET name = $1, sensor_id = $2 WHERE sensor_id = $3 RETURNING *',
            [name, new_sensor_id, old_sensor_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Sensor não encontrado.' });
        }

        res.status(200).json({ message: 'Sensor atualizado com sucesso!', sensor: result.rows[0] });

    } catch (error) {
        console.error('Erro ao editar sensor:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao editar sensor.' });
    }
});


// Rota para EXCLUIR um sensor (DELETE /sensors/:sensor_id)
app.delete('/sensors/:sensor_id', async (req, res) => {
    const { sensor_id } = req.params;

    try {
        const result = await pool.query('DELETE FROM sensors WHERE sensor_id = $1', [sensor_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Sensor não encontrado.' });
        }

        res.status(200).json({ message: `Sensor ID ${sensor_id} excluído com sucesso.` });

    } catch (error) {
        console.error('Erro ao excluir sensor:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir sensor.' });
    }
});


// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});