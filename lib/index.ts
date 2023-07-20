import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

import { Alarm, AlarmDefaults, ApiGateway, MissingDataAlarm } from "./types";
import alarmFactory from "./alarmFactory";
import {
  parseEvaluation,
  parseWithValidationAlarmToAlarmMetric,
  parseNStds,
  parseTreatMissingData,
  parseMissingDataAlarmToMissingDataAlarmMetric,
} from "./utils";
import { createAlarmWidget } from "./alarmWidgets";

export interface ApiGatewayMonitoringProps {
  apiGateway: ApiGateway;
  alarms: Alarm[];
  alarmDefaults?: AlarmDefaults;
  snsEmailAddress?: string;
  missingDataAlarms?: MissingDataAlarm[];
}
export class ApiGatewayMonitoringCDKConstruct extends Construct {
  constructor(stack: Stack, id: string, props: ApiGatewayMonitoringProps) {
    super(stack, id);

    const {
      apiGateway,
      alarms,
      missingDataAlarms,
      alarmDefaults,
      snsEmailAddress,
    } = props;

    const snsAlarmTopic = new sns.Topic(
      stack,
      "API Gateway monitoring CDK Construct alarm",
      {
        displayName: "API Gateway monitoring CDK Construct alarm",
      }
    );

    if (snsEmailAddress) {
      snsAlarmTopic.addSubscription(
        new subscriptions.EmailSubscription(snsEmailAddress)
      );
    }

    const dashboard = new cloudwatch.Dashboard(this, "MonitoringDashboard", {
      dashboardName: "monitoring-dashboard",
    });

    const { createCfnAlarm, createResourceMissingDataCfnAlarm } = alarmFactory(
      stack,
      apiGateway
    );

    alarms.forEach((alarm) => {
      const alarmMetricProps = parseWithValidationAlarmToAlarmMetric(
        alarm,
        alarmDefaults
      );
      const nStds = parseNStds(alarm, alarmDefaults);
      const evaluation = parseEvaluation(alarm, alarmDefaults);
      const treatingMissingData = parseTreatMissingData(alarm, alarmDefaults);

      const cfnAlarm = createCfnAlarm(
        alarmMetricProps,
        nStds,
        evaluation,
        treatingMissingData,
        alarm.enabled ? snsAlarmTopic.topicArn : undefined
      );

      const { resource, metric, statistics } = alarmMetricProps;
      const alarmWidget = createAlarmWidget(
        this,
        `${resource} ${metric} ${statistics}`,
        cfnAlarm.attrArn
      );
      dashboard.addWidgets(alarmWidget);
    });

    missingDataAlarms?.forEach((missingDataAlarm) => {
      const alarmEvaluation = parseEvaluation(missingDataAlarm, alarmDefaults);
      const alarmMetric = parseMissingDataAlarmToMissingDataAlarmMetric(
        missingDataAlarm,
        alarmDefaults
      );

      const cfnAlarm = createResourceMissingDataCfnAlarm(
        alarmMetric,
        alarmEvaluation,
        missingDataAlarm.enabled ? snsAlarmTopic.topicArn : undefined,
      );

      const { resource } = missingDataAlarm;
      const alarmWidget = createAlarmWidget(
        this,
        `${resource} missing data points`,
        cfnAlarm.attrArn
      );
      dashboard.addWidgets(alarmWidget);
    });
  }
}
