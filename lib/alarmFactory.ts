import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Stack } from "aws-cdk-lib";

import alarmMetricFactory from "./alarmMetricFactory";

import {
  AlarmEvaluation,
  AlarmMetric,
  ApiGateway,
  MissingDataAlarmMetric,
  TreatMissingData,
} from "./types";

const alarmFactory = (stack: Stack, apiGateway: ApiGateway) => {
  const createCfnAlarm = (
    alarmMetric: AlarmMetric,
    nStds: number,
    evaluation: AlarmEvaluation,
    treatMissingData: TreatMissingData,
    actionSnsTopicArn?: string
  ): cloudwatch.CfnAlarm => {
    const { createAlarmMetrics } = alarmMetricFactory(apiGateway);

    const { thresholdMetricId, metrics } = createAlarmMetrics(
      alarmMetric,
      nStds
    );

    const comparisonOperator =
      alarmMetric.metric === "Count"
        ? cloudwatch.ComparisonOperator
            .LESS_THAN_LOWER_OR_GREATER_THAN_UPPER_THRESHOLD
        : cloudwatch.ComparisonOperator.GREATER_THAN_UPPER_THRESHOLD;

    const alarm = new cloudwatch.CfnAlarm(
      stack,
      `${alarmMetric.resource} ${alarmMetric.metric} ${alarmMetric.statistics} alarm`,
      {
        alarmName: `ALARM: ${alarmMetric.resource} ${alarmMetric.metric} ${alarmMetric.statistics}`,
        alarmDescription: `resource: ${alarmMetric.resource}, metric: ${alarmMetric.metric}, stats: ${alarmMetric.statistics}.`,
        alarmActions: actionSnsTopicArn ? [actionSnsTopicArn] : [],
        metrics,
        thresholdMetricId,
        treatMissingData,
        comparisonOperator,
        evaluationPeriods: evaluation.evaluationPeriods,
        datapointsToAlarm: evaluation.datapointsToAlarm,
      }
    );
    return alarm;
  };

  const createResourceMissingDataCfnAlarm = (
    alarmMetric: MissingDataAlarmMetric,
    evaluation: AlarmEvaluation,
    alarmActionSnsTopicArn?: string
  ): cloudwatch.CfnAlarm => {
    const { createAlarmMetricsForResourceMissingData } =
      alarmMetricFactory(apiGateway);

    const metrics = createAlarmMetricsForResourceMissingData(alarmMetric);

    const alarm = new cloudwatch.CfnAlarm(
      stack,
      `${alarmMetric.resource} missing data points alarm`,
      {
        alarmName: `MISSING ALARM: ${alarmMetric.resource}`,
        alarmDescription: `resource: ${alarmMetric.resource}`,
        metrics,
        threshold: 1,
        treatMissingData: "breaching",
        evaluationPeriods: evaluation.evaluationPeriods,
        datapointsToAlarm: evaluation.datapointsToAlarm,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        alarmActions: alarmActionSnsTopicArn ? [alarmActionSnsTopicArn] : [],
      }
    );
    return alarm;
  };

  return { createCfnAlarm, createResourceMissingDataCfnAlarm };
};

export default alarmFactory;
