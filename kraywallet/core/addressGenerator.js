import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

bitcoin.initEccLib(ecc);

/**
 * 📬 Address Generator
 * Gera endereços Taproot, SegWit, Legacy
 */
export class AddressGenerator {
    constructor(network = 'mainnet') {
        this.network = network === 'testnet' 
            ? bitcoin.networks.testnet 
            : bitcoin.networks.bitcoin;
    }

    /**
     * Gerar endereço Taproot (bc1p...) - Para Ordinals e Runes
     */
    generateTaprootAddress(publicKey) {
        // Converter para x-only pubkey (32 bytes)
        const xOnlyPubkey = publicKey.length === 33 
            ? publicKey.slice(1, 33) 
            : publicKey;

        const { address } = bitcoin.payments.p2tr({
            internalPubkey: xOnlyPubkey,
            network: this.network
        });

        return address;
    }

    /**
     * Gerar endereço Native SegWit (bc1q...) - Para payments
     */
    generateSegWitAddress(publicKey) {
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: publicKey,
            network: this.network
        });

        return address;
    }

    /**
     * Gerar endereço Legacy (1...)
     */
    generateLegacyAddress(publicKey) {
        const { address } = bitcoin.payments.p2pkh({
            pubkey: publicKey,
            network: this.network
        });

        return address;
    }

    /**
     * Gerar todos os tipos de endereços de uma public key
     */
    generateAllAddresses(publicKey) {
        return {
            taproot: this.generateTaprootAddress(publicKey),
            segwit: this.generateSegWitAddress(publicKey),
            legacy: this.generateLegacyAddress(publicKey)
        };
    }

    /**
     * Validar endereço Bitcoin
     */
    validateAddress(address) {
        try {
            bitcoin.address.toOutputScript(address, this.network);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Obter tipo de endereço
     */
    getAddressType(address) {
        if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
            return 'taproot';
        } else if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
            return 'segwit';
        } else if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
            return 'legacy';
        } else if (address.startsWith('3') || address.startsWith('2')) {
            return 'script';
        }
        return 'unknown';
    }

    /**
     * Obter scriptPubKey de um endereço
     */
    getScriptPubKey(address) {
        return bitcoin.address.toOutputScript(address, this.network);
    }

    /**
     * Extrair tapInternalKey de scriptPubKey P2TR
     */
    extractTapInternalKey(scriptPubKey) {
        const script = Buffer.isBuffer(scriptPubKey) 
            ? scriptPubKey 
            : Buffer.from(scriptPubKey, 'hex');

        // P2TR: OP_1 (0x51) + 32 bytes
        if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) {
            return script.slice(2);
        }

        return null;
    }
}

export default AddressGenerator;



