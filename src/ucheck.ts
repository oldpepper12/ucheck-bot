import puppeteer from "puppeteer";
import fs from "fs";
import prompts from "prompts";
import chalk from "chalk";

export function randomItem<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

export class UCheck {
    private browser: puppeteer.Browser;
    private _page: puppeteer.Page;

    constructor() {
        this.browser = null as any;
        this._page = null as any;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
        });
        // puppeteer seems to already launch with a page open; use that instead of creating a new one.
        this._page = (await this.browser.pages())[0];
    }

    get page() {
        return this._page;
    }

    async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async ucheck() {
        console.clear();
        // print disclaimer
        console.log(
            chalk.yellow(
                "This program runs on the assumption that you have not experienced any symptoms of COVID-19 or are at risk of transmitting COVID-19 to others in close contact with you."
            )
        );

        // load login
        if (!fs.existsSync("credentials.json")) {
            let creds = await prompts([
                {
                    type: "text",
                    name: "username",
                    message: "UTORid",
                },
                {
                    type: "password",
                    name: "password",
                    message: "Password",
                },
            ]);

            fs.writeFileSync("credentials.json", JSON.stringify(creds));
        }

        let credentials = JSON.parse(fs.readFileSync("credentials.json", "utf-8"));

        console.log(`Logging into UCheck as ${chalk.magenta(chalk.bold(credentials.username))}...`);

        await this.page.goto("https://ucheck.utoronto.ca/");

        // fill login and submit
        await this.page.type('input[id="username"]', credentials.username);
        await this.page.type('input[id="password"]', credentials.password);
        await this.page.click('button[type="submit"]');

        // begin form
        await this.page.waitForSelector(".MuiButton-label");
        await this.sleep(1000);
        await this.page.click(".MuiButton-label");

        // wait for form to load
        await this.page.waitForSelector("fieldset span");

        // click all seven "no" buttons

        let fieldDescriptions = [
            "Is experiencing COVID-19 Symptoms",
            "Is in contact with someone awaiting COVID-19 test",
            "Is currently required to quarantine",
            "Has been advised to stay home by a doctor",
            "Was in contact with someone with COVID-19",
            "Has received COVID-19 contact-tracing alert",
            "Has literally tested positive for COVID-19",
        ];

        let fieldMaxLen = 0;

        for (let desc of fieldDescriptions) {
            if (desc.length > fieldMaxLen) fieldMaxLen = desc.length;
        }

        for (let i = 0; i < 7; i++) {
            let element = (await this.page.$$("fieldset")).pop()!;
            let buttons = await element.$$("span");

            for (let button of buttons) {
                if ((await button.evaluate((n) => (n as HTMLElement).innerText)) === "No") {
                    let current = fieldDescriptions[i];
                    process.stdout.write(
                        chalk.cyan(current) + "..." + " ".repeat(fieldMaxLen - current.length + 1)
                    );
                    button.click();
                    await this.sleep(300);
                    console.log(chalk.green("NO"));
                    break;
                }
            }
        }

        // find and click the submit button
        for (let button of await this.page.$$(".MuiButton-label")) {
            if ((await button.evaluate((n) => (n as HTMLElement).innerText)) === "Submit") {
                button.click();
                break;
            }
        }

        console.log("Finishing up...");

        await this.sleep(1000);
        await this.browser.close();
    }
}

(async () => {
    let ucheck = new UCheck();
    await ucheck.init();
    await ucheck.ucheck();
})();
