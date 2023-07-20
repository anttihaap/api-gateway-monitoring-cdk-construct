import * as cdk from "aws-cdk-lib";
import { Match } from "aws-cdk-lib/assertions";
import {
  createArrayOfObjs,
  createArrayOfMatchAnyValue,
  createMonitoringStackTemplate,
  dummyAlarm,
  dummyMissingDataAlarm,
} from "./utils";

describe("Alarm factory", () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  describe("Alarms", () => {
    test("should create no alarms when no alarms specified", () => {
      const template = createMonitoringStackTemplate(stack, {});
      template.resourceCountIs("AWS::CloudWatch::Alarm", 0);
    });

    test("should create 3 alarms when 3 alarms specified", () => {
      const template = createMonitoringStackTemplate(stack, {
        alarms: [
          { metric: "Count", resource: "dummy" },
          { metric: "4XXError", resource: "dummy" },
          { metric: "5XXError", resource: "dummy" },
        ],
      });
      template.resourceCountIs("AWS::CloudWatch::Alarm", 3);
    });

    describe("evaluation", () => {
      test("should use defaults for evaluation when no evaluation specified", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy" }],
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          EvaluationPeriods: 1,
          DatapointsToAlarm: 1,
        });
      });

      test("should use alarmDefaults for evaluation when defined in alarmDefaults", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [dummyAlarm],
          alarmDefaults: {
            evaluation: { evaluationPeriods: 2, datapointsToAlarm: 3 },
          },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          EvaluationPeriods: 2,
          DatapointsToAlarm: 3,
        });
      });

      test("should use alarm evaluation when defined in alarm", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [
            {
              ...dummyAlarm,
              evaluation: { evaluationPeriods: 4, datapointsToAlarm: 5 },
            },
          ],
          alarmDefaults: {
            evaluation: { evaluationPeriods: 2, datapointsToAlarm: 3 },
          },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          EvaluationPeriods: 4,
          DatapointsToAlarm: 5,
        });
      });
    });

    describe("period", () => {
      test("should use default period when no period is given", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy" }],
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          Metrics: [
            Match.anyValue(),
            Match.anyValue(),
            ...createArrayOfObjs(5, { MetricStat: { Period: 60 * 5 } }),
          ],
        });
      });

      test("should use alarmDefault period when defined in alarmDefaults", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [dummyAlarm],
          alarmDefaults: {
            period: 60 * 1,
          },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          Metrics: [
            Match.anyValue(),
            Match.anyValue(),
            ...createArrayOfObjs(5, { MetricStat: { Period: 60 * 1 } }),
          ],
        });
      });

      test("should use alarm period when defined in alarm", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [
            {
              ...dummyAlarm,
              period: 60 * 2,
            },
          ],
          alarmDefaults: {
            period: 60 * 1,
          },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          Metrics: [
            Match.anyValue(),
            Match.anyValue(),
            ...createArrayOfObjs(5, { MetricStat: { Period: 60 * 2 } }),
          ],
        });
      });
    });

    describe("number of standard deviations", () => {
      test("should use default nStds when no nStds is given", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy" }],
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          Metrics: [
            {
              Expression: "ANOMALY_DETECTION_BAND(m, 3)",
              Id: "ad",
            },
            ...createArrayOfMatchAnyValue(6),
          ],
        });
      });

      test("should use alarmDefaults nStds when defined in alarmDefaults", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy" }],
          alarmDefaults: { nStds: 10 },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          Metrics: [
            {
              Expression: "ANOMALY_DETECTION_BAND(m, 10)",
              Id: "ad",
            },
            ...createArrayOfMatchAnyValue(6),
          ],
        });
      });

      test("should use alarm nStds when defined in alarm props", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy", nStds: 5 }],
          alarmDefaults: { nStds: 10 },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          Metrics: [
            {
              Expression: "ANOMALY_DETECTION_BAND(m, 5)",
              Id: "ad",
            },
            ...createArrayOfMatchAnyValue(6),
          ],
        });
      });
    });

    describe("treat missing data", () => {
      test("should use default treat missing data settings when no setting is given", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy" }],
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          TreatMissingData: "notBreaching",
        });
      });

      test("should use alarmDefault treat missing data settings when specified in alarmDefaults", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ metric: "5XXError", resource: "dummy" }],
          alarmDefaults: { treatMissingData: "breaching" },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          TreatMissingData: "breaching",
        });
      });

      test("should use alarm treat missing data settings when defined in alarm", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [
            {
              metric: "5XXError",
              resource: "dummy",
              treatMissingData: "ignore",
            },
          ],
          alarmDefaults: { treatMissingData: "breaching" },
        });
        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          TreatMissingData: "ignore",
        });
      });
    });

    describe("enabled", () => {
      test("should not contain alarm action when not specified", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [dummyAlarm],
        });

        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          AlarmActions: [],
        });
      });

      test("should contain alarm action when alarm enabled", () => {
        const template = createMonitoringStackTemplate(stack, {
          alarms: [{ ...dummyAlarm, enabled: true }],
        });

        template.hasResourceProperties("AWS::CloudWatch::Alarm", {
          AlarmActions: [Match.anyValue()],
        });
      });
    });
  });

  describe("Missing alarms", () => {
    describe("Missing data points alarms", () => {
      test("should create 3 missing alarms when providing 3 missing alarms in props", () => {
        const template = createMonitoringStackTemplate(stack, {
          missingDataAlarms: [
            {
              resource: "dummy",
            },
            {
              resource: "dummy2",
            },
            {
              resource: "dummy3",
            },
          ],
        });
        template.resourceCountIs("AWS::CloudWatch::Alarm", 3);
      });

      // TODO THESE
      describe("evaluation", () => {
        test("should use default evaluation when no evaluation is given", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [dummyMissingDataAlarm],
          });
          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            EvaluationPeriods: 1,
            DatapointsToAlarm: 1,
          });
        });

        test("should use alarm defaults evaluation when defined in alarm defaults", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [dummyMissingDataAlarm],
            alarmDefaults: {
              evaluation: { evaluationPeriods: 2, datapointsToAlarm: 3 },
            },
          });
          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            EvaluationPeriods: 2,
            DatapointsToAlarm: 3,
          });
        });

        test("should use alarm evaluation when defined in alarm props", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [
              {
                ...dummyMissingDataAlarm,
                evaluation: {
                  evaluationPeriods: 4,
                  datapointsToAlarm: 5,
                },
              },
            ],
            alarmDefaults: {
              evaluation: { evaluationPeriods: 2, datapointsToAlarm: 3 },
            },
          });
          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            EvaluationPeriods: 4,
            DatapointsToAlarm: 5,
          });
        });
      });

      describe("period", () => {
        test("should use default period when no period is given", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [dummyMissingDataAlarm],
          });
          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            Metrics: [
              Match.anyValue(),
              ...createArrayOfObjs(5, { MetricStat: { Period: 60 * 5 } }),
            ],
          });
        });

        test("should use alarm default period when defined in alarm defaults", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [dummyMissingDataAlarm],
            alarmDefaults: {
              period: 60 * 1,
            },
          });
          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            Metrics: [
              Match.anyValue(),
              ...createArrayOfObjs(5, { MetricStat: { Period: 60 * 1 } }),
            ],
          });
        });

        test("should use alarm period when defined in alarm props", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [{ ...dummyMissingDataAlarm, period: 60 * 2 }],
            alarmDefaults: {
              period: 60 * 1,
            },
          });
          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            Metrics: [
              Match.anyValue(),
              ...createArrayOfObjs(5, { MetricStat: { Period: 60 * 2 } }),
            ],
          });
        });
      });

      describe("enabled", () => {
        test("should not contain alarm action when alarm not enabled", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [dummyMissingDataAlarm],
          });

          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            AlarmActions: [],
          });
        });

        test("should contain alarm action when alarm enabled", () => {
          const template = createMonitoringStackTemplate(stack, {
            missingDataAlarms: [{ ...dummyMissingDataAlarm, enabled: true }],
          });

          template.hasResourceProperties("AWS::CloudWatch::Alarm", {
            AlarmActions: [Match.anyValue()],
          });
        });
      });
    });
  });
});
