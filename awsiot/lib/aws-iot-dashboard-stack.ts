import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch as cw,
} from 'aws-cdk-lib';
import { RuuviTagMetricNamespacePrefix } from './aws-iot-stack';
import { Construct } from 'constructs';

interface AwsIotDashboardStackProps {
  readonly env?: cdk.Environment;

  readonly thingName: string;

  readonly ruuviTagIds: string[];
}

const createFirstRowWidgets = (ruuviTagId: string, region: string) => {
  const tempWidget = new cw.SingleValueWidget({
    metrics: [new cw.Metric({
      namespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
      metricName: 'Temperature',
      statistic: 'Average',
      period: cdk.Duration.minutes(60),
    })],
    region,
    title: 'Ulkolämpötila (Celsius)',
    width: 6,
    height: 3,
  });
  const humidityWidget = new cw.SingleValueWidget({
    metrics: [new cw.Metric({
      namespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
      metricName: 'Humidity',
      statistic: 'Average',
      period: cdk.Duration.minutes(60),
    })],
    region,
    title: 'Suhteellinen ilmankosteus (%)',
    width: 6,
    height: 3,
  });
  return [tempWidget, humidityWidget];
}

const createSecondRowWidgets = (ruuviTagId: string, region: string) => new cw.GraphWidget({
  left: [new cw.Metric({
    namespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
    metricName: 'Temperature',
    statistic: 'Average',
  })],
  region,
  title: 'Lämpötilan kehitys (Celcius)',
  view: cw.GraphWidgetView.TIME_SERIES,
  stacked: true,
  width: 12,
  height: 6,
});

export class AwsIotDashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsIotDashboardStackProps) {
    super(scope, id, props);
    
    const firstRowWidgets = props.ruuviTagIds.flatMap((id) => createFirstRowWidgets(id, this.region));
    const secondRowWidgets = props.ruuviTagIds.flatMap((id) => createSecondRowWidgets(id, this.region));

    new cw.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.thingName}-Dashboard`,
      start: '-P1D', // One day
      widgets: [
        firstRowWidgets,
        secondRowWidgets,
      ],
    });
  }
}
