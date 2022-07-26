# HTTP Protocol (version 1) <br/> PaymentMethods Microservice

PaymentMethods microservice implements a HTTP compatible API, that can be accessed on configured port.
All input and output data is serialized in JSON format. Errors are returned in [standard format]().

* [POST /v1/payment_methods/get_payment_methods](#operation1)
* [POST /v1/payment_methods/get_payment_method_by_id](#operation2)
* [POST /v1/payment_methods/create_payment_method](#operation3)
* [POST /v1/payment_methods/update_payment_method](#operation4)
* [POST /v1/payment_methods/delete_payment_method_by_id](#operation5)

## Operations

### <a name="operation1"></a> Method: 'POST', route '/v1/payment_methods/get_payment_methods'

Get payment methods by filter

**Request body:**
- filter: Object
    - id: string - (optional) unique method id
    - ids: string - (optional) list of unique method ids 
    - type: string - (optional) method type (PaymentMethodTypeV1)
    - customer_id: string - (optional) method reference customer id
    - default: boolean (optional) true if you need to get default payment methods
- paging: Object
  - skip: int - (optional) start of page (default: 0). Operation returns paged result
  - take: int - (optional) page length (max: 100). Operation returns paged result

**Response body:**
Page with retrieved payment methods

### <a name="operation2"></a> Method: 'POST', route '/v1/payment_methods/get_payment_method_by_id'

Get method by id

**Request body:**
- method_id: string - method id
- customer_id: string - method reference customer id

**Response body:**
- method: PaymentMethodV1 - finded method 

### <a name="operation3"></a> Method: 'POST', route '/v1/payment_methods/create_payment_method'

Add new method

**Request body:** 
- method: PaymentMethodV1 - params for creates new method

**Response body:**
- method: PaymentMethodV1 - created new method

### <a name="operation4"></a> Method: 'POST', route '/v1/payment_methods/update_payment_method'

Update existed method

**Request body:**
- method: PaymentMethodV1 - params for update existed method

**Response body:**
- method: PaymentMethodV1 - updated method 

### <a name="operation5"></a> Method: 'POST', route '/v1/payment_methods/delete_payment_method_by_id'

Delete method by id

**Request body:**
- method_id: string - method id for delete
- customer_id: string - customer id in the method to be deleted

**Response body:**
- method: PaymentMethodV1 - deleted method 

