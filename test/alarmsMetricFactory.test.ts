import * as cdk from "aws-cdk-lib";
import { Match } from "aws-cdk-lib/assertions";
import {
  createMonitoringStackTemplate,
  createMethodMetricMatcher,
} from "./utils";
import { DEFAULT_METHODS } from "../utils/defaultSettings";
import { Method } from "../lib/types";

describe("Alarm metric factory", () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  describe("defaults", () => {
    test("should create multi method weighted average alarm using default methods when no methods specified", () => {
      const template = createMonitoringStackTemplate(stack, {
        alarms: [{ metric: "Latency", resource: "dummy" }],
      });
      template.hasResourceProperties("AWS::CloudWatch::Alarm", {
        Metrics: [
          Match.anyValue(),
          {
            Expression:
              "(Average_DELETE * SampleCount_DELETE + Average_GET * SampleCount_GET + Average_POST * SampleCount_POST + Average_PUT * SampleCount_PUT + Average_OPTIONS * SampleCount_OPTIONS) / (SampleCount_DELETE + SampleCount_GET + SampleCount_POST + SampleCount_PUT + SampleCount_OPTIONS)",
            Id: "m",
            ReturnData: true,
          },
          ...DEFAULT_METHODS.map((m) =>
            createMethodMetricMatcher(`Average_${m}`, m, "Latency", "Average")
          ),
          ...DEFAULT_METHODS.map((m) =>
            createMethodMetricMatcher(
              `SampleCount_${m}`,
              m,
              "Latency",
              "SampleCount"
            )
          ),
        ],
      });
    });

    test("should create multi method sum alarm using default methods when no methods specified", () => {
      const template = createMonitoringStackTemplate(stack, {
        alarms: [{ metric: "Count", resource: "dummy" }],
      });
      template.hasResourceProperties("AWS::CloudWatch::Alarm", {
        Metrics: [
          Match.anyValue(),
          {
            Expression: "Sum_DELETE + Sum_GET + Sum_POST + Sum_PUT + Sum_OPTIONS",
            Id: "m",
            ReturnData: true,
          },
          ...DEFAULT_METHODS.map((m) =>
            createMethodMetricMatcher(`Sum_${m}`, m, "Count", "Sum")
          ),
        ],
      });
    });
  });

  describe("alarm props", () => {
    test("should create multi method weighted average alarm using alarm props when alarm has methods", () => {
      const alarmMethods: Method[] = ["PATCH", "HEAD"];
      const template = createMonitoringStackTemplate(stack, {
        alarms: [
          { metric: "Latency", resource: "dummy", methods: alarmMethods },
        ],
      });
      template.hasResourceProperties("AWS::CloudWatch::Alarm", {
        Metrics: [
          Match.anyValue(),
          {
            Expression:
              "(Average_PATCH * SampleCount_PATCH + Average_HEAD * SampleCount_HEAD) / (SampleCount_PATCH + SampleCount_HEAD)",
            Id: "m",
            ReturnData: true,
          },
          createMethodMetricMatcher(
            "Average_PATCH",
            "PATCH",
            "Latency",
            "Average"
          ),
          createMethodMetricMatcher(
            "Average_HEAD",
            "HEAD",
            "Latency",
            "Average"
          ),
          createMethodMetricMatcher(
            "SampleCount_PATCH",
            "PATCH",
            "Latency",
            "SampleCount"
          ),
          createMethodMetricMatcher(
            "SampleCount_HEAD",
            "HEAD",
            "Latency",
            "SampleCount"
          ),
        ],
      });
    });

    test("should create multi method sum alarm using alarm props when alarm has methods", () => {
      const alarmMethods: Method[] = ["PATCH", "HEAD"];
      const template = createMonitoringStackTemplate(stack, {
        alarms: [
          { metric: "5XXError", resource: "dummy", methods: alarmMethods },
        ],
      });
      template.hasResourceProperties("AWS::CloudWatch::Alarm", {
        Metrics: [
          Match.anyValue(),
          {
            Expression: "Sum_PATCH + Sum_HEAD",
            Id: "m",
            ReturnData: true,
          },
          createMethodMetricMatcher(`Sum_PATCH`, "PATCH", "5XXError", "Sum"),
          createMethodMetricMatcher(`Sum_HEAD`, "HEAD", "5XXError", "Sum"),
        ],
      });
    });

    test("should create one method alarm when method one method specified in alarm", () => {
      const template = createMonitoringStackTemplate(stack, {
        alarms: [{ metric: "Latency", resource: "dummy", methods: "GET" }],
      });
      template.hasResourceProperties("AWS::CloudWatch::Alarm", {
        Metrics: [
          Match.anyValue(),
          createMethodMetricMatcher("m", "GET", "Latency", "Average", true),
        ],
      });
    });

    test("should create one method alarm using latencyStatistics when method one method and latencyStatistics specified in alarm", () => {
      const template = createMonitoringStackTemplate(stack, {
        alarms: [
          {
            metric: "Latency",
            resource: "dummy",
            methods: "GET",
            latencyMetricStatistic: "p95",
          },
        ],
      });
      template.hasResourceProperties("AWS::CloudWatch::Alarm", {
        Metrics: [
          Match.anyValue(),
          createMethodMetricMatcher("m", "GET", "Latency", "p95", true),
        ],
      });
    });
  });
});
