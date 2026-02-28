import type { TutorialStep } from "./types";
import { steps as gettingStarted } from "./getting-started";
import { steps as variablesAndTypes } from "./variables-and-types";
import { steps as fmtPackage } from "./fmt-package";
import { steps as controlFlow } from "./control-flow";
import { steps as loops } from "./loops";
import { steps as arraysAndSlices } from "./arrays-and-slices";
import { steps as maps } from "./maps";
import { steps as functions } from "./functions";
import { steps as pointers } from "./pointers";
import { steps as structs } from "./structs";
import { steps as methods } from "./methods";
import { steps as interfaces } from "./interfaces";
import { steps as errorHandling } from "./error-handling";
import { steps as packagesAndModules } from "./packages-and-modules";
import { steps as concurrency } from "./concurrency";

export const allSteps: Record<string, TutorialStep[]> = {
  "getting-started": gettingStarted,
  "variables-and-types": variablesAndTypes,
  "fmt-package": fmtPackage,
  "control-flow": controlFlow,
  loops: loops,
  "arrays-and-slices": arraysAndSlices,
  maps: maps,
  functions: functions,
  pointers: pointers,
  structs: structs,
  methods: methods,
  interfaces: interfaces,
  "error-handling": errorHandling,
  "packages-and-modules": packagesAndModules,
  concurrency: concurrency,
};

export type { TutorialStep };
