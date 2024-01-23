import type * as AWSLambda from 'aws-lambda';
import { OnEventResponse } from './response';
import { SecretsManager, ResourceExistsException } from "@aws-sdk/client-secrets-manager";
import { IoT } from "@aws-sdk/client-iot";

const iot = new IoT({ });
const sm = new SecretsManager({ });

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
  });
  await iot.deleteCertificate({
    certificateId,
    forceDelete: true
  });
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
    });

    const certResponse = await iot.createKeysAndCertificate({ setAsActive: true, });
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
      });
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
      if (!(e instanceof ResourceExistsException)) {
        throw e;
      }

      const secretResponse = await sm.updateSecret({
        SecretId: secretName,
        SecretString: JSON.stringify(credentials),
      });
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
