import type { StylesConfig } from "react-select";

export const reactSelectStyles: StylesConfig<unknown, false> = {
  control: (base) => ({
    ...base,
    minHeight: "40px",
    height: "40px",
    fontSize: "14px",
    borderColor: "#d1d5db",
    boxShadow: "none",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 12px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "40px",
  }),
};
