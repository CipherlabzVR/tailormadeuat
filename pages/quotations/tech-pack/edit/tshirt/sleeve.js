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
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackTshirtSleeve() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWN, setSelectedWN] = useState(0);
  const [isShortChecked, setIsShortChecked] = useState(false);
  const [isLongChecked, setIsLongChecked] = useState(false);
  const [selectedButtonShort, setSelectedButtonShort] = useState();
  const [shortSizeValue, setShortSizeValue] = useState(1);
  const [longSizeValue, setLongSizeValue] = useState(1);
  const [selectedButtonLong, setSelectedButtonLong] = useState();

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
        fetchSleeveData(inquiryId, optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSleeveData = async (inqId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result[0]) {
          if (data.result[0].wrangler === "1") {
            setSelectedWN(1);
          } else if (data.result[0].normal === "1") {
            setSelectedWN(0);
          }
          if (data.result[0].short === 1) {
            setIsShortChecked(true);
          }
          if (data.result[0].long === 1) {
            setIsLongChecked(true);
          }
          setSelectedButtonShort(data.result[0].shortType);
          setSelectedButtonLong(data.result[0].longType);
          setShortSizeValue(data.result[0].shortSize);
          setLongSizeValue(data.result[0].longSize);
        }
      }
    } catch (error) {
      console.error("Error fetching sleeve data:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/neck",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/document-panel",
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
        title="Sleeve - Tech Pack"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Sleeve</Typography>
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
          <RadioGroup name="wn" value={selectedWN}>
            <Grid container>
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
                    value={0}
                    control={<Radio checked={selectedWN === 0} disabled />}
                    label="Normal Sleeve"
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
                    value={1}
                    control={<Radio checked={selectedWN === 1} disabled />}
                    label="Ranglan Sleeve"
                  />
                </Card>
              </Grid>
            </Grid>
          </RadioGroup>

          <Grid container>
            <Grid item xs={12} p={1}>
              <Grid container>
                <Grid item xs={12}>
                  <Button disabled>
                    <FormControlLabel
                      control={<Checkbox checked={isShortChecked} disabled />}
                      label="Short"
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} lg={9}>
                  <ButtonGroup
                    sx={{ height: "100%" }}
                    fullWidth
                    disabled
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button variant={selectedButtonShort === 1 ? "contained" : "outlined"}>HEM</Button>
                    <Button variant={selectedButtonShort === 2 ? "contained" : "outlined"}>Double HEM</Button>
                    <Button variant={selectedButtonShort === 3 ? "contained" : "outlined"}>KNITTED CUFF</Button>
                    <Button variant={selectedButtonShort === 10 ? "contained" : "outlined"}>TIFFIN KNITTED CUFF</Button>
                    <Button variant={selectedButtonShort === 4 ? "contained" : "outlined"}>FABRIC CUFF</Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth disabled>
                    <InputLabel>Size</InputLabel>
                    <Select label="Size" value={isShortChecked ? shortSizeValue : ""}>
                      <MenuItem value={1}>7/8</MenuItem>
                      <MenuItem value={2}>5/8</MenuItem>
                      <MenuItem value={3}>1"</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} p={1}>
              <Grid container>
                <Grid item xs={12}>
                  <Button disabled>
                    <FormControlLabel
                      control={<Checkbox checked={isLongChecked} disabled />}
                      label="Long"
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} lg={9}>
                  <ButtonGroup
                    sx={{ height: "100%" }}
                    fullWidth
                    disabled
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button variant={selectedButtonLong === 5 ? "contained" : "outlined"}>HEM</Button>
                    <Button variant={selectedButtonLong === 6 ? "contained" : "outlined"}>Double HEM</Button>
                    <Button variant={selectedButtonLong === 7 ? "contained" : "outlined"}>KNITTED CUFF</Button>
                    <Button variant={selectedButtonLong === 10 ? "contained" : "outlined"}>TIFFIN KNITTED CUFF</Button>
                    <Button variant={selectedButtonLong === 8 ? "contained" : "outlined"}>FABRIC CUFF</Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth disabled>
                    <InputLabel>Size</InputLabel>
                    <Select label="Size" value={isLongChecked ? longSizeValue : ""}>
                      <MenuItem value={1}>7/8</MenuItem>
                      <MenuItem value={2}>8/5</MenuItem>
                      <MenuItem value={3}>1"</MenuItem>
                      <MenuItem value={4}>2"</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
