/**
 * 🔌 KRAY STATION - UNIFIED WALLET CONNECTION
 * 
 * Sistema unificado de conexão de wallets para todo o site
 * Funciona em: index.html, ordinals.html, runes-swap.html, lightning-hub.html
 */

// Estado global da wallet (com persistência em localStorage!)
let walletState = loadWalletState() || {
    connected: false,
    address: null,
    walletType: null, // 'kraywallet', 'unisat', 'xverse'
    balance: null
};

/**
 * 💾 CARREGAR ESTADO DA WALLET (localStorage)
 */
function loadWalletState() {
    try {
        const saved = localStorage.getItem('krayspace_wallet_state');
        if (saved) {
            const state = JSON.parse(saved);
            console.log('💾 Loaded wallet state from localStorage:', state);
            return state;
        }
    } catch (e) {
        console.error('❌ Error loading wallet state:', e);
    }
    return null;
}

/**
 * 💾 SALVAR ESTADO DA WALLET (localStorage)
 */
function saveWalletState() {
    try {
        localStorage.setItem('krayspace_wallet_state', JSON.stringify(walletState));
        console.log('💾 Saved wallet state to localStorage');
    } catch (e) {
        console.error('❌ Error saving wallet state:', e);
    }
}

/**
 * 🚀 INICIALIZAR AO CARREGAR PÁGINA
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 Wallet Connect initializing...');
    
    // Setup event listeners
    setupWalletListeners();
    
    // Check if wallet is already connected
    checkExistingConnection();
});

/**
 * 🎧 SETUP EVENT LISTENERS
 */
function setupWalletListeners() {
    // Connect wallet button
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.onclick = openWalletModal;
    }
    
    // Modal close button
    const modalCloseBtn = document.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.onclick = closeWalletModal;
    }
    
    // Click outside modal to close
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeWalletModal();
            }
        };
    }
}

/**
 * 📖 ABRIR MODAL DE WALLET
 */
function openWalletModal() {
    console.log('📖 Opening wallet modal...');
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * ❌ FECHAR MODAL DE WALLET
 */
function closeWalletModal() {
    console.log('❌ Closing wallet modal...');
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 🔍 VERIFICAR CONEXÃO EXISTENTE
 */
async function checkExistingConnection() {
    console.log('🔍 Checking existing connection...');
    
    // 💾 VERIFICAR SE JÁ TEM CONEXÃO SALVA NO LOCALSTORAGE
    if (walletState.connected && walletState.address) {
        console.log('💾 Found saved connection:', walletState);
        
        // Atualizar UI com dados salvos
        updateWalletUI();
        
        // Dispatch evento para outros scripts
        window.dispatchEvent(new CustomEvent('walletConnected', { 
            detail: walletState 
        }));
        
        console.log('✅ Restored connection from localStorage');
        return; // Não precisa verificar mais nada
    }
    
    // Se não tem nada salvo, verificar extensões
    
    // Check MyWallet (Chrome Extension)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
            // Try to get wallet status from extension
            chrome.storage.local.get(['walletState'], (result) => {
                if (result.walletState && result.walletState.unlocked) {
                    console.log('✅ MyWallet detected and unlocked');
                    // Simulate connection
                    connectToMyWallet(result.walletState);
                }
            });
        } catch (e) {
            console.log('MyWallet not available');
        }
    }
    
    // Check Unisat
    if (typeof window.unisat !== 'undefined') {
        console.log('✅ Unisat wallet detected');
        const accounts = await window.unisat.getAccounts();
        if (accounts && accounts.length > 0) {
            walletState.connected = true;
            walletState.address = accounts[0];
            walletState.walletType = 'unisat';
            updateWalletUI();
            saveWalletState(); // 💾 SALVAR
        }
    }
    
    // Check Xverse
    if (typeof window.BitcoinProvider !== 'undefined') {
        console.log('✅ Xverse wallet detected');
    }
    
    // 🔥 LISTENER PARA DESCONEXÃO DA MYWALLET
    setupMyWalletDisconnectListener();
}

/**
 * 🔒 LISTENER PARA LOCK/DISCONNECT DA MYWALLET
 */
function setupMyWalletDisconnectListener() {
    // Listener para evento de lock da MyWallet
    window.addEventListener('walletLocked', () => {
        console.log('🔒 MyWallet locked, disconnecting frontend...');
        
        if (walletState.walletType === 'kraywallet') {
            disconnectWallet();
            showNotification('🔒 MyWallet locked', 'info');
        }
    });
    
    // Listener para evento de desconexão
    window.addEventListener('walletDisconnected', () => {
        console.log('❌ MyWallet disconnected');
        
        if (walletState.walletType === 'kraywallet') {
            disconnectWallet();
        }
    });
    
    console.log('✅ MyWallet disconnect listeners setup');
}

/**
 * 🔌 DESCONECTAR WALLET
 */
function disconnectWallet() {
    console.log('🔌 Disconnecting wallet...');
    
    // Reset wallet state
    const oldWalletType = walletState.walletType;
    walletState.connected = false;
    walletState.address = null;
    walletState.walletType = null;
    walletState.balance = null;
    
    // 🗑️ LIMPAR LOCALSTORAGE
    localStorage.removeItem('krayspace_wallet_state');
    console.log('🗑️ Cleared wallet state from localStorage');
    
    // Update UI
    updateWalletUI();
    
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('walletDisconnected', {
        detail: { walletType: oldWalletType }
    }));
    
    console.log('✅ Wallet disconnected');
}

/**
 * 🔗 CONECTAR À MYWALLET
 */
async function connectMyWallet() {
    console.log('🔗 Connecting to MyWallet...');
    
    // Check if MyWallet API is injected (window.krayWallet)
    if (typeof window.krayWallet === 'undefined') {
        showNotification('❌ MyWallet extension not found!', 'error');
        alert('Please install MyWallet Chrome extension first.\n\nYou can find it in the Extensions section of your browser.');
        return false;
    }
    
    try {
        console.log('🔌 MyWallet API detected, calling connect()...');
        
        // Usar a API window.krayWallet (injetada pela extensão)
        const result = await window.krayWallet.connect();
        
        if (result.success) {
            // Wallet conectada com sucesso!
            walletState.connected = true;
            walletState.address = result.address;
            walletState.walletType = 'kraywallet';
            
            console.log('✅ MyWallet connected:', walletState.address);
            
            // Update UI
            updateWalletUI();
            saveWalletState(); // 💾 SALVAR NO LOCALSTORAGE
            closeWalletModal();
            showNotification('✅ MyWallet connected!', 'success');
            
            // Dispatch event for other scripts
            window.dispatchEvent(new CustomEvent('walletConnected', { 
                detail: walletState 
            }));
            
            return true;
        } else {
            // Wallet locked ou não criada
            if (result.error && result.error.includes('locked')) {
                showNotification('🔓 Please unlock your MyWallet', 'info');
                console.log('🔒 Wallet is locked - popup should open automatically');
                
                // Fechar o modal do site
                closeWalletModal();
                
                // A extensão já deve ter aberto o popup
                // Agora vamos esperar o unlock
                console.log('⏳ Waiting for wallet unlock...');
                
                // Listener para quando conectar
                const handleConnect = (event) => {
                    if (event.detail && event.detail.address) {
                        console.log('✅ Wallet unlocked and connected!');
                        
                        walletState.connected = true;
                        walletState.address = event.detail.address;
                        walletState.walletType = 'kraywallet';
                        
                        updateWalletUI();
                        saveWalletState(); // 💾 SALVAR NO LOCALSTORAGE
                        showNotification('✅ MyWallet connected!', 'success');
                        
                        // Remover listener
                        window.removeEventListener('walletConnected', handleConnect);
                    }
                };
                
                // Adicionar listener (será removido após conectar)
                window.addEventListener('walletConnected', handleConnect);
                
                // Timeout de 60 segundos
                setTimeout(() => {
                    window.removeEventListener('walletConnected', handleConnect);
                }, 60000);
                
                return false;
            } else {
                showNotification('❌ Please create or restore a wallet in MyWallet first', 'error');
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Error connecting MyWallet:', error);
        
        // Se o erro for "locked", tratar especialmente
        if (error.message && error.message.includes('locked')) {
            showNotification('🔓 Please unlock your MyWallet', 'info');
            closeWalletModal();
            
            console.log('🔒 Wallet is locked - waiting for unlock...');
            
            // Mesmo tratamento acima
            const handleConnect = (event) => {
                if (event.detail && event.detail.address) {
                    walletState.connected = true;
                    walletState.address = event.detail.address;
                    walletState.walletType = 'kraywallet';
                    
                    updateWalletUI();
                    saveWalletState(); // 💾 SALVAR NO LOCALSTORAGE
                    showNotification('✅ MyWallet connected!', 'success');
                    
                    window.removeEventListener('walletConnected', handleConnect);
                }
            };
            
            window.addEventListener('walletConnected', handleConnect);
            setTimeout(() => window.removeEventListener('walletConnected', handleConnect), 60000);
            
            return false;
        } else {
            showNotification('❌ Failed to connect MyWallet', 'error');
            return false;
        }
    }
}

/**
 * 🔗 CONECTAR À UNISAT
 */
async function connectUnisat() {
    console.log('🔗 Connecting to Unisat...');
    
    if (typeof window.unisat === 'undefined') {
        showNotification('❌ Unisat wallet not found!', 'error');
        alert('Please install Unisat wallet extension first.');
        return false;
    }
    
    try {
        const accounts = await window.unisat.requestAccounts();
        
        if (accounts && accounts.length > 0) {
            walletState.connected = true;
            walletState.address = accounts[0];
            walletState.walletType = 'unisat';
            
            console.log('✅ Unisat connected:', walletState.address);
            
            updateWalletUI();
            saveWalletState(); // 💾 SALVAR NO LOCALSTORAGE
            closeWalletModal();
            showNotification('✅ Unisat connected!', 'success');
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('walletConnected', { 
                detail: walletState 
            }));
            
            return true;
        }
    } catch (error) {
        console.error('❌ Error connecting Unisat:', error);
        showNotification('❌ User rejected connection', 'error');
        return false;
    }
}

/**
 * 🔗 CONECTAR À XVERSE
 */
async function connectXverse() {
    console.log('🔗 Connecting to Xverse...');
    
    if (typeof window.BitcoinProvider === 'undefined') {
        showNotification('❌ Xverse wallet not found!', 'error');
        alert('Please install Xverse wallet extension first.');
        return false;
    }
    
    try {
        const response = await window.BitcoinProvider.request('getAddresses', null);
        
        if (response && response.result && response.result.addresses && response.result.addresses.length > 0) {
            // Preferir Taproot address
            const taprootAddr = response.result.addresses.find(a => a.type === 'p2tr');
            const address = taprootAddr ? taprootAddr.address : response.result.addresses[0].address;
            
            walletState.connected = true;
            walletState.address = address;
            walletState.walletType = 'xverse';
            
            console.log('✅ Xverse connected:', walletState.address);
            
            updateWalletUI();
            saveWalletState(); // 💾 SALVAR NO LOCALSTORAGE
            closeWalletModal();
            showNotification('✅ Xverse connected!', 'success');
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('walletConnected', { 
                detail: walletState 
            }));
            
            return true;
        }
    } catch (error) {
        console.error('❌ Error connecting Xverse:', error);
        showNotification('❌ User rejected connection', 'error');
        return false;
    }
}

/**
 * 🎨 ATUALIZAR UI DA WALLET
 */
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWallet');
    if (!connectBtn) return;
    
    if (walletState.connected && walletState.address) {
        // Show shortened address
        const shortAddress = `${walletState.address.substring(0, 6)}...${walletState.address.substring(walletState.address.length - 4)}`;
        
        connectBtn.innerHTML = `
            <span class="wallet-text">${shortAddress}</span>
        `;
        
        // Add disconnect functionality
        connectBtn.onclick = () => {
            if (confirm('Disconnect wallet?')) {
                disconnectWallet();
            }
        };
        
        // Add visual indicator
        connectBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    } else {
        // Reset to default
        connectBtn.innerHTML = `
            <span class="wallet-text">Connect Wallet</span>
        `;
        connectBtn.onclick = openWalletModal;
        connectBtn.style.background = '';
    }
}

/**
 * 🔌 DESCONECTAR WALLET
 */
function disconnectWallet() {
    console.log('🔌 Disconnecting wallet...');
    
    walletState.connected = false;
    walletState.address = null;
    walletState.walletType = null;
    walletState.balance = null;
    
    updateWalletUI();
    showNotification('Wallet disconnected', 'info');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
}

/**
 * 📢 MOSTRAR NOTIFICAÇÃO
 */
function showNotification(message, type = 'info') {
    console.log(`📢 [${type.toUpperCase()}] ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * 🌐 OBTER ESTADO DA WALLET (para outros scripts)
 */
function getWalletState() {
    return walletState;
}

// Export para uso global
window.walletConnect = {
    connect: {
        kraywallet: connectMyWallet,
        unisat: connectUnisat,
        xverse: connectXverse
    },
    disconnect: disconnectWallet,
    getState: getWalletState,
    openModal: openWalletModal,
    closeModal: closeWalletModal
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Wallet Connect system loaded');

