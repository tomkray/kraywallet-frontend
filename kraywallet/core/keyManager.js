import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

/**
 * 🔑 Key Manager
 * Gerencia chaves privadas, mnemonics e derivação BIP32
 */
export class KeyManager {
    constructor(network = 'mainnet') {
        this.network = network === 'testnet' 
            ? bitcoin.networks.testnet 
            : bitcoin.networks.bitcoin;
    }

    /**
     * Gerar novo mnemonic (12 ou 24 palavras)
     */
    generateMnemonic(wordCount = 12) {
        const strength = wordCount === 24 ? 256 : 128;
        return bip39.generateMnemonic(strength);
    }

    /**
     * Validar mnemonic
     */
    validateMnemonic(mnemonic) {
        return bip39.validateMnemonic(mnemonic);
    }

    /**
     * Derivar master key do mnemonic
     */
    getMasterKeyFromMnemonic(mnemonic, passphrase = '') {
        if (!this.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic');
        }

        const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
        return bip32.fromSeed(seed, this.network);
    }

    /**
     * Derivar key por path BIP32
     * Exemplo: m/84'/0'/0'/0/0 (Native SegWit)
     * Exemplo: m/86'/0'/0'/0/0 (Taproot)
     */
    deriveKey(masterKey, path) {
        return masterKey.derivePath(path);
    }

    /**
     * Obter private key em formato WIF
     */
    getPrivateKeyWIF(node) {
        return node.toWIF();
    }

    /**
     * Obter public key
     */
    getPublicKey(node) {
        return node.publicKey;
    }

    /**
     * Criar ECPair de private key WIF
     */
    getECPairFromWIF(wif) {
        return ECPair.fromWIF(wif, this.network);
    }

    /**
     * Criar ECPair de private key buffer
     */
    getECPairFromPrivateKey(privateKey) {
        return ECPair.fromPrivateKey(privateKey, { network: this.network });
    }

    /**
     * Gerar carteira completa com paths comuns
     */
    generateWallet(mnemonic, accountIndex = 0) {
        const masterKey = this.getMasterKeyFromMnemonic(mnemonic);

        // Derivar keys para diferentes tipos de endereços
        const paths = {
            // Taproot (para Ordinals e Runes)
            taproot: `m/86'/0'/${accountIndex}'/0/0`,
            
            // Native SegWit (para payments)
            segwit: `m/84'/0'/${accountIndex}'/0/0`,
            
            // Legacy (se necessário)
            legacy: `m/44'/0'/${accountIndex}'/0/0`,
        };

        const wallet = {};
        
        for (const [type, path] of Object.entries(paths)) {
            const node = this.deriveKey(masterKey, path);
            wallet[type] = {
                path,
                privateKey: this.getPrivateKeyWIF(node),
                publicKey: node.publicKey.toString('hex'),
                node
            };
        }

        return wallet;
    }
}

export default KeyManager;



