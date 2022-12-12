#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsIotStack } from '../lib/aws-iot-stack';
import { AwsIotDashboardStack } from '../lib/aws-iot-dashboard-stack';

const app = new cdk.App();

const props = {
  /** AWS IoT thing name which will be sending data. */
  thingName: 'RaspberryPiZeroW',
  /** AWS IoT topic name where the data is sent. */
  iotTopicPrefix: 'ruuvitag',
  env: {
    region: 'eu-west-1'
  },
  /** List of RuuviTag device id's from where the data is collected. */
  ruuviTagIds: ['d2285bb103f7', 'ce85b8d5e92b'],
}

new AwsIotStack(app, 'AwsIotStack', props);
new AwsIotDashboardStack(app, 'AwsIotDashboardStack', props);
