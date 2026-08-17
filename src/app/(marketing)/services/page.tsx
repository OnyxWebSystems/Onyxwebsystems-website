import { DigitalProducts } from "./_components/digital-products";
import { FinalCta } from "./_components/final-cta";
import { ServicesHero } from "./_components/hero";
import { HowWeWork } from "./_components/how-we-work";
import { ModuleWorkflow } from "./_components/module-workflow";
import { NotSure } from "./_components/not-sure";
import { OperatingSystem } from "./_components/operating-system";
import { ProjectIntake } from "./_components/project-intake";
import { WhatWeBuild } from "./_components/what-we-build";

export const metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <div>
      <ServicesHero />
      <WhatWeBuild />
      <OperatingSystem />
      <ModuleWorkflow />
      <DigitalProducts />
      <HowWeWork />
      <NotSure />
      <ProjectIntake />
      <FinalCta />
    </div>
  );
}
