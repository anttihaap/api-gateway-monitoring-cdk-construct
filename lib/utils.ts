import {
  DEFAULT_ALARM_EVALUATION,
  DEFAULT_ALARM_PERIOD,
  DEFAULT_METHODS,
  DEFAULT_N_STDS,
  DEFAULT_TREAT_MISSING_DATA,
} from "../utils/defaultSettings";
import {
  AlarmDefaults,
  AlarmEvaluation,
  Alarm,
  MissingDataAlarmMetric,
  MissingDataAlarm,
  AlarmMetric,
} from "./types";

export const parseMissingDataAlarmToMissingDataAlarmMetric = (
  alarmProps: MissingDataAlarm,
  alarmDefaults?: AlarmDefaults
): MissingDataAlarmMetric => ({
  resource: alarmProps.resource,
  methods: alarmProps.methods ?? alarmDefaults?.methods ?? DEFAULT_METHODS,
  period: alarmProps.period ?? alarmDefaults?.period ?? DEFAULT_ALARM_PERIOD,
});

const alarmMethodsValidation = (
  alarm: Alarm,
  alarmDefaults?: AlarmDefaults
) => {
  const methodsSpecifiedUsed = alarm.methods ?? alarmDefaults?.methods;
  if (!methodsSpecifiedUsed) return;
  if (!Array.isArray(methodsSpecifiedUsed)) return;

  if (alarm.metric === "Latency" && methodsSpecifiedUsed.length > 5)
    throw new Error(
      "Methods can be of length 5 or less when using Latency statistics."
    );
};

const latencyStatisticsValidation = (
  alarm: Alarm,
  alarmDefaults?: AlarmDefaults
) => {
  const latencyUsed = alarm.metric === "Latency";
  const latencyStatisticsUsed = alarm.latencyMetricStatistic !== undefined;
  if (!latencyUsed) {
    if (latencyStatisticsUsed) {
      throw new Error(
        "The latencyStatistics can only be used with the Latency metric."
      );
    }
    return
  }

  const methodsSpecifiedUsed = alarm.methods ?? alarmDefaults?.methods ?? DEFAULT_METHODS;

  if (latencyStatisticsUsed && Array.isArray(methodsSpecifiedUsed)) {
    throw new Error("The latencyStatistics can be used with one Method.");
  }
};

export const parseWithValidationAlarmToAlarmMetric = (
  alarm: Alarm,
  alarmDefaults?: AlarmDefaults
): AlarmMetric => {
  alarmMethodsValidation(alarm, alarmDefaults);
  latencyStatisticsValidation(alarm, alarmDefaults);

  return {
    resource: alarm.resource,
    metric: alarm.metric,
    statistics: alarm.latencyMetricStatistic
      ? alarm.latencyMetricStatistic
      : alarm.metric === "Latency"
      ? "Average"
      : "Sum",
    methods: alarm.methods ?? alarmDefaults?.methods ?? DEFAULT_METHODS,
    period: alarm.period ?? alarmDefaults?.period ?? DEFAULT_ALARM_PERIOD,
  };
};

export const parseNStds = (alarmProps: Alarm, alarmDefaults?: AlarmDefaults) =>
  alarmProps.nStds ?? alarmDefaults?.nStds ?? DEFAULT_N_STDS;

export const parseEvaluation = (
  alarmProps: Alarm | MissingDataAlarm,
  alarmDefaults?: AlarmDefaults
): AlarmEvaluation =>
  alarmProps.evaluation ??
  alarmDefaults?.evaluation ??
  DEFAULT_ALARM_EVALUATION;

export const parseTreatMissingData = (
  alarmProps: Alarm,
  alarmDefaults?: AlarmDefaults
) =>
  alarmProps.treatMissingData ??
  alarmDefaults?.treatMissingData ??
  DEFAULT_TREAT_MISSING_DATA;
