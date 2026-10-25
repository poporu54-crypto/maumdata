import React from "react";
import { getAllTemplateSummariesServer } from "@/lib/formSummaries";
import FormCatalogClient from "./FormCatalogClient";

export const revalidate = 3600;

export default async function DocsPage() {
  const summaries = await getAllTemplateSummariesServer();
  return <FormCatalogClient initialSummaries={summaries} />;
}
