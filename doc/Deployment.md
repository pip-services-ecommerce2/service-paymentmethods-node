
# Deployment Guide <br/> PaymentMethods service Microservice

PaymentMethods service microservice can be used in different deployment scenarios.

* [Standalone Process](#process)

## <a name="process"></a> Standalone Process

The simplest way to deploy the microservice is to run it as a standalone process. 
This microservice is implemented in JavaScript and requires installation of Node.js. 
You can get it from the official site at https://nodejs.org/en/download

**Step 1.** Download microservices by following [instructions](Download.md)

**Step 2.** Add **config.json** file to the root of the microservice folder and set configuration parameters. 
See [Configuration Guide](Configuration.md) for details.

**Step 3.** Start the microservice using the command:

```bash
node run
```