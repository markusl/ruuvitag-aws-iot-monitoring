const ruuvi = require('node-ruuvitag');
const deviceModule = require('aws-iot-device-sdk').device;
const cmdLineProcess = require('aws-iot-device-sdk/examples/lib/cmdline');

const awsIotTopicPrefix = 'ruuvitag/';

function startRuuvitagListener(args) {
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

  ruuvi.on('found', (tag) => {
    console.log('RuuviTag found ' + tag.id);
    tag.on('updated', (data) => {
      console.debug('RuuviTag updated ' + tag.id + ':\n' + JSON.stringify(data, null, '  '));
      device.publish(awsIotTopicPrefix + tag.id, JSON.stringify(data));
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
  device.on('error', function (error) {
    console.error('error', error);
  });
  device.on('message', function (topic, payload) {
    console.log('message', topic, payload.toString());
  });
};

module.exports = cmdLineProcess;

if (require.main === module) {
  cmdLineProcess('', process.argv.slice(2), startRuuvitagListener);
}
