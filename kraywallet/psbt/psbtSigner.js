import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import ECPairFactory from 'ecpair';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

/**
 * ✍️ PSBT Signer
 * ⭐ ASSINA PSBTs COM SIGHASH CUSTOMIZADO
 * Isso é o que Unisat NÃO FAZ!
 */
export class PsbtSigner {
    constructor(network = 'mainnet') {
        this.network = network === 'testnet' 
            ? bitcoin.networks.testnet 
            : bitcoin.networks.bitcoin;
    }

    /**
     * Mapear string SIGHASH para número
     */
    getSighashType(sighashString) {
        const sighashTypes = {
            'ALL': bitcoin.Transaction.SIGHASH_ALL, // 0x01
            'NONE': bitcoin.Transaction.SIGHASH_NONE, // 0x02
            'SINGLE': bitcoin.Transaction.SIGHASH_SINGLE, // 0x03
            'ANYONECANPAY': bitcoin.Transaction.SIGHASH_ANYONECANPAY, // 0x80
            'SINGLE|ANYONECANPAY': bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY, // 0x83
            'ALL|ANYONECANPAY': bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_ANYONECANPAY, // 0x81
            'NONE|ANYONECANPAY': bitcoin.Transaction.SIGHASH_NONE | bitcoin.Transaction.SIGHASH_ANYONECANPAY // 0x82
        };

        return sighashTypes[sighashString] || bitcoin.Transaction.SIGHASH_ALL;
    }

    /**
     * ⭐ ASSINAR INPUT COM SIGHASH CUSTOMIZADO
     * ESTE É O MÉTODO PRINCIPAL QUE RESOLVE O PROBLEMA!
     */
    signInput(psbt, inputIndex, privateKeyWIF, sighashType = 'ALL') {
        console.log(`\n🔐 ========== SIGNING INPUT ${inputIndex} ==========`);
        console.log(`SIGHASH Type: ${sighashType}`);

        // Criar keypair da private key
        const keyPair = ECPair.fromWIF(privateKeyWIF, this.network);

        // Obter valor numérico do SIGHASH
        const sighash = this.getSighashType(sighashType);
        
        console.log(`SIGHASH Value: 0x${sighash.toString(16)}`);

        try {
            // ⭐ AQUI ESTÁ A MÁGICA!
            // Para Taproot, precisamos passar o SIGHASH no array de tipos permitidos
            const allowedSighashTypes = [sighash];
            
            // Verificar se é input Taproot
            const input = psbt.data.inputs[inputIndex];
            const isTaproot = !!input.tapInternalKey;

            if (isTaproot) {
                // Taproot: adicionar allowedSighashTypes ao input
                if (!input.sighashType || input.sighashType !== sighash) {
                    // Definir o tipo de SIGHASH permitido para este input
                    input.sighashType = sighash;
                }
                
                // Assinar com o sighash type especificado
                psbt.signInput(inputIndex, keyPair, allowedSighashTypes);
            } else {
                // Legacy/SegWit: signInput normal
                psbt.signInput(inputIndex, keyPair);
            }

            console.log(`✅ Input ${inputIndex} signed successfully!`);
            console.log(`=================================================\n`);

            return true;
        } catch (error) {
            console.error(`❌ Failed to sign input ${inputIndex}:`, error.message);
            throw error;
        }
    }

    /**
     * Assinar múltiplos inputs com diferentes SIGHASH
     */
    signMultipleInputs(psbt, signingConfig) {
        // signingConfig = [
        //   { inputIndex: 0, privateKey: 'KxXX...', sighashType: 'SINGLE|ANYONECANPAY' },
        //   { inputIndex: 1, privateKey: 'KyYY...', sighashType: 'ALL' }
        // ]

        console.log(`\n📝 Signing ${signingConfig.length} inputs...`);

        for (const config of signingConfig) {
            this.signInput(
                psbt,
                config.inputIndex,
                config.privateKey,
                config.sighashType || 'ALL'
            );
        }

        return psbt;
    }

    /**
     * Assinar TODOS os inputs com o mesmo SIGHASH
     */
    signAllInputs(psbt, privateKeyWIF, sighashType = 'ALL') {
        const inputCount = psbt.inputCount;

        console.log(`\n📝 Signing all ${inputCount} inputs with ${sighashType}...`);

        for (let i = 0; i < inputCount; i++) {
            this.signInput(psbt, i, privateKeyWIF, sighashType);
        }

        return psbt;
    }

    /**
     * Verificar se input já está assinado
     */
    isInputSigned(psbt, inputIndex) {
        const input = psbt.data.inputs[inputIndex];
        return !!(input.tapKeySig || (input.partialSig && input.partialSig.length > 0));
    }

    /**
     * Obter informações sobre assinaturas
     */
    getSignatureInfo(psbt) {
        const info = [];

        for (let i = 0; i < psbt.inputCount; i++) {
            const input = psbt.data.inputs[i];
            const isSigned = this.isInputSigned(psbt, i);

            info.push({
                index: i,
                signed: isSigned,
                hasTapKeySig: !!input.tapKeySig,
                hasPartialSig: !!(input.partialSig && input.partialSig.length > 0),
                hasFinalScriptWitness: !!input.finalScriptWitness
            });
        }

        return info;
    }

    /**
     * Finalizar PSBT (preparar para broadcast)
     */
    finalizePsbt(psbt) {
        try {
            console.log('\n🔨 Finalizing PSBT...');

            psbt.finalizeAllInputs();

            console.log('✅ PSBT finalized successfully!');

            return psbt;
        } catch (error) {
            console.error('❌ Failed to finalize PSBT:', error.message);
            throw error;
        }
    }

    /**
     * Extrair transação hex do PSBT finalizado
     */
    extractTransaction(psbt) {
        try {
            const tx = psbt.extractTransaction();
            return tx.toHex();
        } catch (error) {
            console.error('❌ Failed to extract transaction:', error.message);
            throw error;
        }
    }

    /**
     * Validar PSBT
     */
    validatePsbt(psbtBase64) {
        try {
            const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network: this.network });
            return {
                valid: true,
                inputCount: psbt.inputCount,
                outputCount: psbt.txOutputs.length,
                signatures: this.getSignatureInfo(psbt)
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

export default PsbtSigner;

