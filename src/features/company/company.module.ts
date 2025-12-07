import { ModuleFactory } from "../../permissions";
import { Company } from ".";

export const CompanyModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/companies",
    name: "companies",
    model: Company,
    moduleId: "f9e77c8f-bfd1-4fd4-80b0-e1d891ab7113",
  });
