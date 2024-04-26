const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { checkAddress } = require('@polkadot/util-crypto');
const { hexToU8a, isHex } = require('@polkadot/util');

const { BN } = require("bn.js");

module.exports = class Faucet {

    constructor(config) {
        this.config = config;
        this.api = null;
        this.init();
    };

    async init() {
        this.api = await ApiPromise.create({ provider: new WsProvider(this.config.ws) });

        // Retrieve the chain & node information information via rpc calls
        const [chain, nodeName, nodeVersion] = await Promise.all([
            this.api.rpc.system.chain(),
            this.api.rpc.system.name(),
            this.api.rpc.system.version(),
        ]);

        console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
    };

    async send(address) {

        // If address has correct prefix and checksum, trigger payout
        const prefix_check = crypto.checkAddress(address, this.config.address_type);
        if (prefix_check[0]) {
            const keyring = new Keyring({ type: "sr25519" });
            const sender = keyring.addFromUri(this.config.mnemonic);

            const padding = new BN(10).pow(new BN(this.config.decimals));
            const amount = new BN(this.config.amount).mul(padding);

            console.log(`Sending ${this.config.amount} ${this.config.symbol} to ${address}`);

            try {
                const tx = await this.api.tx.balances.transferKeepAlive(address, amount).signAndSend(sender);
                return `Done! Transfer ${this.config.amount} ${this.config.symbol} to ${address} with hash ${tx.toHex()}`;
            } catch (error) {
                console.log("ERROR: ", error);
                return `Oops! Something went wrong. Please try again.`;
            }
        }

        // Otherwise try to recover the correct address to support the user
        try {
            const corrected = encodeAddress(
                isHex(address, 32)
                    ? hexToU8a(address)
                    : decodeAddress(address),
                this.config.address_type
            );

            return `Provided address uses different prefix or encoding. Attempting to correct the encoding resulted in the following address: '${corrected}'. Please verify the automatically converted address before trying again and refer to: <${this.config.address_format_link}>`;
        } catch (error) {
            console.log("ERROR: ", error);
        }

        // Or fail with a general address error if all recovery failed
        return `Invalid address! Please ensure you follow our instructions carefully. Refer to: <${this.config.address_format_link}>`;
    }
};
