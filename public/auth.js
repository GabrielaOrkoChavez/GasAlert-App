// [CONTEÚDO COMPLETO DE auth.js]
function showMessage(type, text) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.className = ''; 
        messageElement.textContent = text;
        messageElement.classList.add(type);
    }
}

async function handleSubmit(action, event) {
    event.preventDefault(); 
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    let bodyData = { username, password };
    
    if (action === 'register') {
        const email = document.getElementById('email').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password !== confirmPassword) {
             showMessage('error', 'A senha e a confirmação de senha não são iguais.');
             return;
        }
        if (!username || !email || !password) {
            showMessage('error', 'Por favor, preencha todos os campos.');
            return;
        }
        
        bodyData.email = email; 
    } else {
        if (!username || !password) {
            showMessage('error', 'Por favor, preencha todos os campos.');
            return;
        }
    }

    const endpoint = `/${action}`; 
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage('success', data.message);
            
            if (action === 'login') {
                const user_id = data.user_id; 
                setTimeout(() => {
                    window.location.href = `/home.html?user_id=${user_id}`; 
                }, 1500); 
            } else if (action === 'register') {
                setTimeout(() => {
                    showMessage('success', 'Cadastro realizado! Redirecionando para o login...');
                    window.location.href = '/login.html'; 
                }, 1500);
            }
            
            document.getElementById('authForm').reset();

        } else {
            showMessage('error', data.message || `Erro ao processar ${action}.`);
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        showMessage('error', `Falha ao conectar-se ao servidor.`);
    }
}