import * as cdk from "aws-cdk-lib";
import { createMonitoringStackTemplate } from "./utils";
import { Method } from "../lib/types";

const sixMethods: Method[] = [
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
];

describe("Alarm validaton", () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  describe("latency methods", () => {
    test("should throw error when using latencyStatistics with no methods specified", () => {
      expect(() => {
        createMonitoringStackTemplate(stack, {
          alarms: [
            {
              metric: "Latency",
              resource: "dummy",
              latencyMetricStatistic: "p50",
            },
          ],
        });
      }).toThrowError(
        "The latencyStatistics can be used with one Method."
      );
    });

    test("should throw error when using latencyStatistics with alarmDefaults contain over 5 methods", () => {
      expect(() => {
        createMonitoringStackTemplate(stack, {
          alarms: [
            {
              metric: "Latency",
              resource: "dummy",
              latencyMetricStatistic: "p50",
            },
          ],
          alarmDefaults: {
            methods: sixMethods,
          },
        });
      }).toThrowError(
        "Methods can be of length 5 or less when using Latency statistics"
      );
    });

    test("should throw error when using Latency metric when alarm contains over 5 methods", () => {
      expect(() => {
        createMonitoringStackTemplate(stack, {
          alarms: [
            {
              metric: "Latency",
              resource: "dummy",
              latencyMetricStatistic: "p50",
              methods: sixMethods,
            },
          ],
        });
      }).toThrowError(
        "Methods can be of length 5 or less when using Latency statistics"
      );
    });
  });

  describe("latencyStatistics", () => {
    test("should not throw error when latencyStatistics is used correctly and alarm defaults has multiple methods", () => {
      createMonitoringStackTemplate(stack, {
        alarms: [
          {
            metric: "Latency",
            resource: "dummy",
            methods: "GET",
            latencyMetricStatistic: "p50",
          },
        ],
        alarmDefaults: {
          methods: ["DELETE", "GET"],
        },
      });
    });

    test("should throw error when latencyStatistics is used without specifying methods", () => {
      expect(() => {
        createMonitoringStackTemplate(stack, {
          alarms: [
            {
              metric: "Latency",
              resource: "dummy",
              latencyMetricStatistic: "p50",
            },
          ],
        });
      }).toThrowError("The latencyStatistics can be used with one Method.");
    });

    test("should throw error when latencyStatistics is used with alarmDefaults using multiple methods", () => {
      expect(() => {
        createMonitoringStackTemplate(stack, {
          alarmDefaults: {
            methods: ["DELETE", "GET"],
          },
          alarms: [
            {
              metric: "Latency",
              resource: "dummy",
              latencyMetricStatistic: "p50",
            },
          ],
        });
      }).toThrowError("The latencyStatistics can be used with one Method.");
    });

    test("should throw error when latencyStatistics is used with multiple alarm methods", () => {
      expect(() => {
        createMonitoringStackTemplate(stack, {
          alarms: [
            {
              metric: "Latency",
              resource: "dummy",
              latencyMetricStatistic: "p50",
              methods: ["DELETE", "GET"],
            },
          ],
        });
      }).toThrowError("The latencyStatistics can be used with one Method.");
    });
  });
});
