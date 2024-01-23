/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

export type Args = { [index: string]: any };
import yargs from 'yargs';

export const args = yargs
    .option('endpoint', {
      alias: 'e',
      // https://docs.aws.amazon.com/general/latest/gr/iot-core.html#iot-core-data-plane-endpoints
      description: "AWS IoT Core data plane endpoint.",
      type: 'string',
      required: true
    })
    .option('ca_file', {
      alias: 'r',
      description: 'FILE: path to a Root CA certficate file in PEM format.',
      type: 'string',
      required: true
    })
    .option('client_certificate', {
      alias: 'c',
      description: 'FILE: path to a PEM encoded certificate to use with mTLS',
      type: 'string',
      required: true
    })
    .option('private_key', {
      alias: 'k',
      description: 'FILE: Path to a PEM encoded private key that matches cert.',
      type: 'string',
      required: true
    })
    .option('client_id', {
      alias: 'C',
      description: 'Client ID for MQTT connection.',
      type: 'string',
      required: true
    })
    .option('topicPrefix', {
      alias: 't',
      description: 'topicPrefix',
      type: 'string',
      default: '',
      required: true,
    })
    .option('verbosity', {
      alias: 'v',
      description: 'BOOLEAN: Verbose output',
      type: 'string',
      default: 'none',
      choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'none']
    })
    .help()
    .alias('help', 'h')
    .showHelpOnFail(false)
