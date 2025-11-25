/**
 * 🔗 Integração MyWallet <--> Marketplace
 * 
 * Este arquivo mostra como integrar a MyWallet com o marketplace existente
 */

import MyWallet from './index.js';

/**
 * Wrapper para usar no browser (window.myWallet)
 */
export class MarketplaceWallet {
    constructor() {
        this.wallet = null;
        this.isUnlocked = false;
    }

    /**
     * Conectar wallet (similar a window.unisat.requestAccounts())
     */
    async connect() {
        console.log('🔌 Connecting MyWallet...');

        // Verificar se já tem mnemonic salvo (localStorage)
        const savedMnemonic = localStorage.getItem('myWallet_mnemonic_encrypted');

        if (savedMnemonic) {
            // Pedir senha para descriptografar
            const password = prompt('Enter your wallet password:');
            if (!password) {
                throw new Error('Password required');
            }

            // TODO: Descriptografar mnemonic
            const mnemonic = this.decryptMnemonic(savedMnemonic, password);
            
            this.wallet = new MyWallet('mainnet');
            this.wallet.restore(mnemonic);
            this.isUnlocked = true;

            return [this.wallet.currentAddress];
        } else {
            // Criar nova wallet
            return await this.createNewWallet();
        }
    }

    /**
     * Criar nova wallet
     */
    async createNewWallet() {
        console.log('🆕 Creating new wallet...');

        this.wallet = new MyWallet('mainnet');
        const { mnemonic, addresses } = this.wallet.create(12);

        // Pedir senha para criptografar
        const password = prompt('Create a password for your wallet:');
        if (!password) {
            throw new Error('Password required');
        }

        // Criptografar e salvar mnemonic
        const encrypted = this.encryptMnemonic(mnemonic, password);
        localStorage.setItem('myWallet_mnemonic_encrypted', encrypted);

        // Mostrar mnemonic para backup
        alert(`⚠️ IMPORTANT: Save your mnemonic phrase!\n\n${mnemonic}\n\nWrite it down and keep it safe!`);

        this.isUnlocked = true;

        return [addresses.taproot];
    }

    /**
     * Obter endereços (similar a window.unisat.getAccounts())
     */
    async getAccounts() {
        if (!this.isUnlocked || !this.wallet) {
            throw new Error('Wallet not connected');
        }

        return [this.wallet.currentAddress];
    }

    /**
     * Obter public key
     */
    async getPublicKey() {
        if (!this.isUnlocked || !this.wallet) {
            throw new Error('Wallet not connected');
        }

        return this.wallet.wallet.taproot.publicKey;
    }

    /**
     * Obter balance
     */
    async getBalance() {
        if (!this.isUnlocked || !this.wallet) {
            throw new Error('Wallet not connected');
        }

        return await this.wallet.getBalance();
    }

    /**
     * ⭐ ASSINAR PSBT (compatível com Unisat API)
     */
    async signPsbt(psbtBase64, options = {}) {
        console.log('\n✍️  MyWallet: Signing PSBT...');

        if (!this.isUnlocked || !this.wallet) {
            throw new Error('Wallet not connected');
        }

        // Extrair configurações
        const {
            autoFinalized = false,
            toSignInputs = null,
            sighashType = 'ALL' // ⭐ SUPORTA SIGHASH CUSTOMIZADO!
        } = options;

        // Se toSignInputs foi fornecido, assinar apenas esses inputs
        if (toSignInputs && Array.isArray(toSignInputs)) {
            let psbt = psbtBase64;

            for (const input of toSignInputs) {
                psbt = this.wallet.signPsbt(psbt, {
                    inputIndex: input.index,
                    sighashType: input.sighashType || sighashType
                });
            }

            // Auto-finalizar se solicitado
            if (autoFinalized) {
                const { psbt: finalizedPsbt } = this.wallet.finalizePsbt(psbt);
                return finalizedPsbt;
            }

            return psbt;
        } else {
            // Assinar todos os inputs
            const signedPsbt = this.wallet.signPsbt(psbtBase64, {
                signAll: true,
                sighashType
            });

            // Auto-finalizar se solicitado
            if (autoFinalized) {
                const { psbt: finalizedPsbt } = this.wallet.finalizePsbt(signedPsbt);
                return finalizedPsbt;
            }

            return signedPsbt;
        }
    }

    /**
     * Push transação (broadcast)
     */
    async pushTx(txHex) {
        if (!this.isUnlocked || !this.wallet) {
            throw new Error('Wallet not connected');
        }

        return await this.wallet.broadcast(txHex);
    }

    /**
     * Push PSBT (finalizar e broadcast)
     */
    async pushPsbt(psbtBase64) {
        if (!this.isUnlocked || !this.wallet) {
            throw new Error('Wallet not connected');
        }

        const { hex } = this.wallet.finalizePsbt(psbtBase64);
        return await this.wallet.broadcast(hex);
    }

    /**
     * Criptografar mnemonic
     */
    encryptMnemonic(mnemonic, password) {
        // Implementação simples (em produção, usar crypto forte!)
        return btoa(mnemonic + ':' + password); // Base64 (NÃO SEGURO! Apenas exemplo)
    }

    /**
     * Descriptografar mnemonic
     */
    decryptMnemonic(encrypted, password) {
        // Implementação simples (em produção, usar crypto forte!)
        const decoded = atob(encrypted);
        const [mnemonic, savedPassword] = decoded.split(':');
        
        if (savedPassword !== password) {
            throw new Error('Invalid password');
        }

        return mnemonic;
    }

    /**
     * Desconectar wallet
     */
    disconnect() {
        this.wallet = null;
        this.isUnlocked = false;
        console.log('🔌 Wallet disconnected');
    }
}

/**
 * Inicializar wallet global (window.myWallet)
 */
export function initializeWallet() {
    if (typeof window !== 'undefined') {
        window.myWallet = new MarketplaceWallet();
        console.log('✅ MyWallet initialized! Use window.myWallet');
    }
}

export default MarketplaceWallet;



