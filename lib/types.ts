export type Metric = "5XXError" | "4XXError" | "Count" | "Latency";

export type Statistics = "Sum" | "Average" | "SampleCount";

export type LatencyStatistics =
  | "Average"
  | "Maximum"
  | "p99"
  | "p95"
  | "p90"
  | "p85"
  | "p80"
  | "p75"
  | "p70"
  | "p65"
  | "p60"
  | "p55"
  | "p50";

export type Method =
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT";

export type TreatMissingData =
  | "breaching"
  | "notBreaching"
  | "ignore"
  | "missing";

export interface Alarm {
  resource: string;
  metric: Metric;
  enabled?: boolean;
  methods?: Method[] | Method;
  period?: number;
  evaluation?: AlarmEvaluation;
  nStds?: number;
  treatMissingData?: TreatMissingData;
  latencyMetricStatistic?: LatencyStatistics;
}

export interface MissingDataAlarm {
  resource: string;
  enabled?: boolean;
  methods?: Method[] | Method;
  period?: number;
  evaluation?: AlarmEvaluation;
}

export interface MissingDataAlarmMetric {
  resource: string;
  methods: Method[] | Method;
  period: number;
}

export interface AlarmDefaults {
  enabled?: boolean;
  methods?: Method[];
  period?: number;
  evaluation?: AlarmEvaluation;
  nStds?: number;
  treatMissingData?: TreatMissingData;
}

interface AlarmMetricWithoutMethod {
  resource: string;
  metric: Metric;
  period: number;
  statistics: Statistics | LatencyStatistics;
}

export interface AlarmMetric extends AlarmMetricWithoutMethod {
  methods: Method[] | Method;
}

export interface AlarmMetricWithOneMethod extends AlarmMetricWithoutMethod {
  method: Method;
}

export interface AlarmMetricWithManyMethods extends AlarmMetricWithoutMethod {
  methods: Method[];
}

export interface ApiGateway {
  apiName: string;
  stage: string;
};

export interface AlarmEvaluation {
  evaluationPeriods: number;
  datapointsToAlarm: number;
};
