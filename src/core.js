"use strict";
/**
 * Core logic of the bot, platform-independent.
 * This file should be considered as a handy toolkit which makes it much easier
 * to write implementations for particular bots.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var dotenv = require("dotenv");
dotenv.config();
var request = require("request-promise-native");
var admin = require("firebase-admin");
var similarity = require("string-similarity");
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.PROJECT_ID,
        clientEmail: process.env.CLIENT_EMAIL,
        privateKey: process.env.PRIVATE_KEY
    })
});
var GCP_API_KEY = process.env.GCP_API_KEY;
var REQUIRED_LANG = process.env.REQUIRED_LANG || "en";
/**
 * @return true if the message is in the correct language, false otherwise
 */
function isCorrectLanguage(messageText) {
    return __awaiter(this, void 0, void 0, function () {
        var options, data, response, err_1, detectedLang, confidence, isReliable;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        uri: "https://translation.googleapis.com/language/translate/v2/detect?key=" + GCP_API_KEY,
                        method: "POST",
                        json: true,
                        body: {
                            q: messageText
                        }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, request(options)];
                case 2:
                    response = _a.sent();
                    data = response.data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1.message);
                    console.error("This error is not handled because it should never happen.");
                    return [3 /*break*/, 4];
                case 4:
                    detectedLang = data.detections[0][0].language;
                    confidence = data.detections[0][0].confidence;
                    isReliable = data.detections[0][0].isReliable;
                    console.log("Lang: " + detectedLang + ", isReliable: " + isReliable + ", confidence: " + confidence.toPrecision(3) + ", message: " + messageText);
                    // console.log(JSON.stringify(response)) Uncomment to log API whole response
                    return [2 /*return*/, detectedLang === REQUIRED_LANG];
            }
        });
    });
}
exports.isCorrectLanguage = isCorrectLanguage;
/**
 * Adds the specified text to the database.
 * @returns {Promise<boolean>} true if the operation is successful, false otherwise
 */
function addException(messageText) {
    return __awaiter(this, void 0, void 0, function () {
        var inputText, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inputText = messageText.toLowerCase();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, admin
                            .firestore()
                            .collection("exceptions")
                            .add({
                            text: inputText
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.error(err_2);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/, true];
            }
        });
    });
}
exports.addException = addException;
/**
 * Removes the specified text to the database.
 * @param {string} messageText message's text
 * @returns {Promise<bool>} true if the operation is successful, false otherwise
 */
function removeException(messageText) {
    return __awaiter(this, void 0, void 0, function () {
        var inputText, exceptionsSnapshot, _i, _a, doc, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    inputText = messageText.toLowerCase();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, admin
                            .firestore()
                            .collection("exceptions")
                            .where("text", "==", inputText)
                            .get()];
                case 2:
                    exceptionsSnapshot = _b.sent();
                    for (_i = 0, _a = exceptionsSnapshot.docs; _i < _a.length; _i++) {
                        doc = _a[_i];
                        doc.ref["delete"](); // bear in mind we are not waiting here for a Promise to be resolved
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _b.sent();
                    console.error(err_3);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/, true];
            }
        });
    });
}
exports.removeException = removeException;
/**
 * Determines whether the message contains some special variations that should be always allowed.
 * @param {string} messageText message's text
 * @returns {Promise<boolean>} true if user should be punished, false otherwise
 */
function shouldBePermitted(messageText) {
    return __awaiter(this, void 0, void 0, function () {
        var inputText, xdTest, hahaTest, exceptionsSnapshot, _i, _a, doc, text, similarityLevel;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    inputText = messageText.toLowerCase();
                    // Don't punish for short messages
                    if (messageText.length <= 4) {
                        return [2 /*return*/, false];
                    }
                    // Don't punish if user's name occurs in the message
                    // if (msg.text.includes(msg.chat.first_name) || msg.text.includes(msg.chat.last_name)) {
                    //   return false
                    // }
                    // Disable for commands and mentions
                    if (messageText.startsWith("/") || messageText.startsWith("@")) {
                        return [2 /*return*/, false];
                    }
                    xdTest = inputText;
                    xdTest = xdTest.replace(/x/g, "");
                    xdTest = xdTest.replace(/d/g, "");
                    if (xdTest === "") {
                        return [2 /*return*/, false];
                    }
                    hahaTest = inputText;
                    hahaTest = hahaTest.replace(/h/g, "");
                    hahaTest = hahaTest.replace(/a/g, "");
                    if (hahaTest === "") {
                        return [2 /*return*/, false];
                    }
                    // Allow messages with links
                    if (inputText.includes("https://")) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, admin
                            .firestore()
                            .collection("exceptions")
                            .get()];
                case 1:
                    exceptionsSnapshot = _b.sent();
                    for (_i = 0, _a = exceptionsSnapshot.docs; _i < _a.length; _i++) {
                        doc = _a[_i];
                        text = doc.get("text");
                        similarityLevel = similarity.compareTwoStrings(text, inputText);
                        if (similarityLevel >= 0.8) {
                            console.log("Similarity " + similarityLevel + " between strings: \"" + text + "\" and \"" + inputText + "\". Returned false.");
                            return [2 /*return*/, false];
                        }
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
exports.shouldBePermitted = shouldBePermitted;
/**
 * It Translates the users message to the required language
 * @param {string} messageText message's text
 * @returns {Promise<string>} the translated messagee
 */
function translateString(messageText) {
    return __awaiter(this, void 0, void 0, function () {
        var options, data, response, err_4, translatedMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        uri: "https://translation.googleapis.com/language/translate/v2?key=" + GCP_API_KEY,
                        method: "POST",
                        json: true,
                        body: {
                            q: messageText,
                            target: REQUIRED_LANG
                        }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, request(options)];
                case 2:
                    response = _a.sent();
                    data = response.data;
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    console.error(err_4.message);
                    console.error("This error is not handled because it should never happen.");
                    return [3 /*break*/, 4];
                case 4:
                    translatedMessage = data.translations[0].translatedText;
                    // console.log(JSON.stringify(response)) Uncomment to log API whole response
                    return [2 /*return*/, translatedMessage];
            }
        });
    });
}
exports.translateString = translateString;
