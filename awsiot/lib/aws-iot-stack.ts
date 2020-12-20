import * as cdk from 'aws-cdk-lib';
import {
  aws_iot as iot,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { AwsIotCertificateResource } from './aws-iot-certificate-resource';

export const RuuviTagMetricNamespacePrefix = 'RuuviTag';

const metricPolicy = (stack: cdk.Stack) => new iam.PolicyDocument({
  statements: [
    new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*']
    }),
    new iam.PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:DescribeLogStreams',
        'logs:PutLogEvents'
      ],
      resources: [`arn:aws:logs:${stack.region}:${stack.account}:log-group:/ruuvitag:*`]
    })]
});

const addRuuviTagEventRule = (scope: cdk.Construct, iotTopicPrefix: string, ruuviTagId: string, roleArn: string) => {
  new iot.CfnTopicRule(scope, `${ruuviTagId}Rule`, {
    ruleName: `RuuviTagEvents_${ruuviTagId}`,
    topicRulePayload: {
      actions: [
        {
          cloudwatchMetric: {
            metricName: 'Temperature',
            metricNamespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
            metricUnit: 'None',
            metricValue: '${temperature}',
            roleArn
          }
        },
        {
          cloudwatchMetric: {
            metricName: 'Humidity',
            metricNamespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
            metricUnit: 'None',
            metricValue: '${humidity}',
            roleArn
          }
        }
      ],
      sql: `SELECT temperature,humidity FROM '${iotTopicPrefix}/${ruuviTagId}'`,
      ruleDisabled: false,
      // Is it possible to specify a log group for errors?
      //errorAction:
    }
  });
}

interface AwsIotStackProps {
  readonly env?: cdk.Environment;

  readonly thingName: string;

  readonly iotTopicPrefix: string;

  readonly ruuviTagIds: string[];
}

export class AwsIotStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AwsIotStackProps) {
    super(scope, id, props);

    const thingName = props.thingName;
    const iotThing = new iot.CfnThing(this, thingName, {
      thingName,
    });

    const policy = new iot.CfnPolicy(this, `${thingName}Policy`, {
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

    const putMetricRole = new iam.Role(this, 'PutMetricRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
      inlinePolicies: {
        putMetricsPolicy: metricPolicy(this),
      }
    });
    props.ruuviTagIds.forEach((id) => addRuuviTagEventRule(this, props.iotTopicPrefix, id, putMetricRole.roleArn));

    const awsIotCertificateResource = new AwsIotCertificateResource(this, 'AwsIotCertificateResource', { thingName });

    new iot.CfnThingPrincipalAttachment(this, 'ThingPrincipalAttachment', {
      principal: awsIotCertificateResource.certificateArn,
      thingName,
    }).node.addDependency(iotThing);

    new iot.CfnPolicyPrincipalAttachment(this, 'PolicyPrincipalAttachment', {
      principal: awsIotCertificateResource.certificateArn,
      policyName: policy.policyName ?? '',
    });
  }
}
