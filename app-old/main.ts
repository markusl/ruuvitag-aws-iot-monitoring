const ruuvi = require('node-ruuvitag');
const deviceModule = require('aws-iot-device-sdk').device;
const cmdLineProcess = require('aws-iot-device-sdk/examples/lib/cmdline');

const awsIotTopicPrefix = 'ruuvitag/';

interface RuuviTag {
  id: string;
  address: string;
  addressType: string;
  connectable: boolean;
  on(event: 'found', handler: (tag: RuuviTag) => Promise<void>): void;
  on(event: 'updated', handler: (data: RuuviData) => void): void;
}


interface RuuviData {
  url: string;
  dataFormat: number;
  rssi: number;
  temperature: string;
  humidity: number;
  pressure: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  battery: number;
  txPower: number;
  movementCounter: number;
  measurementSequenceNumber: number;
  mac: string;
}

// Send every nth measurement to the cloud
const updateInterval = 60;
let eventCounter = 0;

function startRuuvitagListener(args: any) {
  const device = deviceModule({
    keyPath: args.privateKey,
    certPath: args.clientCert,
    caPath: args.caCert,
    clientId: args.clientId,
    region: args.region,
    baseReconnectTimeMs: args.baseReconnectTimeMs,
    keepalive: args.keepAlive,
    protocol: args.Protocol,
    port: args.Port,
    host: args.Host,
    debug: args.Debug
  });

  ruuvi.on('found', (tag: RuuviTag) => {
    console.log('RuuviTag found ' + tag.id);
    tag.on('updated', (data: RuuviData) => {
      if (eventCounter % updateInterval === 0) {
        console.debug('RuuviTag updated ' + tag.id + ':\n' + JSON.stringify(data, null, '  '));
        device.publish(awsIotTopicPrefix + tag.id, JSON.stringify(data));
      } else {
        process.stdout.write(eventCounter + '/' + updateInterval + '\r');
      }
      eventCounter++;
    });
  });

  device.on('connect', function () {
    console.log('connect');
  });
  device.on('close', function () {
    console.log('close');
  });
  device.on('reconnect', function () {
    console.log('reconnect');
  });
  device.on('offline', function () {
    console.log('offline');
  });
  device.on('error', function (error: any) {
    console.error('error', error);
  });
  device.on('message', function (topic: string, payload: any) {
    console.log('message', topic, payload.toString());
  });
};

module.exports = cmdLineProcess;

if (require.main === module) {
  cmdLineProcess('', process.argv.slice(2), startRuuvitagListener);
}
