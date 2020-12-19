/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

export type Args = { [index: string]: any };
const yargs = require('yargs');

export const args = yargs
    .option('endpoint', {
      alias: 'e',
      description: "Your AWS IoT custom endpoint, not including a port. " +
        "Ex: \"abcd123456wxyz-ats.iot.us-east-1.amazonaws.com\"",
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
    .option('use_websocket', {
      alias: 'W',
      default: false,
      description: 'To use a websocket instead of raw mqtt. If you ' +
        'specify this option you must specify a region for signing, you can also enable proxy mode.',
      type: 'boolean',
      required: false
    })
    .option('signing_region', {
      alias: 's',
      default: 'us-east-1',
      description: 'If you specify --use_websocket, this ' +
        'is the region that will be used for computing the Sigv4 signature',
      type: 'string',
      required: false
    })
    .option('proxy_host', {
      alias: 'H',
      description: 'Hostname for proxy to connect to. Note: if you use this feature, ' +
        'you will likely need to set --ca_file to the ca for your proxy.',
      type: 'string',
      required: false
    })
    .option('proxy_port', {
      alias: 'P',
      default: 8080,
      description: 'Port for proxy to connect to.',
      type: 'number',
      required: false
    })
    .option('message', {
      alias: 'M',
      description: 'Message to publish.',
      type: 'string',
      default: 'Hello world!'
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
