// Este arquivo é referenciado por register_sensor.html, list_sensors_data.html e sensor_detail.html

let currentUserId = null;

function showDashboardMessage(type, text) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.className = '';
        messageElement.textContent = text;
        messageElement.classList.add(type);
    }
}

// 1. Função para carregar e exibir a lista de sensores
async function fetchSensors() {
    const sensorsDisplay = document.getElementById('sensorsDisplay');
    if (!sensorsDisplay) return; 

    sensorsDisplay.innerHTML = '<div class="loading-message">Carregando seus sensores...</div>';

    if (!currentUserId) {
        sensorsDisplay.innerHTML = '<div class="no-sensors"><h2>ID de usuário não encontrado.</h2><p>Por favor, faça login novamente.</p></div>';
        return;
    }

    try {
        const response = await fetch(`/sensors?user_id=${currentUserId}`); 
        const sensors = await response.json();

        sensorsDisplay.innerHTML = ''; 

        if (sensors.length === 0) {
            // Mensagem de "Não há sensores conectados"
            sensorsDisplay.innerHTML = `
                <div class="no-sensors">
                    <h2>Não há sensores conectados</h2>
                    <button onclick="navigate('register_sensor')">Conectar novo sensor</button>
                </div>
            `;
            return;
        }

        const sensorsGrid = document.createElement('div');
        sensorsGrid.className = 'sensors-grid';

        sensors.forEach(sensor => {
            const card = document.createElement('div');
            card.className = 'sensor-card';
            
            let statusTextClass = '';
            let indicatorIcon = '';

            // Sanitiza o status para usar como classe CSS 
            const statusSanitized = sensor.status
                .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
                .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();

            switch (sensor.status) {
                case 'Normal':
                    indicatorIcon = '🟢';
                    break;
                case 'Atenção':
                    indicatorIcon = '🟠'; 
                    break;
                case 'Alerta: Vazamento!':
                    indicatorIcon = '🚨'; 
                    break;
                case 'Baixo Nível':
                    indicatorIcon = '🔵';
                    break;
                default: 
                    indicatorIcon = '⚪';
                    break;
            }
            
            const indicatorClass = `status-${statusSanitized}`;
            statusTextClass = `status-${statusSanitized}-text`;

            card.innerHTML = `
                <div class="sensor-info">
                    <h3>${sensor.name}</h3>
                    <p>ID: ${sensor.sensor_id}</p>
                    <p>Nível: ${sensor.current_level} ppm</p>
                    <p>Status: <span class="status-text ${statusTextClass}">${sensor.status}</span></p>
                </div>
                <div class="sensor-status-indicator ${indicatorClass}">
                    ${indicatorIcon}
                </div>
            `;
            
            card.addEventListener('click', () => {
                navigate('sensor_detail', sensor.sensor_id);
            });

            sensorsGrid.appendChild(card);
        });
        sensorsDisplay.appendChild(sensorsGrid);

    } catch (error) {
        console.error('Erro ao buscar sensores:', error);
        showDashboardMessage('error', 'Erro ao carregar os dados dos sensores.');
        sensorsDisplay.innerHTML = '<div class="no-sensors"><h2>Erro ao carregar os dados.</h2><p>Tente novamente mais tarde.</p></div>';
    }
}

// 2. Função para cadastrar um novo sensor
async function registerSensor(event) {
    event.preventDefault();

    if (!currentUserId) {
        showDashboardMessage('error', 'Erro: ID de usuário não encontrado. Faça login novamente.');
        return;
    }

    const name = document.getElementById('sensor_name').value;
    const sensor_id = document.getElementById('sensor_id_input').value;

    if (!name || !sensor_id) {
        showDashboardMessage('error', 'Por favor, preencha todos os campos do sensor.');
        return;
    }
    
    const bodyData = { name, sensor_id, user_id: currentUserId };

    try {
        const response = await fetch('/sensors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (response.ok) {
            showDashboardMessage('success', data.message);
            document.getElementById('sensorForm').reset(); 
        } else {
            showDashboardMessage('error', data.message || 'Falha ao cadastrar sensor.');
        }

    } catch (error) {
        console.error('Erro ao enviar cadastro de sensor:', error);
        showDashboardMessage('error', 'Erro de rede ao tentar cadastrar o sensor.');
    }
}

// 3. Função: Carrega detalhes e simula o nível do sensor
async function fetchSensorDetail(sensorId) {
    const sensorNameTitle = document.getElementById('sensorNameTitle');
    const gaugeValue = document.getElementById('gaugeValue');
    const gaugeStatusText = document.getElementById('gaugeStatusText');
    const gaugeArrow = document.getElementById('gaugeArrow');

    const sensorIdDisplay = document.getElementById('sensorIdDisplay');
    const detailedStatus = document.getElementById('detailedStatus');
    const detailedStatusIcon = document.getElementById('detailedStatusIcon');
    const detailedLevel = document.getElementById('detailedLevel');
    const lastUpdateTimestamp = document.getElementById('lastUpdateTimestamp');

    // Estado de carregamento inicial
    if (gaugeValue) gaugeValue.textContent = '---';
    if (gaugeStatusText) gaugeStatusText.textContent = 'Carregando...';
    if (gaugeArrow) gaugeArrow.style.transform = 'rotate(-135deg) translate(0,0)'; 

    try {
        const response = await fetch(`/sensor-status/${sensorId}`);
        const data = await response.json();

        if (response.ok) {
            const level = data.level;
            
            // Sanitiza a string de status removendo acentos e deixando minúscula
            const statusSanitized = data.status
                .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
                .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();

            // Usa o nome real do sensor retornado pelo servidor
            const sensorName = data.name || data.sensor_id; 
            if (sensorNameTitle) sensorNameTitle.textContent = `Detalhes do Sensor: ${sensorName}`;

            // Atualiza os elementos do medidor (gauge)
            if (gaugeValue) gaugeValue.textContent = level;
            if (gaugeStatusText) {
                // Lógica para o texto abaixo do valor no gauge
                if (data.status.includes('Alerta')) {
                    gaugeStatusText.textContent = 'de vazamento'; 
                    gaugeValue.style.color = '#dc3545'; // Valor em vermelho
                } else if (data.status === 'Normal') {
                    gaugeStatusText.textContent = 'Normal';
                    gaugeValue.style.color = '#28a745'; // Valor em verde
                } else {
                    gaugeStatusText.textContent = data.status; 
                    gaugeValue.style.color = 'white'; // Cor padrão (para baixo nível e atenção)
                }
            }

            // Atualiza a posição da agulha do medidor
            const maxGaugeLevel = 800; 
            const maxRotation = 270; 
            const rotationAngle = (Math.min(level, maxGaugeLevel) / maxGaugeLevel) * maxRotation - 135; 
            if (gaugeArrow) gaugeArrow.style.transform = `rotate(${rotationAngle}deg)`;

            // Atualiza os outros blocos de informação
            if (sensorIdDisplay) sensorIdDisplay.textContent = data.sensor_id;
            if (detailedStatus) {
                detailedStatus.textContent = data.status;
                // Aplica a classe sanitizada para estilização
                detailedStatus.className = `status-text status-${statusSanitized}-text`; 
            }
            if (detailedStatusIcon) detailedStatusIcon.textContent = data.statusIcon;
            if (detailedLevel) detailedLevel.textContent = level;
            if (lastUpdateTimestamp) lastUpdateTimestamp.textContent = new Date(data.timestamp).toLocaleTimeString('pt-BR');

        } else {
            // Lógica de erro 
            if (gaugeValue) gaugeValue.textContent = 'Erro';
            if (gaugeStatusText) gaugeStatusText.textContent = data.message || 'Falha ao carregar';
            if (sensorNameTitle) sensorNameTitle.textContent = `Erro no Sensor: ${sensorId}`;
            console.error('Erro ao carregar detalhes do sensor:', data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao buscar detalhes do sensor:', error);
        if (gaugeValue) gaugeValue.textContent = 'Erro';
        if (gaugeStatusText) gaugeStatusText.textContent = 'Erro de rede';
        if (sensorNameTitle) sensorNameTitle.textContent = `Erro de Conexão`;
    }
}


// 4. Função para EXCLUIR um sensor
async function deleteSensor(sensorId) {
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o sensor ID: ${sensorId}?`)) {
        return;
    }

    try {
        const response = await fetch(`/sensors/${sensorId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            // Redireciona de volta para a lista de sensores após a exclusão
            navigate('list_sensors_data'); 
        } else {
            alert(data.message || 'Falha ao excluir sensor.');
        }

    } catch (error) {
        console.error('Erro ao excluir sensor:', error);
        alert('Erro de rede ao tentar excluir o sensor.');
    }
}

// 5. Função para EDITAR um sensor
async function editSensor(oldSensorId) {
    // Tenta obter o nome atual do título para preencher o prompt
    const sensorNameTitle = document.getElementById('sensorNameTitle');
    const currentName = sensorNameTitle ? sensorNameTitle.textContent.replace('Detalhes do Sensor: ', '') : '';

    const newName = prompt(`Novo Nome para o Sensor ID ${oldSensorId}:`, currentName);
    if (newName === null || newName.trim() === '') {
        return; // Cancelado ou vazio
    }
    
    const newSensorId = prompt(`Novo ID ÚNICO para o Sensor (Deixe o mesmo se não for mudar):`, oldSensorId);
    if (newSensorId === null || newSensorId.trim() === '') {
        return; // Cancelado ou vazio
    }

    try {
        const response = await fetch(`/sensors/${oldSensorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), new_sensor_id: newSensorId.trim() })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            
            // Se o ID mudou, precisamos recarregar a página com o novo ID
            if (oldSensorId !== newSensorId.trim()) {
                navigate('sensor_detail', newSensorId.trim());
            } else {
                 // Se apenas o nome mudou, recarregamos os detalhes para refletir a mudança
                fetchSensorDetail(newSensorId.trim()); 
            }
        } else {
            alert(data.message || 'Falha ao editar sensor.');
        }

    } catch (error) {
        console.error('Erro ao editar sensor:', error);
        alert('Erro de rede ao tentar editar o sensor.');
    }
}


// --- Funções de Inicialização e Navegação ---

// Função de Navegação (reutilizável)
function navigate(page, sensorId = null) {
    if (!currentUserId) {
        alert('Sessão inválida. Por favor, faça login novamente.');
        window.location.href = '/login.html';
        return;
    }
    let url = `/${page}.html?user_id=${currentUserId}`;
    if (sensorId) {
        url += `&sensor_id=${sensorId}`;
    }
    window.location.href = url;
}


// FUNÇÃO initializePage ATUALIZADA para anexar botões de Ação
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    const sensorIdFromUrl = urlParams.get('sensor_id');

    // 1. Configura o ID do Usuário
    if (userId) {
        currentUserId = userId; 
    } else {
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
            window.location.href = '/login.html';
        }
    }

    // 2. Configura o botão "Voltar"
    const backButton = document.getElementById('backToHome');
    if (backButton && userId) {
         if (window.location.pathname.includes('sensor_detail.html')) {
            backButton.href = `/list_sensors_data.html?user_id=${userId}`;
        } else {
            backButton.href = `/home.html?user_id=${userId}`;
        }
    }

    // 3. Inicializa o monitoramento da página de detalhes E ANEXA AÇÕES
    if (window.location.pathname.includes('sensor_detail.html')) {
        const sensorNameTitle = document.getElementById('sensorNameTitle');
        const editBtn = document.getElementById('editButton');
        const deleteBtn = document.getElementById('deleteButton');
        
        if (sensorIdFromUrl) {
            // Inicializa a busca e o intervalo de atualização
            if (sensorNameTitle) sensorNameTitle.textContent = `Carregando detalhes do sensor ${sensorIdFromUrl}...`;

            fetchSensorDetail(sensorIdFromUrl);
            setInterval(() => fetchSensorDetail(sensorIdFromUrl), 3000); 

            // Anexa as funções de edição e exclusão aos botões
            if (editBtn) {
                editBtn.onclick = () => editSensor(sensorIdFromUrl);
            }
            if (deleteBtn) {
                deleteBtn.onclick = () => deleteSensor(sensorIdFromUrl);
            }

        } else {
            // ERRO: ID do Sensor ausente na URL
            if (sensorNameTitle) sensorNameTitle.textContent = "Erro: ID do Sensor Não Encontrado na URL.";
            const gaugeValue = document.getElementById('gaugeValue');
            const gaugeStatusText = document.getElementById('gaugeStatusText');

            if (gaugeValue) gaugeValue.textContent = 'ERRO';
            if (gaugeStatusText) gaugeStatusText.textContent = 'ID AUSENTE';
            console.error("ERRO: O parâmetro 'sensor_id' está faltando na URL da página de detalhes.");
        }
    }
}

// Garante que a inicialização ocorra em todas as páginas que usam este script
document.addEventListener('DOMContentLoaded', initializePage);