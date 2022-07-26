let PaymentMethodsLambdaFunction = require('../obj/src/container/PaymentMethodsLambdaFunction').PaymentMethodsLambdaFunction;

module.exports = new PaymentMethodsLambdaFunction().getHandler();