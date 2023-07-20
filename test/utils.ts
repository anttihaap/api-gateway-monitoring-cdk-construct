import { Stack } from "aws-cdk-lib";
import { ApiGatewayMonitoringCDKConstruct, ApiGatewayMonitoringProps } from "../lib";
import {
  Metric,
  Alarm,
  Method,
  MissingDataAlarm,
  Statistics,
  LatencyStatistics,
} from "../lib/types";
import { Match, Template } from "aws-cdk-lib/assertions";

export const createMonitoringStackTemplate = (
  stack: Stack,
  partialProps: Partial<ApiGatewayMonitoringProps>
) => {
  const alarms = partialProps.alarms ?? [];
  const apiGatewayProperties = {
    apiName: "dummyApiName",
    stage: "dummyStage",
  };

  new ApiGatewayMonitoringCDKConstruct(stack, "MyTestConstruct", {
    ...partialProps,
    alarms: alarms,
    apiGateway: apiGatewayProperties,
  });
  return Template.fromStack(stack);
};

export const dummyAlarm: Alarm = {
  metric: "4XXError",
  resource: "dummy",
};

export const dummyMissingDataAlarm: MissingDataAlarm = {
  resource: "dummy",
};

export const createArrayOfObjs = <T>(n: number, obj: T): T[] =>
  Array.from({ length: n }, () => ({ ...obj }));

export const createArrayOfMatchAnyValue = (numItems: number): Match[] =>
  Array.from({ length: numItems }, () => Match.anyValue());

export const createMethodMetricMatcher = (
  id: string,
  method: Method,
  metric: Metric,
  statistics: Statistics | LatencyStatistics,
  returnData?: boolean
) => ({
  Id: id,
  ReturnData: !!returnData,
  MetricStat: {
    Metric: {
      Dimensions: [
        {
          Name: "ApiName",
          Value: "dummyApiName",
        },
        {
          Name: "Resource",
          Value: "dummy",
        },
        {
          Name: "Stage",
          Value: "dummyStage",
        },
        {
          Name: "Method",
          Value: method,
        },
      ],
      MetricName: metric,
      Namespace: "AWS/ApiGateway",
    },
    Stat: statistics,
  },
});
