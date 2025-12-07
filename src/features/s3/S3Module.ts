import { S3 } from "./data/S3";
import { ModuleFactory } from "../../permissions/types";

export const S3Module = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/s3",
    name: "s3",
    model: S3,
    moduleId: "db41ba46-e171-4324-8845-99353eba8568",
  });
