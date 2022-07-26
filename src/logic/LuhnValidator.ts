export class LuhnValidator {

    public static validate(value: string): boolean {
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