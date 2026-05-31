import type { BirthInput } from "@numerology/engine";

export type Calendar = "solar" | "lunar";

/** 表单产出的出生信息:阳历 BirthInput,外加历法标记(农历时由服务端转阳历)。 */
export type BirthFormValue = BirthInput & {
  calendar?: Calendar;
  isLeapMonth?: boolean;
};
