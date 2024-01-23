#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsIotStack, AwsIotStackProps } from '../lib/aws-iot-stack';
import { AwsIotDashboardStack } from '../lib/aws-iot-dashboard-stack';

const app = new cdk.App();

const props: AwsIotStackProps = {
  /** AWS IoT thing name which will be sending data.
   * This is the same as MQTT Client Id. */
  thingName: 'RaspberryPi',
  /** AWS IoT topic name where the data is sent. */
  iotTopicPrefix: 'RuuviTag',
  /** List of RuuviTag device id's from where the data is collected. */
  ruuviTagIds: ['d087a1b407b9'],
  /** Generic stack properties. */
  env: {
    region: 'eu-west-1',
  },
}

new AwsIotStack(app, 'AwsIotStack', props);
new AwsIotDashboardStack(app, 'AwsIotDashboardStack', props);
