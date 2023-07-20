# API Gateway monitoring CDK construct

This library provides a facade to define AWS CloudWatch alarms to monitor metrics of the AWS API Gateway. The alarms utilizes AWS CloudWatch anomaly detection to create thresholds. Additionally, missing data point alarms can be created for a resource. This library was created as part of a master's thesis to monitor microservices non-intrusively via an API Gateway: **TBA**.

The construct defines an interface (`ApiGatewayMonitoringProps`) to configure AWS CloudWatch alarms:

```
interface ApiGatewayMonitoringProps {
  apiGateway: ApiGateway;
  alarms: Alarm[];
  alarmDefaults?: AlarmDefaults;
  snsEmailAddress?: string;
  missingDataAlarms?: MissingDataAlarm[];
}
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests

## Alarms

Alarms can be defined with the following interface:

```
interface Alarm = {
  resource: string;
  metric: Metric;
  enabled?: boolean;
  methods?: Method[] | Method;
  period?: number;
  evaluation?: AlarmEvaluation;
  nStds?: number;
  treatMissingData?: TreatMissingData;
  latencyMetricStatistic?: LatencyStatistics;
};
```

### Metrics

The following metrics can be used in alarms:

- **4XXError:** client-side errors.
- **5XXError:** server-side errors.
- **Count:** the total number of requests.
- **Latency:** AWS API Gateway and integration latency.

When specifying multiple `methods` for an alarm, the weighted average is used for the `Latency` metric and sum for the other metrics.

## Missing data point alarms

Missing data point alarms can be defined with the following interface:

```
interface MissingDataAlarm {
  resource: string;
  enabled?: boolean;
  methods?: Method[] | Method;
  period?: number;
  evaluation?: AlarmEvaluation;
}
```
