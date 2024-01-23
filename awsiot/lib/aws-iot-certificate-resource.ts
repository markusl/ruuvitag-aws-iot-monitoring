import * as cdk from 'aws-cdk-lib';
import {
  custom_resources,
  aws_logs as logs,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const createCertificateResourceProvider = (scope: Construct) => {
  const lambdaRole = new iam.Role(scope, 'CustomResourceLambdaRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSIoTFullAccess')]
  });

  lambdaRole.addToPolicy(
    new iam.PolicyStatement({
      resources: ['arn:aws:logs:*:*:*'],
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]
    })
  );

  lambdaRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: [
      'secretsmanager:CreateSecret',
      'secretsmanager:DeleteSecret',
      'secretsmanager:UpdateSecret'
    ]
  }));

  lambdaRole.addToPolicy(new iam.PolicyStatement({
    resources: [
      `arn:aws:iam::${cdk.Stack.of(scope).account}:role/${cdk.Stack.of(scope).stackName}_ServiceRole`
    ],
    actions: [
      'iam:CreateRole',
      'iam:AttachRolePolicy',
      'iam:GetRole',
      'iam:DeleteRole',
      'iam:PassRole'
    ]
  }));

  const onEvent = new lambda_nodejs.NodejsFunction(scope, 'IotCertificateHandler', {
    timeout: cdk.Duration.seconds(30),
    runtime: lambda.Runtime.NODEJS_20_X,
    role: lambdaRole,
    logGroup: new logs.LogGroup(scope, 'IotCertificateHandlerLogs', {
      retention: logs.RetentionDays.ONE_DAY,
    }),
  });
  return new custom_resources.Provider(scope, 'AwsIotCertificateProvider', {
    onEventHandler: onEvent,
    logRetention: logs.RetentionDays.ONE_DAY,
  });
}

interface AwsIotCertificateResourceProps {
  readonly thingName: string;
}

export class AwsIotCertificateResource extends Construct {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: AwsIotCertificateResourceProps) {
    super(scope, id);

    const awsIotCertificateProvider = createCertificateResourceProvider(this);
    const awsIotCertificateResource = new cdk.CustomResource(this, 'AwsIotCertificateResource', {
      serviceToken: awsIotCertificateProvider.serviceToken,
      properties: {
        thingName: props.thingName,
        CertificateId: '',
      },
      resourceType: `Custom::${props.thingName}_Resource`
    });
    const certificateId = awsIotCertificateResource.getAttString('CertificateId');

    new cdk.CfnOutput(this, 'AwsIotCertificateIdOutput', {
      exportName: `AwsIotCertificateId-${props.thingName}`,
      value: certificateId,
    }).node.addDependency(awsIotCertificateResource);
    this.certificateArn = `arn:aws:iot:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:cert/${certificateId}`;
  }
};
