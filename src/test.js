const config = require('./config');

Faucet = require('./faucet');

async function test_send() {
    const faucet = new Faucet(config);
    await faucet.init();
    console.log("faucet initialized");
    await faucet.send("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty");

    
}

const main = async () => {
        await test_send();
};

main().then(() => {
    console.log("done");
}).catch((err) => {
    console.log(err);
});
