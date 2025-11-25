/**
 * 🔥 MyWallet - Bitcoin Wallet com suporte a SIGHASH customizado
 * 
 * Recursos:
 * - ✅ Taproot (bc1p...) para Ordinals e Runes
 * - ✅ SIGHASH customizado (SINGLE|ANYONECANPAY, etc)
 * - ✅ BIP39/BIP32 para key management
 * - ✅ UTXO management
 * - ✅ PSBT signing com controle total
 */

import { KeyManager } from './core/keyManager.js';
import { AddressGenerator } from './core/addressGenerator.js';
import { UtxoManager } from './core/utxoManager.js';
import { PsbtSigner } from './psbt/psbtSigner.js';
import * as bitcoin from 'bitcoinjs-lib';

export class MyWallet {
    constructor(network = 'mainnet') {
        this.network = network;
        this.keyManager = new KeyManager(network);
        this.addressGenerator = new AddressGenerator(network);
        this.utxoManager = new UtxoManager(network);
        this.psbtSigner = new PsbtSigner(network);
        
        this.mnemonic = null;
        this.wallet = null;
        this.currentAddress = null;
    }

    /**
     * 🆕 Criar nova wallet
     */
    create(wordCount = 12) {
        console.log('\n🎉 Creating new wallet...');

        // Gerar mnemonic
        this.mnemonic = this.keyManager.generateMnemonic(wordCount);
        
        // Gerar wallet
        this.wallet = this.keyManager.generateWallet(this.mnemonic);

        // Gerar endereços
        for (const [type, keyData] of Object.entries(this.wallet)) {
            const addresses = this.addressGenerator.generateAllAddresses(keyData.node.publicKey);
            this.wallet[type].addresses = addresses;
        }

        // Usar Taproot como padrão
        this.currentAddress = this.wallet.taproot.addresses.taproot;

        console.log('✅ Wallet created!');
        console.log('\n🔑 IMPORTANT: Save your mnemonic phrase!');
        console.log(`Mnemonic: ${this.mnemonic}`);
        console.log(`\n📬 Your Taproot address: ${this.currentAddress}`);

        return {
            mnemonic: this.mnemonic,
            addresses: this.wallet.taproot.addresses
        };
    }

    /**
     * 📥 Restaurar wallet de mnemonic
     */
    restore(mnemonic) {
        console.log('\n🔄 Restoring wallet from mnemonic...');

        if (!this.keyManager.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic phrase');
        }

        this.mnemonic = mnemonic;
        this.wallet = this.keyManager.generateWallet(this.mnemonic);

        // Gerar endereços
        for (const [type, keyData] of Object.entries(this.wallet)) {
            const addresses = this.addressGenerator.generateAllAddresses(keyData.node.publicKey);
            this.wallet[type].addresses = addresses;
        }

        this.currentAddress = this.wallet.taproot.addresses.taproot;

        console.log('✅ Wallet restored!');
        console.log(`📬 Your Taproot address: ${this.currentAddress}`);

        return {
            addresses: this.wallet.taproot.addresses
        };
    }

    /**
     * 💰 Obter balance
     */
    async getBalance() {
        if (!this.currentAddress) {
            throw new Error('Wallet not initialized');
        }

        return await this.utxoManager.getBalance(this.currentAddress);
    }

    /**
     * 📊 Obter UTXOs
     */
    async getUtxos() {
        if (!this.currentAddress) {
            throw new Error('Wallet not initialized');
        }

        return await this.utxoManager.getUtxos(this.currentAddress);
    }

    /**
     * ✍️ Assinar PSBT
     * ⭐ ESTE É O MÉTODO PRINCIPAL QUE RESOLVE O PROBLEMA DO MARKETPLACE!
     */
    signPsbt(psbtBase64, options = {}) {
        console.log('\n✍️  Signing PSBT...');

        const {
            inputIndex = 0,
            sighashType = 'ALL',
            signAll = false
        } = options;

        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }

        // Decodificar PSBT
        const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { 
            network: this.network === 'testnet' 
                ? bitcoin.networks.testnet 
                : bitcoin.networks.bitcoin 
        });

        // Obter private key (Taproot)
        const privateKey = this.wallet.taproot.privateKey;

        // Assinar
        if (signAll) {
            this.psbtSigner.signAllInputs(psbt, privateKey, sighashType);
        } else {
            this.psbtSigner.signInput(psbt, inputIndex, privateKey, sighashType);
        }

        return psbt.toBase64();
    }

    /**
     * 🔨 Finalizar PSBT
     */
    finalizePsbt(psbtBase64) {
        const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { 
            network: this.network === 'testnet' 
                ? bitcoin.networks.testnet 
                : bitcoin.networks.bitcoin 
        });

        this.psbtSigner.finalizePsbt(psbt);

        return {
            psbt: psbt.toBase64(),
            hex: this.psbtSigner.extractTransaction(psbt)
        };
    }

    /**
     * 📡 Broadcast transação
     */
    async broadcast(txHex) {
        const mempoolApiUrl = this.network === 'testnet'
            ? 'https://mempool.space/testnet/api'
            : 'https://mempool.space/api';

        try {
            const response = await fetch(`${mempoolApiUrl}/tx`, {
                method: 'POST',
                body: txHex
            });

            const txid = await response.text();
            console.log(`✅ Transaction broadcast! TXID: ${txid}`);

            return txid;
        } catch (error) {
            console.error('❌ Broadcast failed:', error.message);
            throw error;
        }
    }

    /**
     * 📋 Obter informações da wallet
     */
    getInfo() {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }

        return {
            network: this.network,
            currentAddress: this.currentAddress,
            addresses: {
                taproot: this.wallet.taproot.addresses.taproot,
                segwit: this.wallet.taproot.addresses.segwit,
                legacy: this.wallet.taproot.addresses.legacy
            }
        };
    }
}

// Exportar classes individuais também
export { KeyManager, AddressGenerator, UtxoManager, PsbtSigner };

export default MyWallet;



