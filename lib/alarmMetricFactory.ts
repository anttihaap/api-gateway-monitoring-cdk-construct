import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import {
  AlarmMetric,
  AlarmMetricWithManyMethods,
  AlarmMetricWithOneMethod,
  ApiGateway,
  MissingDataAlarmMetric,
} from "./types";

const alarmMetrics = (apiGateway: ApiGateway) => {
  const createMethodMetricDataQueryProperty = (
    id: string,
    returnData: boolean,
    alarmMetricWithOneMethod: AlarmMetricWithOneMethod
  ) => {
    const { method, metric, period, resource, statistics } =
      alarmMetricWithOneMethod;
    return {
      id,
      returnData,
      metricStat: {
        metric: {
          namespace: "AWS/ApiGateway",
          metricName: metric,
          dimensions: [
            {
              name: "ApiName",
              value: apiGateway.apiName,
            },
            {
              name: "Resource",
              value: resource,
            },
            {
              name: "Stage",
              value: apiGateway.stage,
            },
            {
              name: "Method",
              value: method,
            },
          ],
        },
        period,
        stat: statistics,
      },
    };
  };

  const createAdbMetric = (
    adbMetricId: string,
    evaluationMetricId: string,
    numberOfStds: number
  ): cloudwatch.CfnAlarm.MetricDataQueryProperty => ({
    expression: `ANOMALY_DETECTION_BAND(${evaluationMetricId}, ${numberOfStds})`,
    id: adbMetricId,
  });

  const createAlarmMetricsForSum = (
    alarmMetric: AlarmMetricWithManyMethods,
    alarmNStds: number
  ): {
    thresholdMetricId: string;
    metrics: cloudwatch.CfnAlarm.MetricDataQueryProperty[];
  } => {
    const { methods, ...alarmMetricPropsWithoutMethod } = alarmMetric;

    const sumMethodMetrics = methods.map((method) =>
      createMethodMetricDataQueryProperty(`Sum_${method}`, false, {
        ...alarmMetricPropsWithoutMethod,
        method,
        statistics: "Sum",
      })
    );

    const thresholdMetricId = "ad";

    const metrics = [
      createAdbMetric(thresholdMetricId, "m", alarmNStds),
      {
        id: "m",
        returnData: true,
        expression: `${methods.map((method) => `Sum_${method}`).join(" + ")}`,
      },
      ...sumMethodMetrics,
    ];

    return { thresholdMetricId, metrics };
  };

  const createAlarmMetricsForWeightedAvg = (
    alarmMetricProps: AlarmMetricWithManyMethods,
    alarmNStds: number
  ): {
    thresholdMetricId: string;
    metrics: cloudwatch.CfnAlarm.MetricDataQueryProperty[];
  } => {
    const alamThresholdMetricId = "ad";
    const alarmEvaluationMetricId = "m";

    const { methods, ...alarmMetricPropsWithoutMethods } = alarmMetricProps;

    const avgMethodMetrics = methods.map((method) =>
      createMethodMetricDataQueryProperty(`Average_${method}`, false, {
        ...alarmMetricPropsWithoutMethods,
        method,
        statistics: "Average",
      })
    );

    const countMethodMetrics = methods.map((method) =>
      createMethodMetricDataQueryProperty(`SampleCount_${method}`, false, {
        ...alarmMetricPropsWithoutMethods,
        method,
        statistics: "SampleCount",
      })
    );

    const metrics = [
      createAdbMetric(
        alamThresholdMetricId,
        alarmEvaluationMetricId,
        alarmNStds
      ),
      {
        id: alarmEvaluationMetricId,
        returnData: true,
        expression: `(${methods
          .map((method) => `Average_${method} * SampleCount_${method}`)
          .join(" + ")}) / (${methods
          .map((method) => `SampleCount_${method}`)
          .join(" + ")})`,
      },
      ...avgMethodMetrics,
      ...countMethodMetrics,
    ];

    return { metrics, thresholdMetricId: alamThresholdMetricId };
  };

  const createAlarmMetricsForResourceMissingData = (
    alarmMetricProps: MissingDataAlarmMetric
  ) => {
    const { methods: methodsOrMethod, ...alarmMetricPropsWithoutMethods } =
      alarmMetricProps;

    if (Array.isArray(methodsOrMethod)) {
      const methods = methodsOrMethod;
      return [
        {
          id: "m",
          returnData: true,
          expression: methods.map((m) => `count${m}`).join(" + "),
        },
        ...methods.map((m) =>
          createMethodMetricDataQueryProperty(`count${m}`, false, {
            ...alarmMetricPropsWithoutMethods,
            metric: "Count",
            statistics: "SampleCount",
            method: m,
          })
        ),
      ];
    } else {
      const method = methodsOrMethod;
      return [
        createMethodMetricDataQueryProperty("m", true, {
          ...alarmMetricPropsWithoutMethods,
          metric: "Count",
          statistics: "SampleCount",
          method,
        }),
      ];
    }
  };

  const createAlarmMetricsForMultipleMethods = (
    alarmMetricProps: AlarmMetricWithManyMethods,
    alarmNStds: number
  ): {
    thresholdMetricId: string;
    metrics: cloudwatch.CfnAlarm.MetricDataQueryProperty[];
  } =>
    alarmMetricProps.metric === "Latency"
      ? createAlarmMetricsForWeightedAvg(alarmMetricProps, alarmNStds)
      : createAlarmMetricsForSum(alarmMetricProps, alarmNStds);

  const createAlarmMetricsForSingleMethods = (
    alarmMetricProps: AlarmMetricWithOneMethod,
    alarmNStds: number
  ): {
    thresholdMetricId: string;
    metrics: cloudwatch.CfnAlarm.MetricDataQueryProperty[];
  } => {
    const alarmEvaluationMetricId = "m";
    const thresholdMetricId = "ad";

    const metrics = [
      createAdbMetric(thresholdMetricId, alarmEvaluationMetricId, alarmNStds),
      createMethodMetricDataQueryProperty(
        alarmEvaluationMetricId,
        true,
        alarmMetricProps
      ),
    ];
    return {
      thresholdMetricId,
      metrics,
    };
  };

  const createAlarmMetrics = (
    alarmMetric: AlarmMetric,
    alarmNStds: number
  ): {
    thresholdMetricId: string;
    metrics: cloudwatch.CfnAlarm.MetricDataQueryProperty[];
  } => {
    const { methods: methodsOrMethod, ...alarmMetricPropsWithoutMethods } =
      alarmMetric;

    return Array.isArray(methodsOrMethod)
      ? createAlarmMetricsForMultipleMethods(
          { ...alarmMetricPropsWithoutMethods, methods: methodsOrMethod },
          alarmNStds
        )
      : createAlarmMetricsForSingleMethods(
          { ...alarmMetricPropsWithoutMethods, method: methodsOrMethod },
          alarmNStds
        );
  };

  return {
    createMethodMetricDataQueryProperty,
    createAlarmMetricsForResourceMissingData,
    createAlarmMetrics,
  };
};

export default alarmMetrics;
