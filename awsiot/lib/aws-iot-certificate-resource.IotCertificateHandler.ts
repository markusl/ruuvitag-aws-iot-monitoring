import * as AWS from 'aws-sdk';
import * as AWSLambda from 'aws-lambda';
import { OnEventResponse } from './response';

const sm = new AWS.SecretsManager();
const iot = new AWS.Iot();

export async function handler(event: AWSLambda.CloudFormationCustomResourceEvent): Promise<OnEventResponse | void> {
  console.log(event);

  switch (event.RequestType) {
    case 'Create':
      return createUpdateHandler(event);
    case 'Delete':
      return deleteHandler(event);
    case 'Update':
      console.info('Nothing to update');
  }
}

const deleteHandler = async (event: AWSLambda.CloudFormationCustomResourceEvent) => {
  const thingName = event.ResourceProperties['thingName'];
  const certificateId = (event as any)['PhysicalResourceId'];
  await iot.updateCertificate({
    certificateId,
    newStatus: 'INACTIVE'
  }).promise();
  await iot.deleteCertificate({
    certificateId,
    forceDelete: true
  }).promise();
  const secretName = `${thingName}-Credentials`;
  sm.deleteSecret({
    SecretId: secretName,
    ForceDeleteWithoutRecovery: true
  });
}

const createUpdateHandler = async (event: AWSLambda.CloudFormationCustomResourceEvent) => {
  try {
    const thingName = event.ResourceProperties['thingName'];

    const epResponse = await iot.describeEndpoint({
      endpointType: 'iot:Data-ATS'
    }).promise();

    const certResponse = await iot.createKeysAndCertificate({ setAsActive: true, }).promise();
    const credentials = {
      'certificatePem': certResponse.certificatePem,
      'privateKey': certResponse.keyPair?.PrivateKey,
      'publicKey': certResponse.keyPair?.PublicKey
    };
    const secretName = `${thingName}-Credentials`;
    try {
      const secretResponse = await sm.createSecret({
        Name: secretName,
        SecretString: JSON.stringify(credentials)
      }).promise();
      console.log(`${secretName} created`);
      return {
        PhysicalResourceId: certResponse.certificateId ?? '',
        Data: {
          IotEndpoint: epResponse.endpointAddress ?? '',
          CertificateId: certResponse.certificateId ?? '',
          CertificateArn: certResponse.certificateArn ?? '',
          SecretArn: secretResponse.ARN ?? '',
        }
      };
    } catch (e) {
      const err: AWS.AWSError = e;
      if (err.code !== 'ResourceExistsException') {
        throw e;
      }
      const secretResponse = await sm.updateSecret({
        SecretId: secretName,
        SecretString: JSON.stringify(credentials),
      }).promise();
      console.log(`${secretName} updated`);
      return {
        PhysicalResourceId: certResponse.certificateId ?? '',
        Data: {
          IotEndpoint: epResponse.endpointAddress ?? '',
          CertificateId: certResponse.certificateId ?? '',
          CertificateArn: certResponse.certificateArn ?? '',
          SecretArn: secretResponse.ARN ?? '',
        }
      };
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
