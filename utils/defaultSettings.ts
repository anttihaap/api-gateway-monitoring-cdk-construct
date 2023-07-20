import { AlarmEvaluation, Method, TreatMissingData } from "../lib/types";

export const DEFAULT_METHODS: Method[] = [
  "DELETE",
  "GET",
  "POST",
  "PUT",
  "OPTIONS",
];
export const DEFAULT_N_STDS: number = 3;
export const DEFAULT_ALARM_EVALUATION: AlarmEvaluation = {
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
};
export const DEFAULT_ALARM_PERIOD: number = 60 * 5;
export const DEFAULT_ALARM_ACTIONS_ENABLED: boolean = false;
export const DEFAULT_TREAT_MISSING_DATA: TreatMissingData = 'notBreaching'
