import { io, iot, mqtt } from 'aws-iot-device-sdk-v2';
import yargs from 'yargs';
import { args, Args } from './args';

const ruuvi = require('node-ruuvitag');

interface RuuviTag {
  id: string;
  address: string;
  addressType: string;
  connectable: boolean;
  on(event: 'found', handler: (tag: RuuviTag) => Promise<void>): void;
  on(event: 'updated', handler: (data: RuuviData) => void): void;
}

const example = {
  "dataFormat": 5,
  "rssi": -76,
  "temperature": 21.935,
  "humidity": 38.8525,
  "pressure": 99449,
  "accelerationX": -32,
  "accelerationY": 72,
  "accelerationZ": 992,
  "battery": 3006,
  "txPower": 4,
  "movementCounter": 31,
  "measurementSequenceNumber": 16411,
  "mac": "D2:28:5B:B1:03:F7"
};

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

yargs.command('*', false, (yargs: any) => { args }, main).parse();

async function main(argv: Args) {
  if (argv.verbosity != 'none') {
    const level: io.LogLevel = parseInt(io.LogLevel[argv.verbosity.toUpperCase()]);
    io.enable_logging(level);
  }

  const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(argv.client_certificate, argv.private_key);
  config_builder.with_certificate_authority_from_path(undefined, argv.ca_file);
  config_builder.with_clean_session(false);
  config_builder.with_client_id(argv.client_id);
  config_builder.with_endpoint(argv.endpoint);

  const config = config_builder.build();
  const client = new mqtt.MqttClient(new io.ClientBootstrap());
  const connection = client.new_connection(config);

  connection.on('connect', (session) => console.info(`Connect ${session}`));
  connection.on('error', (error) => console.error(`Error ${JSON.stringify(error)}`));
  connection.on('connection_failure', (error) => console.error(`Failure ${JSON.stringify(error)}`));
  connection.on('connection_success', (success) => console.info(JSON.stringify(success)));
  connection.on('message', (topic, payload) => console.log(`${topic} -> ${JSON.stringify(payload)}`))
  connection.on('disconnect', () => console.info(`Disconnect`));

  const r = await connection.connect();
  console.log(r);
  const result = await connection.publish('RuuviTag/d026a90407b160717fecf3ee04b9dc1e', example, mqtt.QoS.AtLeastOnce);
  console.log('MQTT packet id ' + result.packet_id);
  const result2 = await connection.publish('RuuviTag/d026a90407b160717fecf3ee04b9dc1e', example, mqtt.QoS.AtLeastOnce);
  console.log('MQTT packet id ' + result2.packet_id);
  await connection.disconnect();
}
