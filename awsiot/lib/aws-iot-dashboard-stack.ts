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

const createRuuviValueWidgets = (ruuviTagId: string, region: string) => {
  const tempWidget = new cw.SingleValueWidget({
    metrics: [new cw.Metric({
      namespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
      metricName: 'Temperature',
      statistic: 'Average',
      period: cdk.Duration.minutes(60),
    })],
    region,
    title: 'Lämpötila (Celsius)',
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
    title: 'Ilmankosteus (%)',
    width: 6,
    height: 3,
  });
  return [tempWidget, humidityWidget];
}

const createWeatherValueWidgets = (ruuviTagId: string, region: string) => {
  const tempWidget = new cw.SingleValueWidget({
    metrics: [new cw.Metric({
      namespace: 'Weather',
      metricName: 'Temperature',
      dimensionsMap: {
        'City': 'Helsinki',
      },
    })],
    region,
    title: 'Ulkolämpötila (Celsius)',
    width: 6,
    height: 3,
  });
  const humidityWidget = new cw.SingleValueWidget({
    metrics: [new cw.Metric({
      namespace: 'Weather',
      metricName: 'Humidity',
      dimensionsMap: {
        'City': 'Helsinki',
      },
    })],
    region,
    title: 'Ilmankosteus (%)',
    width: 6,
    height: 3,
  });
  return [tempWidget, humidityWidget];
}

const createTempGraphWidget = (ruuviTagId: string, region: string) => new cw.GraphWidget({
  left: [
    new cw.Metric({
      namespace: 'Weather',
      metricName: 'Temperature',
      dimensionsMap: {
        'City': 'Helsinki',
      },
      label: 'Helsinki',
      statistic: 'Average',
      period: cdk.Duration.minutes(15),
    })],
  right: [
    new cw.Metric({
      namespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
      metricName: 'Temperature',
      label: 'Sisällä',
      statistic: 'Average',
      period: cdk.Duration.minutes(15),
    }),
  ],
  region,
  title: 'Lämpötilan kehitys (Celcius)',
  view: cw.GraphWidgetView.TIME_SERIES,
  width: 12,
  height: 6,
  period: cdk.Duration.days(7),
  leftYAxis: {
    label: "Celsius",
    showUnits: false,
  },
  rightYAxis: {
    min: 5,
    max: 25,
    label: "Celsius",
    showUnits: false,
  },
});

const createHumidityGraphWidget = (ruuviTagId: string, region: string) => new cw.GraphWidget({
  left: [
    new cw.Metric({
      namespace: 'Weather',
      metricName: 'Humidity',
      dimensionsMap: {
        'City': 'Helsinki',
      },
      label: 'Helsinki',
      statistic: 'Average',
      period: cdk.Duration.minutes(15),
    })],
  right: [
    new cw.Metric({
      namespace: `${RuuviTagMetricNamespacePrefix}/${ruuviTagId}`,
      metricName: 'Humidity',
      label: 'Sisällä',
      statistic: 'Average',
      period: cdk.Duration.minutes(15),
    }),
  ],
  region,
  title: 'Ilmankosteus %',
  view: cw.GraphWidgetView.TIME_SERIES,
  width: 12,
  height: 6,
  period: cdk.Duration.days(7),
  leftYAxis: {
    min: 20,
    max: 100,
    label: "Humidity %",
    showUnits: false,
  },
  rightYAxis: {
    label: "Humidity %",
    showUnits: false,
  },
});

export class AwsIotDashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsIotDashboardStackProps) {
    super(scope, id, props);

    const firstRowWidgets = props.ruuviTagIds.flatMap((id) => createRuuviValueWidgets(id, this.region));
    const secondRowWidgets = props.ruuviTagIds.flatMap((id) => createWeatherValueWidgets(id, this.region));
    const thirdRowWidgets = props.ruuviTagIds.flatMap((id) => createTempGraphWidget(id, this.region));
    const fourthRowWidgets = props.ruuviTagIds.flatMap((id) => createHumidityGraphWidget(id, this.region));

    new cw.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.thingName}-Dashboard`,
      start: '-P1D', // One day
      widgets: [
        firstRowWidgets,
        secondRowWidgets,
        thirdRowWidgets,
        fourthRowWidgets,
      ],
    });
  }
}
