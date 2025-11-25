/**
 * 📖 Exemplo de uso da MyWallet
 * 
 * Este arquivo demonstra como usar a wallet para:
 * 1. Criar/restaurar wallet
 * 2. Assinar PSBT com SIGHASH customizado
 * 3. Integrar com o marketplace
 */

import MyWallet from './index.js';

// ===============================================
// EXEMPLO 1: Criar nova wallet
// ===============================================
async function example1_createWallet() {
    console.log('\n📖 EXEMPLO 1: Criar nova wallet\n');

    const wallet = new MyWallet('mainnet');

    // Criar wallet
    const result = wallet.create(12); // 12 palavras

    console.log('\n🔑 Mnemonic (GUARDE EM LOCAL SEGURO!):');
    console.log(result.mnemonic);

    console.log('\n📬 Endereços:');
    console.log('Taproot:', result.addresses.taproot);
    console.log('SegWit:', result.addresses.segwit);
    console.log('Legacy:', result.addresses.legacy);

    return wallet;
}

// ===============================================
// EXEMPLO 2: Restaurar wallet de mnemonic
// ===============================================
async function example2_restoreWallet() {
    console.log('\n📖 EXEMPLO 2: Restaurar wallet\n');

    const wallet = new MyWallet('mainnet');

    // Restaurar de mnemonic
    const mnemonic = 'your twelve word mnemonic phrase goes here make sure to save it';
    wallet.restore(mnemonic);

    console.log('✅ Wallet restored!');
    console.log('Current address:', wallet.currentAddress);

    return wallet;
}

// ===============================================
// EXEMPLO 3: Assinar PSBT com SIGHASH customizado
// ===============================================
async function example3_signPsbt() {
    console.log('\n📖 EXEMPLO 3: Assinar PSBT com SIGHASH\n');

    const wallet = new MyWallet('mainnet');
    wallet.restore('your mnemonic here');

    // PSBT vindo do marketplace (base64)
    const psbtBase64 = 'cHNidP8BAHECAAAAASaBcTc...'; // Seu PSBT aqui

    // ⭐ ASSINAR COM SIGHASH_SINGLE | ANYONECANPAY
    // Isso permite que o comprador adicione inputs/outputs!
    const signedPsbt = wallet.signPsbt(psbtBase64, {
        inputIndex: 0,
        sighashType: 'SINGLE|ANYONECANPAY' // 🔥 ISTO RESOLVE O PROBLEMA!
    });

    console.log('✅ PSBT signed with SIGHASH_SINGLE|ANYONECANPAY');
    console.log('Signed PSBT:', signedPsbt);

    return signedPsbt;
}

// ===============================================
// EXEMPLO 4: Uso com o Marketplace
// ===============================================
async function example4_marketplaceIntegration() {
    console.log('\n📖 EXEMPLO 4: Integração com Marketplace\n');

    const wallet = new MyWallet('mainnet');
    wallet.restore('your mnemonic here');

    // 1. VENDEDOR: Criar listing
    console.log('\n👤 VENDEDOR: Criando listing...');

    // Backend cria PSBT
    const psbtFromBackend = 'cHNidP8BAHECAAAAASaBcTc...';

    // Vendedor assina com SIGHASH_SINGLE|ANYONECANPAY
    const sellerSignedPsbt = wallet.signPsbt(psbtFromBackend, {
        inputIndex: 0,
        sighashType: 'SINGLE|ANYONECANPAY'
    });

    console.log('✅ Vendedor assinou! PSBT pode ser salvo no marketplace.');

    // 2. COMPRADOR: Compra a inscription
    console.log('\n🛒 COMPRADOR: Comprando inscription...');

    // Backend adiciona inputs/outputs do comprador
    const atomicPsbt = 'cHNidP8BAHECAAAAA...'; // PSBT com seller + buyer

    // Comprador assina seus inputs (com SIGHASH_ALL normal)
    const buyerSignedPsbt = wallet.signPsbt(atomicPsbt, {
        inputIndex: 1, // Input do comprador
        sighashType: 'ALL'
    });

    console.log('✅ Comprador assinou!');

    // 3. Finalizar e broadcast
    console.log('\n📡 Finalizando e fazendo broadcast...');

    const { hex } = wallet.finalizePsbt(buyerSignedPsbt);
    const txid = await wallet.broadcast(hex);

    console.log(`🎉 Transação confirmada! TXID: ${txid}`);

    return txid;
}

// ===============================================
// EXEMPLO 5: Verificar balance e UTXOs
// ===============================================
async function example5_checkBalance() {
    console.log('\n📖 EXEMPLO 5: Verificar balance\n');

    const wallet = new MyWallet('mainnet');
    wallet.restore('your mnemonic here');

    // Obter balance
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', balance);

    // Obter UTXOs
    const utxos = await wallet.getUtxos();
    console.log('📊 UTXOs:', utxos);

    return { balance, utxos };
}

// ===============================================
// EXECUTAR EXEMPLOS
// ===============================================
async function runExamples() {
    console.log('\n🚀 INICIANDO EXEMPLOS DA MYWALLET 🚀\n');
    console.log('='.repeat(50));

    // Descomente o exemplo que quiser executar:
    
    // await example1_createWallet();
    // await example2_restoreWallet();
    // await example3_signPsbt();
    // await example4_marketplaceIntegration();
    // await example5_checkBalance();

    console.log('\n='.repeat(50));
    console.log('\n✅ Exemplos concluídos!\n');
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runExamples().catch(console.error);
}

export { 
    example1_createWallet,
    example2_restoreWallet,
    example3_signPsbt,
    example4_marketplaceIntegration,
    example5_checkBalance
};



