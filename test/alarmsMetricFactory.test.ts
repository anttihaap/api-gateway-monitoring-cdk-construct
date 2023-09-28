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
              "(average_DELETE * sampleCount_DELETE + average_GET * sampleCount_GET + average_POST * sampleCount_POST + average_PUT * sampleCount_PUT + average_OPTIONS * sampleCount_OPTIONS) / (sampleCount_DELETE + sampleCount_GET + sampleCount_POST + sampleCount_PUT + sampleCount_OPTIONS)",
            Id: "m",
            ReturnData: true,
          },
          ...DEFAULT_METHODS.map((m) =>
            createMethodMetricMatcher(`average_${m}`, m, "Latency", "Average")
          ),
          ...DEFAULT_METHODS.map((m) =>
            createMethodMetricMatcher(
              `sampleCount_${m}`,
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
            Expression: "sum_DELETE + sum_GET + sum_POST + sum_PUT + sum_OPTIONS",
            Id: "m",
            ReturnData: true,
          },
          ...DEFAULT_METHODS.map((m) =>
            createMethodMetricMatcher(`sum_${m}`, m, "Count", "Sum")
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
              "(average_PATCH * sampleCount_PATCH + average_HEAD * sampleCount_HEAD) / (sampleCount_PATCH + sampleCount_HEAD)",
            Id: "m",
            ReturnData: true,
          },
          createMethodMetricMatcher(
            "average_PATCH",
            "PATCH",
            "Latency",
            "Average"
          ),
          createMethodMetricMatcher(
            "average_HEAD",
            "HEAD",
            "Latency",
            "Average"
          ),
          createMethodMetricMatcher(
            "sampleCount_PATCH",
            "PATCH",
            "Latency",
            "SampleCount"
          ),
          createMethodMetricMatcher(
            "sampleCount_HEAD",
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
            Expression: "sum_PATCH + sum_HEAD",
            Id: "m",
            ReturnData: true,
          },
          createMethodMetricMatcher(`sum_PATCH`, "PATCH", "5XXError", "Sum"),
          createMethodMetricMatcher(`sum_HEAD`, "HEAD", "5XXError", "Sum"),
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
