// public/profile.js

let currentUserId = null;

// Função utilitária para exibir mensagens na tela
function showProfileMessage(type, text) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.className = '';
        messageElement.textContent = text;
        messageElement.classList.add(type); // 'success' ou 'error'
    }
}

// Função de Navegação Global (CORRIGIDA)
function navigate(page) {
    if (currentUserId) {
        // Agora, usa o nome da página exatamente como foi passado (e.g., 'historico')
        window.location.href = `/${page}.html?user_id=${currentUserId}`;
    } else {
        showProfileMessage('error', 'Sessão expirada. Redirecionando para o login.');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
    }
}


// 1. Função para BUSCAR e preencher os dados do perfil (Nome e Email)
async function fetchProfileData() {
    if (!currentUserId) {
        document.getElementById('usernameDisplay').textContent = "Erro de Sessão";
        return;
    }

    try {
        const response = await fetch(`/user/${currentUserId}`); 
        const data = await response.json();

        if (response.ok) {
            // Preenche as informações de visualização
            document.getElementById('usernameDisplay').textContent = data.username;
            document.getElementById('profileEmailDisplay').textContent = data.email;
            
            // Define as iniciais para o placeholder da foto
            const initials = data.username ? data.username.charAt(0).toUpperCase() : 'U';
            document.getElementById('initialsDisplay').textContent = initials;
            
        } else {
            showProfileMessage('error', data.message || 'Falha ao carregar dados do perfil.');
        }

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        showProfileMessage('error', 'Erro de rede ao carregar dados do perfil.');
    }
}

// 2. Função para ALTERAR SENHA
async function handleChangePassword(event) {
    event.preventDefault();
    if (!currentUserId) return;

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showProfileMessage('error', 'Preencha todos os campos de senha.');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showProfileMessage('error', 'A nova senha e a confirmação não são iguais.');
        return;
    }

    if (newPassword.length < 6) { 
        showProfileMessage('error', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }

    try {
        const response = await fetch(`/user/${currentUserId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showProfileMessage('success', data.message);
            document.getElementById('changePasswordForm').reset();
        } else {
            showProfileMessage('error', data.message || 'Falha ao alterar senha. Verifique a senha atual.');
        }

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        showProfileMessage('error', 'Erro de rede ao alterar senha.');
    }
}

// 3. Função de Inicialização (Atualizada com Listeners da barra inferior)
function initializeProfilePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    
    if (userId) {
        currentUserId = userId; 
        
        // 1. Busca dados para exibição (Nome/Email)
        fetchProfileData(); 
        
        // 2. Anexa o listener de Alterar Senha
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handleChangePassword);
        }

        // 3. Configura o botão "Voltar" (canto superior)
        const backButton = document.getElementById('backToHome');
        if (backButton) {
            backButton.href = `/home.html?user_id=${userId}`;
        }

        // 4. Configura os botões da barra inferior
        const btnHistorico = document.getElementById('btnhistorico');
        if(btnHistorico) {
            btnHistorico.addEventListener('click', () => {
                navigate('historico'); 
            });
        }
        
        const btnInicio = document.getElementById('inicio');
        if(btnInicio) {
            btnInicio.addEventListener('click', () => {
                navigate('home');
            });
        }

    } else {
        // Redirecionamento se user_id estiver faltando
        alert('Sessão inválida. Por favor, faça login novamente.');
        window.location.href = '/login.html';
    }
}

document.addEventListener('DOMContentLoaded', initializeProfilePage);