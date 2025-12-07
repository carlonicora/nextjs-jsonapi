import { ModuleFactory } from "../../permissions";
import { Module } from "./data";

export const ModuleModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/modules",
    name: "modules",
    model: Module,
    moduleId: "25ffd868-8341-4ca7-963b-6e1c56b03b1d",
  });
