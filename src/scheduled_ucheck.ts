import dns from "dns";
import { UCheck } from "./ucheck";

async function isInternetConnected() {
    let err = await new Promise<null | NodeJS.ErrnoException>((res, rej) =>
        dns.resolve("www.google.com", (err) => res(err))
    );

    if (err) {
        return false;
    } else {
        return true;
    }
}

async function waitForInternetConnection() {
    while (!(await isInternetConnected())) {}
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    let lastTime = new Date();
    while (true) {
        await waitForInternetConnection();
        let currentTime = new Date();

        // Check if it had just turned 7:00 AM
        if (currentTime.getHours() === 7 && lastTime.getHours() !== 7) {
            // Wait a random amount of time so that the UChecks aren't being submitted at
            // exactly the same time every morning
            await sleep(1000 * 300 * Math.random());

            // Perform UCheck
            let ucheck = new UCheck();
            await ucheck.init();
            await ucheck.ucheck();
        }

        lastTime = currentTime;
        await sleep(5000);
    }
}

main();
