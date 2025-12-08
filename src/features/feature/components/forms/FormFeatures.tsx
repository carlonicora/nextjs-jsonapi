// "use client";

// import { FeatureInterface, ModuleInterface } from "@carlonicora/nextjs-jsonapi/features";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
//   Checkbox,
//   FormLabel,
//   FormMessage,
// } from "@carlonicora/nextjs-jsonapi/shadcnui";

// type FormFeaturesProps = {
//   form: any;
//   name?: string;
//   features: FeatureInterface[];
//   featureField?: string;
//   moduleField?: string;
// };

// export function FormFeatures({
//   form,
//   name,
//   features,
//   featureField = "featureIds",
//   moduleField = "moduleIds",
// }: FormFeaturesProps) {
//   const selectedFeatures: string[] = form.watch(featureField);
//   const selectedModules: string[] = form.watch(moduleField);

//   const toggleFeature = (feature: FeatureInterface, checked: boolean) => {
//     let newFeatureIds = [...selectedFeatures];
//     let newModuleIds = [...selectedModules];

//     if (checked) {
//       if (!newFeatureIds.includes(feature.id)) {
//         newFeatureIds.push(feature.id);
//       }
//       feature.modules.forEach((module) => {
//         if (!newModuleIds.includes(module.id)) {
//           newModuleIds.push(module.id);
//         }
//       });
//     } else {
//       newFeatureIds = newFeatureIds.filter((id) => id !== feature.id);
//       feature.modules.forEach((module) => {
//         newModuleIds = newModuleIds.filter((id) => id !== module.id);
//       });
//     }
//     form.setValue(featureField, newFeatureIds);
//     form.setValue(moduleField, newModuleIds);
//   };

//   const toggleModule = (feature: FeatureInterface, module: ModuleInterface, checked: boolean) => {
//     const modulesForFeature = feature.modules.map((m) => m.id);
//     let newModuleIds = [...selectedModules];

//     if (checked) {
//       if (!selectedFeatures.includes(feature.id)) {
//         newModuleIds = newModuleIds.filter((id) => !modulesForFeature.includes(id));
//         newModuleIds.push(module.id);
//         form.setValue(featureField, [...selectedFeatures, feature.id]);
//       } else {
//         if (!newModuleIds.includes(module.id)) {
//           newModuleIds.push(module.id);
//         }
//       }
//     } else {
//       newModuleIds = newModuleIds.filter((id) => id !== module.id);
//       const remaining = feature.modules.filter((m) => newModuleIds.includes(m.id));
//       if (remaining.length === 0) {
//         form.setValue(
//           featureField,
//           selectedFeatures.filter((id) => id !== feature.id),
//         );
//       }
//     }
//     form.setValue(moduleField, newModuleIds);
//   };

//   const isFeatureChecked = (feature: FeatureInterface) =>
//     selectedFeatures.includes(feature.id) || feature.modules.every((module) => selectedModules.includes(module.id));

//   return (
//     <div className="flex w-full flex-col">
//       {name && <h2 className="mb-5 font-semibold">{name}</h2>}
//       {features.map((feature) => (
//         <Accordion
//           key={feature.id}
//           type="single"
//           collapsible
//           // className={`w-full p-0 ${feature.modules.filter((module) => !module.isCore).length === 0 ? "border-t" : ""}`}
//           className={`w-full p-0`}
//         >
//           <AccordionItem value={feature.id} className="p-0">
//             <div
//               className={`flex items-center justify-between p-0 ${feature.modules.filter((module) => !module.isCore).length === 0 ? "py-4" : ""}`}
//             >
//               <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
//                 <Checkbox
//                   id={feature.id}
//                   checked={isFeatureChecked(feature)}
//                   onCheckedChange={(val) => {
//                     toggleFeature(feature, val === true);
//                   }}
//                 />
//                 <FormLabel htmlFor={feature.id} className="ml-3 cursor-pointer font-normal">
//                   {feature.name}
//                 </FormLabel>
//               </div>
//               {feature.modules.filter((module) => !module.isCore).length > 0 && (
//                 <AccordionTrigger asChild>
//                   <div className="w-full"></div>
//                 </AccordionTrigger>
//               )}
//             </div>
//             {feature.modules.filter((module) => !module.isCore).length > 0 && (
//               <AccordionContent className="pl-6">
//                 {feature.modules
//                   .filter((module) => !module.isCore)
//                   .sort((a: ModuleInterface, b: ModuleInterface) => a.name.localeCompare(b.name))
//                   .map((module: ModuleInterface) => (
//                     <div
//                       key={module.id}
//                       className="flex items-center border-t py-2"
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <Checkbox
//                         id={module.id}
//                         checked={selectedModules.includes(module.id)}
//                         onCheckedChange={(val) => {
//                           toggleModule(feature, module, val === true);
//                         }}
//                       />
//                       <FormLabel htmlFor={module.id} className="ml-3 cursor-pointer font-normal">
//                         {module.name}
//                       </FormLabel>
//                     </div>
//                   ))}
//               </AccordionContent>
//             )}
//           </AccordionItem>
//         </Accordion>
//       ))}
//       <FormMessage />
//     </div>
//   );
// }
