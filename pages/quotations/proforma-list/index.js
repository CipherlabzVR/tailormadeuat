import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton, Box, Tabs, Tab, Button, Chip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Catelogue } from "Base/catelogue";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import { Report } from "Base/report";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { useRouter } from "next/router";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import RejectConfirmationById from "./reject";
import ConfirmInovoiceById from "./confirm";
import SentBack from "./sent-back";

export default function ProformaList() {
    const router = useRouter();
    const cId = sessionStorage.getItem("category");
    const { navigate, print, create, update } = IsPermissionEnabled(cId);
    const [quotationList, setQuotationList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const name = localStorage.getItem("name");
    const { data: InvoiceReportName } = GetReportSettingValueByName("ProformaInvoiceReport");

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(1);
        fetchQuotationList(1, value, pageSize, tabValue);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        fetchQuotationList(value, searchTerm, pageSize, tabValue);
    };

    const handlePageSizeChange = (event) => {
        const newSize = event.target.value;
        setPageSize(newSize);
        setPage(1);
        fetchQuotationList(1, searchTerm, newSize, tabValue);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
        setQuotationList([]);
        setTotalCount(0);
        // If switching away from pending tab, clear the removedInquiryId after a delay
        // This allows the backend to catch up
        if (tabValue === 0 && newValue !== 0) {
            setTimeout(() => {
                sessionStorage.removeItem("removedInquiryId");
            }, 2000);
        }
        fetchQuotationList(1, searchTerm, pageSize, newValue);
    };

    const navigateToCreate = () => {
        router.push({
            pathname: "/quotations/proforma-list/create",
        });
    };

    const navigateToEdit = (id) => {
        router.push({
            pathname: "/quotations/proforma-list/edit",
            query: { id: id }
        });
    };

    const fetchQuotationList = async (page = 1, search = "", size = pageSize, tab = tabValue) => {
        try {
            const token = localStorage.getItem("token");
            const skip = (page - 1) * size;
            // Tab mapping: 0=Pending(10), 1=Processing(12), 2=Sent(11), 3=Confirmed(3), 4=Rejected(6)
            const status = (tab === 0 ? 10 : tab === 1 ? 12 : tab === 2 ? 11 : tab === 3 ? 3 : tab === 4 ? 6 : null);

                const query = `${BASE_URL}/Inquiry/GetAllProformaInvoice?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&status=${status}`;
                const response = await fetch(query, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
            if (!response.ok) throw new Error("Failed to fetch items");
            const data = await response.json();
            let items = data.result?.items || data.result || [];
            let count = data.result?.totalCount || (Array.isArray(data.result) ? data.result.length : 0);
            
            // If on pending tab and we have a removed inquiry, filter it out immediately
            // This ensures the item is removed from UI even if backend hasn't updated yet
            // This is a temporary frontend filter - backend should handle permanent exclusion
            if (tab === 0) {
                const removedInquiryId = sessionStorage.getItem("removedInquiryId");
                if (removedInquiryId) {
                    const inquiryIdToRemove = parseInt(removedInquiryId);
                    const beforeFilter = items.length;
                    items = items.filter(item => {
                        // Filter by inquiryId - handle both string and number comparison
                        const itemInquiryId = typeof item.inquiryId === 'string' 
                            ? parseInt(item.inquiryId) 
                            : item.inquiryId;
                        return itemInquiryId !== inquiryIdToRemove;
                    });
                    // Adjust count if we filtered out an item
                    if (items.length < beforeFilter) {
                        count = Math.max(0, count - (beforeFilter - items.length));
                    }
                }
            }
            
            // Backend should handle filtering, but if items still appear after refresh,
            // it means they're not in ProformaInvoiceProcessing table - backend issue
            
            setQuotationList(Array.isArray(items) ? items : []);
            setTotalCount(count);

        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleMarkAsSent = async (invoiceId, inquiryId, warehouseId, e, skipPrint = false) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BASE_URL}/Inquiry/MarkProformaInvoiceAsSent?id=${invoiceId}`, {
                method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
            if (response.ok) {
                const data = await response.json();
                if (data.result?.statusCode === 200 || data.result?.message) {
                    // Refresh the current tab (Processing tab if called from WhatsApp, Pending if from Print)
                    const currentTab = skipPrint ? 1 : 0;
                    fetchQuotationList(1, searchTerm, pageSize, currentTab);
                    // Only open print window if not skipped (i.e., when called from Print button)
                    if (!skipPrint) {
                        // Validate required values
                        if (!invoiceId || !Report || !InvoiceReportName) {
                            console.error("Missing required values for print:", { invoiceId, Report, InvoiceReportName });
                            return;
                        }
                        // Use ProformaInvoice ID (invoiceId) as documentNumber for the report
                        const invoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${invoiceId}&reportName=${InvoiceReportName}&warehouseId=${warehouseId || 0}&currentUser=${name || ''}`;
                        const fullUrl = `${Report}${invoiceReportLink}`;
                        window.open(fullUrl, '_blank');
                    }
                    // If called from Processing tab, switch to Sent tab after marking as sent
                    if (skipPrint) {
                        setTimeout(() => {
                            setTabValue(2); // Switch to Sent tab
                            fetchQuotationList(1, searchTerm, pageSize, 2);
                        }, 500);
                    }
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        // Check if we're returning from create page
        const removedInquiryId = sessionStorage.getItem("removedInquiryId");
        if (removedInquiryId) {
            // Immediately remove from pending list if we're on pending tab (for instant visual feedback)
            const inquiryIdToRemove = parseInt(removedInquiryId);
            if (tabValue === 0) {
                // Filter immediately for instant visual feedback
                setQuotationList(prevList => {
                    if (prevList.length > 0) {
                        const filtered = prevList.filter(item => {
                            const itemInquiryId = typeof item.inquiryId === 'string' 
                                ? parseInt(item.inquiryId) 
                                : item.inquiryId;
                            return itemInquiryId !== inquiryIdToRemove;
                        });
                        if (filtered.length < prevList.length) {
                            setTotalCount(prev => Math.max(0, prev - (prevList.length - filtered.length)));
                        }
                        return filtered;
                    }
                    return prevList;
                });
            }
            // Refresh pending tab to get updated data (backend should exclude it via ProformaInvoiceProcessing table)
            fetchQuotationList(1, searchTerm, pageSize, 0);
            // Switch to Processing tab to show the newly created invoice
            setTimeout(() => {
                setTabValue(1);
                // Fetch processing tab data
                fetchQuotationList(1, searchTerm, pageSize, 1);
                // Clear sessionStorage after switching - backend should handle filtering now
                sessionStorage.removeItem("removedInquiryId");
            }, 500);
        } else {
            fetchQuotationList(1, searchTerm, pageSize, tabValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!navigate) {
        return <AccessDenied />;
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Proforma Invoice List</h1>
                <ul>
                    <li>
                        <Link href="/quotations/proforma-list/">Proforma Invoice List</Link>
                    </li>
                </ul>
            </div>
            <Grid container>
                <Grid item xs={12} lg={8} mb={1} order={{ xs: 2, lg: 1 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Pending" />
                        <Tab label="Processing" />
                        <Tab label="Sent" />
                        <Tab label="Confirmed" />
                        <Tab label="Rejected" />
                    </Tabs>
                </Grid>
                <Grid item xs={12} lg={4} mb={1} display="flex" alignItems="center" justifyContent="end" order={{ xs: 1, lg: 2 }}>
                    <Box>
                        <Button variant="outlined" onClick={() => navigateToCreate()}>
                            + Add New
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <Grid mt={1} container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
                <Grid item xs={12} lg={4}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search here.."
                            inputProps={{ "aria-label": "search" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </Search>
                </Grid>
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                            <Table aria-label="simple table" className="dark-table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invoice Date</TableCell>
                                        <TableCell>Customer Name</TableCell>
                                        <TableCell>Inquiry Code</TableCell>
                                        <TableCell>Style Name</TableCell>
                                        <TableCell>Total Amount</TableCell>
                                        <TableCell>Advance Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        {tabValue === 4 ? <TableCell align="right">Rejected Reason</TableCell> : <TableCell align="right">Action</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(() => {
                                        // Filter out removed inquiry from pending tab
                                        let displayList = quotationList;
                                        if (tabValue === 0) {
                                            const removedInquiryId = sessionStorage.getItem("removedInquiryId");
                                            if (removedInquiryId) {
                                                const inquiryIdToRemove = parseInt(removedInquiryId);
                                                displayList = quotationList.filter(item => {
                                                    const itemInquiryId = typeof item.inquiryId === 'string' 
                                                        ? parseInt(item.inquiryId) 
                                                        : item.inquiryId;
                                                    return itemInquiryId !== inquiryIdToRemove;
                                                });
                                            }
                                        }
                                        
                                        return displayList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8}>
                                                    <Typography color="error">No Invoice Available</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            displayList.map((item, index) => {
                                            // Validate required fields
                                            if (!item.inquiryId) {
                                                console.error("Missing inquiryId for item:", item);
                                                return null;
                                            }
                                            // Use PrintDocuments (uploads to S3) for WhatsApp
                                            // Use ProformaInvoice ID (item.id) as documentNumber - same as print button
                                            const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.id}&reportName=${InvoiceReportName}&warehouseId=${item.warehouseId || 0}&currentUser=${name || ''}`;
                                            // Use Local for browser print preview
                                            const invoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.id}&reportName=${InvoiceReportName}&warehouseId=${item.warehouseId || 0}&currentUser=${name || ''}`;
                                            
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                                                    <TableCell>{item.customerName}</TableCell>
                                                    <TableCell>{item.inquiryCode}</TableCell>
                                                    <TableCell>{item.styleName}</TableCell>
                                                    <TableCell>{formatCurrency(item.totalPayment)}</TableCell>
                                                    <TableCell>{formatCurrency(item.advancePayment)}</TableCell>
                                                    <TableCell>
                                                        {tabValue === 0 ? (
                                                            <Chip label="Pending" size="small" color="warning" />
                                                        ) : tabValue === 1 ? (
                                                            <Chip label="Processing" size="small" color="info" />
                                                        ) : tabValue === 2 ? (
                                                            <Chip label="Sent" size="small" color="info" />
                                                        ) : tabValue === 3 ? (
                                                            <Chip label="Confirmed" size="small" color="success" />
                                                        ) : (
                                                            <Chip label="Rejected" size="small" color="error" />
                                                        )}
                                                    </TableCell>
                                                    {tabValue === 4 ? (
                                                        <TableCell align="right">{item.rejectedReason || "No reason provided"}</TableCell>
                                                    ) : (
                                                        <TableCell align="right">
                                                        <Box display="flex" gap={2} justifyContent="end" flexWrap="wrap">
                                                                {update && tabValue === 0 ?
                                                                <SentBack id={item.inquiryId} fetchItems={fetchQuotationList} />
                                                                : ""}
                                                                {update && tabValue === 0 ?
                                                                    <Tooltip title="Edit" placement="top">
                                                                        <IconButton onClick={() => navigateToEdit(item.inquiryId)} aria-label="edit" size="small">
                                                                            <BorderColorIcon color="primary" fontSize="medium" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    : ""}
                                                            {print && tabValue === 0 ?
                                                                <Tooltip title="Print" placement="top">
                                                                    <IconButton
                                                                        aria-label="print"
                                                                        size="small"
                                                                        onClick={(e) => handleMarkAsSent(item.id, item.inquiryId, item.warehouseId, e)}
                                                                    >
                                                                        <LocalPrintshopIcon color="primary" fontSize="medium" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                : ""}

                                                            {/* WhatsApp / Print */}
                                                            <>
                                                                {tabValue === 1 || tabValue === 2 ? (
                                                                    <ShareReports 
                                                                        url={whatsapp} 
                                                                        mobile={(item.sentWhatsappNumber && item.sentWhatsappNumber.trim() !== "") ? item.sentWhatsappNumber : (item.customerContactNo && item.customerContactNo.trim() !== "" ? item.customerContactNo : null)}
                                                                        onSuccess={tabValue === 1 ? () => handleMarkAsSent(item.id, item.inquiryId, item.warehouseId, null, true) : undefined}
                                                                    />
                                                                ) : ""}
                                                                {print && tabValue !== 0 ?
                                                                    <Tooltip title="Print" placement="top">
                                                                        {tabValue === 2 ? (
                                                                            // For Sent tab, use direct link (already sent, no need to call API)
                                                                            <a href={`${Report}${invoiceReportLink}`} target="_blank" rel="noopener noreferrer">
                                                                                <IconButton
                                                                                    aria-label="print"
                                                                                    size="small"
                                                                                >
                                                                                    <LocalPrintshopIcon color="primary" fontSize="medium" />
                                                                                </IconButton>
                                                                            </a>
                                                                        ) : (
                                                                            // For Processing tab, use onClick to mark as sent
                                                                            <IconButton
                                                                                aria-label="print"
                                                                                size="small"
                                                                                onClick={(e) => handleMarkAsSent(item.id, item.inquiryId, item.warehouseId, e)}
                                                                            >
                                                                                <LocalPrintshopIcon color="primary" fontSize="medium" />
                                                                            </IconButton>
                                                                        )}
                                                                    </Tooltip>
                                                                : ""}
                                                            </>

                                                            {/* Sent tab actions (now tabValue === 2) */}
                                                            {update && tabValue === 2 ?
                                                                    <>
                                                                    <RejectConfirmationById
                                                                        id={item.id}
                                                                        controller="Inquiry/RejectProformaInvoice"
                                                                        fetchItems={() => {
                                                                            setTabValue(4);
                                                                            fetchQuotationList(1, searchTerm, pageSize, 4);
                                                                        }}
                                                                    />

                                                                    <ConfirmInovoiceById
                                                                        id={item.id}
                                                                        fetchItems={() => {
                                                                            setTabValue(3);
                                                                            fetchQuotationList(1, searchTerm, pageSize, 3);
                                                                        }}
                                                                    />
                                                                    </>
                                                                    : ""}
                                                            </Box>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                        );
                                    })()}
                                </TableBody>
                            </Table>
                        <Grid container justifyContent="space-between" mt={2} mb={2}>
                            <Pagination count={Math.ceil(totalCount / pageSize)} page={page} onChange={handlePageChange} color="primary" shape="rounded" />
                            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                                <InputLabel>Page Size</InputLabel>
                                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                                    <MenuItem value={5}>5</MenuItem>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </TableContainer>
                </Grid>
            </Grid>
        </>
    );
}