"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuhnValidator = void 0;
class LuhnValidator {
    static validate(value) {
        var ca, sum = 0, mul = 1;
        var len = value.length;
        while (len--) {
            ca = parseInt(value.charAt(len), 10) * mul;
            sum += ca - (ca > 9 ? 1 : 0) * 9; // sum += ca - (-(ca>9))|9
            // 1 <--> 2 toggle.
            mul ^= 3; // (mul = 3 - mul);
        }
        return (sum % 10 === 0) && (sum > 0);
    }
}
exports.LuhnValidator = LuhnValidator;
//# sourceMappingURL=LuhnValidator.js.map