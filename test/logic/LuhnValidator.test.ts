const assert = require('chai').assert;

import { LuhnValidator } from '../../src/logic/LuhnValidator';

suite('LuhnValidator', ()=> {
    
    test('Validate Payment Method Number', () => {
        let number1 = "4032036094894795";
        let valid = LuhnValidator.validate(number1);
        assert.isTrue(valid);

        let number2 = "1111111111111111";
        valid = LuhnValidator.validate(number2);
        assert.isFalse(valid);
    });

});