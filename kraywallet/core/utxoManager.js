import axios from 'axios';

/**
 * 💰 UTXO Manager
 * Gerencia UTXOs de endereços Bitcoin
 */
export class UtxoManager {
    constructor(network = 'mainnet') {
        this.network = network;
        this.mempoolApiUrl = network === 'testnet'
            ? 'https://mempool.space/testnet/api'
            : 'https://mempool.space/api';
    }

    /**
     * Buscar UTXOs de um endereço
     */
    async getUtxos(address) {
        try {
            const response = await axios.get(`${this.mempoolApiUrl}/address/${address}/utxo`);
            
            return response.data.map(utxo => ({
                txid: utxo.txid,
                vout: utxo.vout,
                value: utxo.value,
                status: utxo.status
            }));
        } catch (error) {
            console.error('Error fetching UTXOs:', error.message);
            return [];
        }
    }

    /**
     * Buscar detalhes de uma transação
     */
    async getTransaction(txid) {
        try {
            const response = await axios.get(`${this.mempoolApiUrl}/tx/${txid}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching transaction:', error.message);
            return null;
        }
    }

    /**
     * Obter scriptPubKey de um UTXO
     */
    async getUtxoScriptPubKey(txid, vout) {
        try {
            const tx = await this.getTransaction(txid);
            if (tx && tx.vout && tx.vout[vout]) {
                return tx.vout[vout].scriptpubkey;
            }
            return null;
        } catch (error) {
            console.error('Error getting scriptPubKey:', error.message);
            return null;
        }
    }

    /**
     * Calcular balance de um endereço
     */
    async getBalance(address) {
        try {
            const utxos = await this.getUtxos(address);
            const confirmed = utxos
                .filter(u => u.status.confirmed)
                .reduce((sum, u) => sum + u.value, 0);
            
            const unconfirmed = utxos
                .filter(u => !u.status.confirmed)
                .reduce((sum, u) => sum + u.value, 0);

            return {
                confirmed,
                unconfirmed,
                total: confirmed + unconfirmed,
                utxoCount: utxos.length
            };
        } catch (error) {
            console.error('Error calculating balance:', error.message);
            return { confirmed: 0, unconfirmed: 0, total: 0, utxoCount: 0 };
        }
    }

    /**
     * Selecionar UTXOs para criar uma transação
     */
    selectUtxos(utxos, targetAmount) {
        // Ordenar por valor (maior primeiro)
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);

        const selected = [];
        let totalValue = 0;

        for (const utxo of sortedUtxos) {
            selected.push(utxo);
            totalValue += utxo.value;

            if (totalValue >= targetAmount) {
                break;
            }
        }

        if (totalValue < targetAmount) {
            throw new Error(`Insufficient funds. Need ${targetAmount}, have ${totalValue}`);
        }

        return {
            utxos: selected,
            totalValue,
            change: totalValue - targetAmount
        };
    }

    /**
     * Verificar se UTXO é uma inscription (Ordinal)
     */
    async isInscriptionUtxo(txid, vout) {
        // Verificar se o UTXO contém uma inscription
        // Isso requer integração com Ordinals API ou ord index
        // Por enquanto, retornamos false (placeholder)
        
        // TODO: Integrar com ord API
        return false;
    }

    /**
     * Buscar inscriptions de um endereço
     */
    async getInscriptions(address) {
        // Placeholder - requer integração com ord API
        // Pode usar: https://ordinals.com/api ou rodar ord localmente
        
        console.warn('getInscriptions: Not implemented yet. Requires ord API integration.');
        return [];
    }

    /**
     * Buscar runes de um endereço
     */
    async getRunes(address) {
        // Placeholder - requer integração com runes API
        
        console.warn('getRunes: Not implemented yet. Requires runes API integration.');
        return [];
    }
}

export default UtxoManager;



