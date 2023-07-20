import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export const createAlarmWidget = (
  construct: Construct,
  alarmName: string,
  alarmArn: string
) => {
  const iAlarm = cloudwatch.Alarm.fromAlarmArn(
    construct,
    `IAlarm: ${alarmName}`,
    alarmArn
  );
  const alarmWidget = new cloudwatch.AlarmWidget({
    title: `${alarmName} alarm`,
    alarm: iAlarm,
  });
  return alarmWidget;
};
