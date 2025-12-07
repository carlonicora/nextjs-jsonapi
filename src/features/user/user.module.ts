import { User } from "./data/user";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";

export const UserModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/users",
    name: "users",
    model: User,
    moduleId: "04cfc677-0fd2-4f5e-adf4-2483a00c0277",
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("users", [`name`, `email`, `avatar`, `title`]),
          createJsonApiInclusion("usertopics", [`level`]),
          createJsonApiInclusion("userexpertises", [`level`]),
          createJsonApiInclusion("topics", [`name`]),
        ],
      },
    },
  });
