import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const generic = [
    { agency:"generic", key:"Significance", weight:1.2, guidance:"Impact & problem clarity" },
    { agency:"generic", key:"Innovation", weight:1.0, guidance:"Novelty & differentiation" },
    { agency:"generic", key:"Approach", weight:1.4, guidance:"Method, risks, milestones" },
    { agency:"generic", key:"Team/PI", weight:0.8, guidance:"Qualifications & gaps" },
    { agency:"generic", key:"Commercialization", weight:1.6, guidance:"Path to revenue & market" }
  ];
  for (const r of generic) { await prisma.rubricCriterion.create({ data: r }); }
  console.log("Seeded rubric_criteria:", generic.length);
}

main().finally(() => prisma.$disconnect());
