# AWS IoT infrastructure

## Dependencies

* Install Node.js 20
* Install AWS CDK `npm i -g aws-cdk`

## Configure

Configure your own properties in `bin/aws-iot.ts`.

## Install

```sh
cdk deploy AwsIotStack
cdk deploy AwsIotDashboardStack
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
