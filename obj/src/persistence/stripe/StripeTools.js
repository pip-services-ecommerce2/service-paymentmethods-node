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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeTools = void 0;
class StripeTools {
    static findItem(list, predicate, getId) {
        return __awaiter(this, void 0, void 0, function* () {
            let page;
            do {
                let params = {
                    limit: 100,
                };
                if (page && page.data.length > 0)
                    params.starting_after = getId(page.data[page.data.length - 1]);
                page = yield list(params);
                let item = page.data.find(predicate);
                if (item)
                    return item;
            } while (page.has_more);
            return null;
        });
    }
    static errorSuppression(action, errorCodes = ['resource_missing']) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = null;
            let err;
            try {
                result = yield action;
            }
            catch (e) {
                err = e;
            }
            if (err) {
                if (!errorCodes.includes(err.code))
                    throw err;
            }
            return result;
        });
    }
}
exports.StripeTools = StripeTools;
//# sourceMappingURL=StripeTools.js.map