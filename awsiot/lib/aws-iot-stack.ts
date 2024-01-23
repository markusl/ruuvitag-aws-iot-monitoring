import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  aws_iot as cfniot,
  aws_logs as logs,
  custom_resources as cr,
} from 'aws-cdk-lib';
import * as iot from '@aws-cdk/aws-iot-alpha';
import * as iot_actions from '@aws-cdk/aws-iot-actions-alpha';
import { AwsIotCertificateResource } from './aws-iot-certificate-resource';

export const RuuviTagMetricNamespacePrefix = 'RuuviTag';

const addRuuviTagEventRule = (scope: Construct, iotTopicPrefix: string, ruuviTagId: string, errorLog: logs.LogGroup) => {

  new iot.TopicRule(scope, `Temperature_Humidity_Rule_${ruuviTagId}`, {
    sql: iot.IotSql.fromStringAsVer20160323(
      `SELECT temperature,humidity FROM '${iotTopicPrefix}/${ruuviTagId}'`,
    ),
    errorAction: new iot_actions.CloudWatchLogsAction(errorLog),
    actions: [
      new iot_actions.CloudWatchPutMetricAction({
        metricName: 'Temperature',
        metricNamespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
        metricUnit: 'None',
        metricValue: '${temperature}',
      }),
      new iot_actions.CloudWatchPutMetricAction({
        metricName: 'Humidity',
        metricNamespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
        metricUnit: 'None',
        metricValue: '${humidity}',
      }),
    ],
    
  });
}

export interface AwsIotStackProps extends cdk.StackProps {
  readonly thingName: string;

  readonly iotTopicPrefix: string;

  readonly ruuviTagIds: string[];
}

export class AwsIotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsIotStackProps) {
    super(scope, id, props);

    const thingName = props.thingName;
    const iotThing = new cfniot.CfnThing(this, thingName, {
      thingName,
    });

    const policy = new cfniot.CfnPolicy(this, `${thingName}Policy`, {
      policyName: `${thingName}Policy`,
      policyDocument: {
        'Version': '2012-10-17',
        'Statement': [
          {
            'Effect': 'Allow',
            'Action': [
              'iot:Publish',
            ],
            'Resource': [
              `arn:aws:iot:${this.region}:${this.account}:topic/${props.iotTopicPrefix}/*`
            ]
          },
          {
            'Effect': 'Allow',
            'Action': [
              'iot:Connect'
            ],
            'Resource': [
              `arn:aws:iot:${this.region}:${this.account}:client/${iotThing.ref}`
            ]
          }
        ]
      }
    });

    const errorLog = new logs.LogGroup(this, 'ErrorLog');
    props.ruuviTagIds.forEach((id) =>
      addRuuviTagEventRule(this, props.iotTopicPrefix, id, errorLog));

    const awsIotCertificateResource = new AwsIotCertificateResource(this, 'AwsIotCertificateResource', { thingName });

    new cfniot.CfnThingPrincipalAttachment(this, 'ThingPrincipalAttachment', {
      principal: awsIotCertificateResource.certificateArn,
      thingName,
    }).addDependency(iotThing);

    new cfniot.CfnPolicyPrincipalAttachment(this, 'PolicyPrincipalAttachment', {
      principal: awsIotCertificateResource.certificateArn,
      policyName: policy.policyName ?? '',
    });

    const describeEndpoint = new cr.AwsCustomResource(this, 'describeEndpoint', {
      onCreate: {
        service: 'Iot',
        action: 'DescribeEndpoint',
        parameters: {
          EndpointType: 'iot:Data-ATS',
        },
        physicalResourceId: cr.PhysicalResourceId.of('LogicalResourceId'),
      },
      logRetention: logs.RetentionDays.ONE_DAY,
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    // Automatically output the endpoint address
    // See https://docs.aws.amazon.com/general/latest/gr/iot-core.html#iot-core-data-plane-endpoints
    new cdk.CfnOutput(this, 'IotEndpointAddress', {
      exportName: 'IotEndpointAddress',
      value: describeEndpoint.getResponseField('endpointAddress'),
    });
  }
}
