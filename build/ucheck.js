"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UCheck = exports.randomItem = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
const CONFIG = {
    submit: true,
    headless: true,
};
function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}
exports.randomItem = randomItem;
class UCheck {
    constructor() {
        this.browser = null;
        this._page = null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer_1.default.launch({
                headless: CONFIG.headless,
            });
            // puppeteer seems to already launch with a page open; use that instead of creating a new one.
            this._page = (yield this.browser.pages())[0];
        });
    }
    get page() {
        return this._page;
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => setTimeout(resolve, ms));
        });
    }
    ucheck() {
        return __awaiter(this, void 0, void 0, function* () {
            console.clear();
            // print disclaimer
            console.log(chalk_1.default.yellow("This program runs on the assumption that you have not experienced any symptoms of COVID-19 or are at risk of transmitting COVID-19 to others in close contact with you."));
            // load login
            if (!fs_1.default.existsSync("credentials.json")) {
                let creds = yield prompts_1.default([
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
                fs_1.default.writeFileSync("credentials.json", JSON.stringify(creds));
            }
            let credentials = JSON.parse(fs_1.default.readFileSync("credentials.json", "utf-8"));
            console.log(`Logging into UCheck as ${chalk_1.default.magenta(chalk_1.default.bold(credentials.username))}...`);
            yield this.page.goto("https://ucheck.utoronto.ca/");
            // fill login and submit
            yield this.page.type('input[id="username"]', credentials.username);
            yield this.page.type('input[id="password"]', credentials.password);
            yield this.page.click('button[type="submit"]');
            // begin form
            yield this.page.waitForSelector(".MuiButton-label");
            yield this.sleep(1000);
            yield this.page.click(".MuiButton-label");
            // wait for form to load
            yield this.page.waitForSelector("fieldset span");
            // click all seven "no" buttons
            let fieldDescriptions = [
                "Is fully vaccinated",
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
                if (desc.length > fieldMaxLen)
                    fieldMaxLen = desc.length;
            }
            for (let i = 0; i < 8; i++) {
                let element = (yield this.page.$$("fieldset")).pop();
                let buttons = yield element.$$("span");
                let buttonToClick = i === 0 ? "Yes" : "No";
                for (let button of buttons) {
                    if ((yield button.evaluate((n) => n.innerText)) === buttonToClick) {
                        let current = fieldDescriptions[i];
                        process.stdout.write(chalk_1.default.cyan(current) + "..." + " ".repeat(fieldMaxLen - current.length + 1));
                        button.click();
                        yield this.sleep(300);
                        console.log(chalk_1.default.green(buttonToClick));
                        break;
                    }
                }
            }
            // find and click the submit button
            if (CONFIG.submit) {
                for (let button of yield this.page.$$(".MuiButton-label")) {
                    if ((yield button.evaluate((n) => n.innerText)) === "Submit") {
                        yield button.click();
                        break;
                    }
                }
                console.log("Finishing up...");
                yield this.sleep(1000);
                yield this.browser.close();
            }
        });
    }
}
exports.UCheck = UCheck;
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        let ucheck = new UCheck();
        yield ucheck.init();
        yield ucheck.ucheck();
    }))();
}
