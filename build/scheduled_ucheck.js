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
const dns_1 = __importDefault(require("dns"));
const ucheck_1 = require("./ucheck");
function isInternetConnected() {
    return __awaiter(this, void 0, void 0, function* () {
        let err = yield new Promise((res, rej) => dns_1.default.resolve("www.google.com", (err) => res(err)));
        if (err) {
            return false;
        }
        else {
            return true;
        }
    });
}
function waitForInternetConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        while (!(yield isInternetConnected())) { }
    });
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let lastTime = new Date();
        while (true) {
            yield waitForInternetConnection();
            let currentTime = new Date();
            // Check if it had just turned 7:00 AM
            if (currentTime.getHours() === 7 && lastTime.getHours() !== 7) {
                // Wait a random amount of time so that the UChecks aren't being submitted at
                // exactly the same time every morning
                yield sleep(1000 * 300 * Math.random());
                let ucheck = new ucheck_1.UCheck();
                yield ucheck.init();
                yield ucheck.ucheck();
            }
            lastTime = currentTime;
            yield sleep(5000);
        }
    });
}
main();
