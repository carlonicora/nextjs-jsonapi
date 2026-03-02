// Data layer
export * from "./data";

// Hooks
export { useRbacState } from "./hooks/useRbacState";

// Utils
export { generateMigrationFile, downloadMigrationFile } from "./utils/RbacMigrationGenerator";

// Components
export { RbacContainer } from "./components/RbacContainer";
export { RbacToolbar } from "./components/RbacToolbar";
export { RbacFeatureSection } from "./components/RbacFeatureSection";
export { RbacModuleTable } from "./components/RbacModuleTable";
export { RbacPermissionCell } from "./components/RbacPermissionCell";
export { RbacPermissionPicker } from "./components/RbacPermissionPicker";

// Module registrations
export { PermissionMappingModule, ModulePathsModule } from "./rbac.module";
