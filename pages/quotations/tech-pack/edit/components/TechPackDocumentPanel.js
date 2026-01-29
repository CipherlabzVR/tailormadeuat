import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ViewImage from "@/components/UIElements/Modal/ViewImage";

export default function TechPackDocumentPanel({ windowTypeName }) {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);

  const fetchOngoingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingInquiryById?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ongoing data");
      }

      const data = await response.json();
      if (data.result) {
        setInquiry(data.result);
        // Fetch documents from original inquiry
        fetchDocuments(inquiryId, optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error fetching ongoing data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (inqId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data.result || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId && inquiryId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId, inquiryId]);

  const navToPrevious = () => {
    // Navigate based on window type to match original inquiry flow
    const prevRoutes = {
      1: "/quotations/tech-pack/edit/tshirt/sleeve",      // T-Shirt: sleeve → document-panel
      2: "/quotations/tech-pack/edit/shirt/sleeve",       // Shirt: sleeve → document-panel
      3: "/quotations/tech-pack/edit/cap/info",           // Cap: info → document-panel
      4: "/quotations/tech-pack/edit/visor/components",   // Visor: components → document-panel
      5: "/quotations/tech-pack/edit/sizes",              // Hat: sizes → document-panel
      6: "/quotations/tech-pack/edit/sizes",              // Bag: sizes → document-panel
      7: "/quotations/tech-pack/edit/bottom/component",   // Bottom: component → document-panel
      8: "/quotations/tech-pack/edit/short/component",    // Short: component → document-panel
    };
    router.push({
      pathname: prevRoutes[inquiry?.windowType] || "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/summary",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const getDocumentContentTypeName = (type) => {
    const types = {
      1: "Front",
      2: "Back",
      3: "Back Inside",
      4: "Left Sleeve",
      5: "Right Sleeve",
      6: "Left Side",
      7: "Right Side",
      8: "Front Left",
      9: "Front Right",
      10: "Back Left",
      11: "Back Right",
    };
    return types[type] || `Panel ${type}`;
  };

  const getDocumentSubContentTypeName = (type) => {
    const types = {
      1: "EMB",
      2: "SUB",
      3: "S Print",
      4: "DTF",
      5: "Plain",
    };
    return types[type] || "Unknown";
  };

  // Group documents by content type
  const groupedDocuments = documents.reduce((acc, doc) => {
    const key = doc.documentContentType;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/quotations/tech-pack/"
        link="Tech Pack"
        title={`Document Panel - ${windowTypeName}`}
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Document Panel</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={navToNext}
            >
              next
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          {Object.keys(groupedDocuments).length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="textSecondary">No documents available</Typography>
            </Box>
          ) : (
            Object.keys(groupedDocuments)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map((contentType) => (
                <Card
                  key={contentType}
                  sx={{
                    boxShadow: "none",
                    borderRadius: "10px",
                    p: "20px",
                    mb: "15px",
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    {getDocumentContentTypeName(parseInt(contentType))}
                  </Typography>
                  <Grid container spacing={2}>
                    {groupedDocuments[contentType].map((doc, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                        <Card
                          sx={{
                            boxShadow: "none",
                            border: "1px solid #e0e0e0",
                            borderRadius: "10px",
                            p: "15px",
                            height: "100%",
                            position: "relative",
                            backgroundImage: doc.documentURL
                              ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${doc.documentURL})`
                              : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            minHeight: "150px",
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <FormControlLabel
                              control={<Checkbox checked={true} disabled />}
                              label={
                                <Typography fontWeight="bold">
                                  {getDocumentSubContentTypeName(doc.documentSubContentType)}
                                </Typography>
                              }
                            />
                            {doc.documentURL && <ViewImage imageURL={doc.documentURL} />}
                          </Box>
                          {!doc.documentURL && (
                            <Box
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                              height="80px"
                            >
                              <Typography color="textSecondary" fontSize="12px">
                                No image uploaded
                              </Typography>
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              ))
          )}
        </Grid>
      </Grid>
    </>
  );
}
