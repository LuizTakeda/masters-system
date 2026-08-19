import { z } from "zod";

export const queryBoolean = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return val;
}, z.boolean());

export const queryNumber = z.preprocess((value) => {
  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number());