# 🔥 MyWallet - Bitcoin Wallet com SIGHASH Customizado

Uma wallet Bitcoin completa com suporte a **SIGHASH customizado**, Taproot, Ordinals e Runes.

## ✨ Recursos

- ✅ **SIGHASH Customizado** - Assine com `SINGLE|ANYONECANPAY`, `ALL|ANYONECANPAY`, etc
- ✅ **Taproot (P2TR)** - Endereços `bc1p...` para Ordinals e Runes
- ✅ **BIP39/BIP32** - Mnemonic phrases e derivação hierárquica
- ✅ **PSBT Signing** - Controle total sobre assinatura de transações
- ✅ **UTXO Management** - Gerenciamento completo de UTXOs
- ✅ **Atomic Swaps** - Perfeito para marketplaces de Ordinals

---

## 🚀 Quick Start

### Instalação

```bash
cd kraywallet
npm install
```

### Criar Nova Wallet

```javascript
import MyWallet from './index.js';

const wallet = new MyWallet('mainnet');
const { mnemonic, addresses } = wallet.create(12);

console.log('Mnemonic:', mnemonic); // GUARDE EM LOCAL SEGURO!
console.log('Taproot Address:', addresses.taproot);
```

### Restaurar Wallet

```javascript
const wallet = new MyWallet('mainnet');
wallet.restore('your twelve word mnemonic phrase goes here');

console.log('Address:', wallet.currentAddress);
```

### Assinar PSBT com SIGHASH Customizado

```javascript
const wallet = new MyWallet('mainnet');
wallet.restore('your mnemonic');

// ⭐ ASSINAR COM SIGHASH_SINGLE | ANYONECANPAY
const signedPsbt = wallet.signPsbt(psbtBase64, {
    inputIndex: 0,
    sighashType: 'SINGLE|ANYONECANPAY' // 🔥 ISTO RESOLVE O PROBLEMA!
});

console.log('Signed PSBT:', signedPsbt);
```

---

## 📚 API Reference

### MyWallet Class

#### Constructor
```javascript
new MyWallet(network = 'mainnet')
```
- `network`: `'mainnet'` ou `'testnet'`

#### Methods

##### `create(wordCount = 12)`
Cria uma nova wallet.
- **Retorna**: `{ mnemonic, addresses }`

##### `restore(mnemonic)`
Restaura wallet de mnemonic.
- **Retorna**: `{ addresses }`

##### `signPsbt(psbtBase64, options)`
Assina um PSBT.
- **Parâmetros**:
  - `psbtBase64`: PSBT em formato base64
  - `options`:
    - `inputIndex`: Índice do input a assinar (padrão: 0)
    - `sighashType`: Tipo de SIGHASH (padrão: 'ALL')
    - `signAll`: Assinar todos inputs (padrão: false)
- **Retorna**: PSBT assinado em base64

##### `finalizePsbt(psbtBase64)`
Finaliza um PSBT.
- **Retorna**: `{ psbt, hex }`

##### `broadcast(txHex)`
Faz broadcast de uma transação.
- **Retorna**: TXID

##### `getBalance()`
Obtém balance da wallet.
- **Retorna**: `{ confirmed, unconfirmed, total, utxoCount }`

##### `getUtxos()`
Obtém UTXOs da wallet.
- **Retorna**: Array de UTXOs

---

## 🎯 Tipos de SIGHASH

| Tipo | Valor | Descrição |
|------|-------|-----------|
| `ALL` | 0x01 | Assina todos inputs e outputs (padrão) |
| `NONE` | 0x02 | Assina todos inputs, nenhum output |
| `SINGLE` | 0x03 | Assina todos inputs, apenas 1 output |
| `ANYONECANPAY` | 0x80 | Permite adicionar inputs |
| `SINGLE\|ANYONECANPAY` | 0x83 | ⭐ **Perfeito para atomic swaps!** |
| `ALL\|ANYONECANPAY` | 0x81 | Assina 1 input, todos outputs |

---

## 🔥 Uso no Marketplace

### Vendedor (Criar Listing)

```javascript
// 1. Backend cria PSBT com inscription do vendedor
const psbt = createSellPsbt({ /* ... */ });

// 2. Vendedor assina com SIGHASH_SINGLE|ANYONECANPAY
const signedPsbt = wallet.signPsbt(psbt, {
    inputIndex: 0,
    sighashType: 'SINGLE|ANYONECANPAY'
});

// 3. Salvar no banco de dados
await saveOffer({ psbt: signedPsbt });
```

### Comprador (Comprar)

```javascript
// 1. Backend cria PSBT atômico (vendedor + comprador)
const atomicPsbt = buildAtomicPsbt({
    sellerPsbt: signedPsbtFromDB,
    buyerUtxos: myUtxos
});

// 2. Comprador assina seus inputs
const buyerSignedPsbt = wallet.signPsbt(atomicPsbt, {
    inputIndex: 1, // Input do comprador
    sighashType: 'ALL'
});

// 3. Finalizar e broadcast
const { hex } = wallet.finalizePsbt(buyerSignedPsbt);
const txid = await wallet.broadcast(hex);

console.log('🎉 Compra concluída! TXID:', txid);
```

---

## 🔐 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA compartilhe seu mnemonic**
2. **NUNCA exponha private keys**
3. **Sempre faça backup do mnemonic**
4. **Use armazenamento criptografado**
5. **Teste em testnet primeiro**

### Armazenamento Seguro

```javascript
// Exemplo: Criptografar mnemonic antes de armazenar
import crypto from 'crypto';

function encryptMnemonic(mnemonic, password) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}
```

---

## 📖 Exemplos

Veja `example.js` para exemplos completos de uso.

```bash
node example.js
```

---

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
kraywallet/
├── core/
│   ├── keyManager.js        # Gerenciamento de chaves
│   ├── addressGenerator.js  # Geração de endereços
│   └── utxoManager.js        # Gerenciamento de UTXOs
├── psbt/
│   └── psbtSigner.js         # ⭐ Assinatura com SIGHASH
├── index.js                  # Classe principal
├── example.js                # Exemplos de uso
└── README.md                 # Este arquivo
```

### Testes

```bash
# TODO: Adicionar testes
npm test
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/amazing`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing`)
5. Abra um Pull Request

---

## 📄 Licença

ISC

---

## 🙏 Agradecimentos

- [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
- [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) (Taproot)

---

## 🔗 Links Úteis

- [Bitcoin Developer Reference](https://developer.bitcoin.org/reference/)
- [BIP 174 (PSBT)](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki)
- [Ordinals Protocol](https://docs.ordinals.com/)
- [Runes Protocol](https://docs.runes.com/)

---

**Feito com ❤️ para resolver o problema de SIGHASH do marketplace!**



