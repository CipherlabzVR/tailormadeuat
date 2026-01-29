import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackTshirtNeck() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNeck, setSelectedNeck] = useState("");
  const [isChecked, setIsChecked] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });

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

      if (!response.ok) throw new Error("Failed to fetch ongoing data");

      const data = await response.json();
      if (data.result) {
        setInquiry(data.result);
        fetchNeckData(inquiryId, optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNeckData = async (inqId, optId, windowType) => {
    try {
      // Fetch neck type
      const neckTypeRes = await fetch(
        `${BASE_URL}/InquiryNeck/GetNeckType?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (neckTypeRes.ok) {
        const data = await neckTypeRes.json();
        if (data.result != null) {
          const type = data.result.necKTypes;
          setSelectedNeck(type === 1 ? "POLO" : type === 2 ? "Crew Neck" : type === 3 ? "V Neck" : "");
        }
      }

      // Fetch neck body types
      const neckBodyRes = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckBody?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (neckBodyRes.ok) {
        const data = await neckBodyRes.json();
        const updatedChecked = { 1: false, 2: false, 3: false, 4: false };
        if (data.result) {
          data.result.forEach((item) => {
            updatedChecked[item.neckBodyTypes] = true;
          });
        }
        setIsChecked(updatedChecked);
      }
    } catch (error) {
      console.error("Error fetching neck data:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/sleeve",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

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
        title="Neck - Tech Pack"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button variant="outlined" color="primary" endIcon={<NavigateNextIcon />} onClick={navToNext}>
              next
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup name="neck" value={selectedNeck}>
                  <FormControlLabel
                    value="POLO"
                    control={<Radio checked={selectedNeck === "POLO"} disabled />}
                    label={<Typography style={{ fontSize: "25px" }}>POLO</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup name="neck" value={selectedNeck}>
                  <FormControlLabel
                    value="Crew Neck"
                    control={<Radio checked={selectedNeck === "Crew Neck"} disabled />}
                    label={<Typography style={{ fontSize: "25px" }}>Crew Neck</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup name="neck" value={selectedNeck}>
                  <FormControlLabel
                    value="V Neck"
                    control={<Radio checked={selectedNeck === "V Neck"} disabled />}
                    label={<Typography style={{ fontSize: "25px" }}>V Neck</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <Typography>Other Details</Typography>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isChecked[1]} disabled />}
                  label="Contrast"
                />
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isChecked[2]} disabled />}
                  label="A/H Pie Pin"
                />
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isChecked[3]} disabled />}
                  label="Cuff Pie Pin"
                />
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isChecked[4]} disabled />}
                  label="Bottom D / Hem"
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
