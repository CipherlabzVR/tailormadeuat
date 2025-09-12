import { Catelogue } from "./catelogue";

export const ReportURL1 = `https://report.openskylabz.com/api/report`;
export const ReportURL = `https://report.openskylabz.com/api/report/PrintDocumentsLocal?InitialCatalog=${Catelogue}`;
export const UploadShareURL = `https://report.openskylabz.com/api/report/PrintDocuments?InitialCatalog=${Catelogue}`;
export const CompanyReportURL = `https://report.openskylabz.com/api/report/PrintDocumentsSupplierDateLocal?InitialCatalog=${Catelogue}`;