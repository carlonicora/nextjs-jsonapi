"use client";

import { Checkbox, FormLabel, FormMessage, ScrollArea } from "../../../../shadcnui";
import { FeatureInterface } from "../../data";

type FormFeaturesProps = {
  form: any;
  name?: string;
  features: FeatureInterface[];
  featureField?: string;
};

export function FormFeatures({ form, name, features, featureField = "featureIds" }: FormFeaturesProps) {
  const selectedFeatures: string[] = form.watch(featureField);

  const toggleFeature = (feature: FeatureInterface, checked: boolean) => {
    let newFeatureIds = [...selectedFeatures];

    if (checked) {
      if (!newFeatureIds.includes(feature.id)) {
        newFeatureIds.push(feature.id);
      }
    } else {
      newFeatureIds = newFeatureIds.filter((id) => id !== feature.id);
    }
    form.setValue(featureField, newFeatureIds);
  };

  const isFeatureChecked = (feature: FeatureInterface) => selectedFeatures.includes(feature.id);

  return (
    <div className="flex w-full flex-col">
      {name && <h2 className="mb-4 border-b text-lg font-semibold">{name}</h2>}
      <ScrollArea className="h-[40vh]">
        <div className="flex flex-col gap-y-2 pr-4">
          {features
            .filter((feature) => !feature.isCore)
            .map((feature) => (
              <div key={feature.id} className="flex items-center">
                <Checkbox
                  id={feature.id}
                  checked={isFeatureChecked(feature)}
                  onCheckedChange={(val) => {
                    toggleFeature(feature, val === true);
                  }}
                />
                <FormLabel htmlFor={feature.id} className="ml-3 cursor-pointer font-normal">
                  {feature.name}
                </FormLabel>
              </div>
            ))}
        </div>
      </ScrollArea>
      <FormMessage />
    </div>
  );
}
