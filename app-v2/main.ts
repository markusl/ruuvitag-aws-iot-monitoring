import { io, http, iot, auth, mqtt } from 'aws-iot-device-sdk-v2';
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

const yargs = require('yargs');
yargs.command('*', false, (yargs: any) => { args }, main).parse();

async function execute_session(connection: mqtt.MqttClientConnection, argv: Args) {
  ruuvi.on('found', (tag: RuuviTag) => {
    console.log('RuuviTag found ' + tag.id);
    tag.on('updated', async (data: RuuviData) => {
      console.debug('RuuviTag updated ' + tag.id + ':\n' + JSON.stringify(data, null, '  '));
      await connection.publish(argv.topicPrefix + tag.id, JSON.stringify(data), mqtt.QoS.AtLeastOnce);
    });
  });
}

async function main(argv: Args) {
  if (argv.verbosity != 'none') {
    const level: io.LogLevel = parseInt(io.LogLevel[argv.verbosity.toUpperCase()]);
    io.enable_logging(level);
  }

  const client_bootstrap = new io.ClientBootstrap();

  let config_builder = null;
  if (argv.use_websocket) {
    const proxy_options = argv.proxy_host ?? new http.HttpProxyOptions(argv.proxy_host, argv.proxy_port);

    config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets({
      region: argv.signing_region,
      credentials_provider: auth.AwsCredentialsProvider.newDefault(client_bootstrap),
      proxy_options: proxy_options
    });
  } else {
    config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(argv.cert, argv.key);
  }

  if (argv.ca_file != null) {
    config_builder.with_certificate_authority_from_path(undefined, argv.ca_file);
  }

  config_builder.with_clean_session(false);
  config_builder.with_client_id(argv.client_id);
  config_builder.with_endpoint(argv.endpoint);

  const config = config_builder.build();
  const client = new mqtt.MqttClient(client_bootstrap);
  const connection = client.new_connection(config);

  //await connection.connect();
  // connection.on('connect', (session) => console.info(`Connect ${session}`));
  // connection.on('resume', (return_code: number, session_present: boolean) => console.info(`Resume ${return_code} ${session_present}`));
  // connection.on('error', (error) => console.info(`Error ${JSON.stringify(error)}`));
  // connection.on('disconnect', () => console.info(`Disconnect`));

  ruuvi.on('found', (tag: RuuviTag) => {
    console.log('RuuviTag found ' + tag.id);
    tag.on('updated', async (data) => {
      console.debug('RuuviTag updated ' + tag.id + ':\n' + JSON.stringify(data, null, '  '));
      await connection.publish(argv.topicPrefix + tag.id, JSON.stringify(data), mqtt.QoS.AtLeastOnce);
    });
  });
}
