async function main() {
    console.log("Connecting to internal chain");
    const { BN } = require("bn.js");
    const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
    const internal_ws = new WsProvider("ws://localhost:9944");
    const api = await ApiPromise.create({ provider: internal_ws });

    const [staging_chain, staging_node, staging_version] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
    ]);


    const keyring = new Keyring({ type: "sr25519" });
    const sender = keyring.addFromUri('//Alice');
    const receiver = keyring.addFromUri('//Bob');
    const amount = new BN(100);

    console.log(`You are connected to staging chain ${staging_chain} using ${staging_node} v${staging_version}`);

    const address = receiver.address;
    let account = await api.query.system.account(sender.address);
    let nonce = account.nonce.toNumber();

    console.log(new Date());
    for (let i =0; i < 1000; i++) {
        const option = {nonce: nonce};
        const tx = await api.tx.balances.transferKeepAlive(address, amount).signAndSend(sender, option);
        nonce += 1;
        
        console.log("Transfer sent with hash", tx.toHex());
    }
    console.log(new Date());
}

main().catch(console.error);