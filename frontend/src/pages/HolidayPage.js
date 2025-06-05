import React, { useState, useEffect } from "react"; // Added useEffect
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import axios from "axios";
// import { useEffect } from "react"; // Duplicate import removed
import {
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";

export default function ResponsiveDatePickers() {
  const [selectDay, setSelectDay] = useState([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState(dayjs());
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [holidayDetailInput, setHolidayDetailInput] = useState("");

  // get method
  async function getrecentUpdates() {
    const year = new Date().getFullYear();
    try {
      const response = await axios.get(
        `http://localhost:4000/v1/api/holiday/${year}`
      );
      if (response.data.holidays) {
        setRecentUpdates(response.data.holidays);
      } else {
        setRecentUpdates([]); // Ensure it's an empty array if no holidays
      }
    } catch (error) {
      console.log(error);
      // Optionally show a toast error if fetching holidays fails
      // toast.error("Failed to fetch holiday list.", { position: "top-right" });
    }
  }

  useEffect(() => {
    getrecentUpdates();
  }, []);

  const handleDateChange = (newValue) => {
    setCurrentSelectedDate(newValue);
  };

  const handleOpenDialog = () => {
    const today = dayjs().startOf("day");
    if (currentSelectedDate.isBefore(today)) {
      toast.error(
        "Selected date is in the past. Please select a future date.",
        { position: "top-right" }
      );
      return;
    }
    // Check if the date is already in the selectDay list before opening dialog
    const formattedDateForCheck = currentSelectedDate.format("DD-MM-YYYY");
    if (selectDay.find(entry => entry.date === formattedDateForCheck)) {
        toast.warn("This date is already added for confirmation.", { position: "top-right" });
        return;
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setHolidayDetailInput(""); // Reset input on close
  };

  const handleAddHolidayWithDetail = () => {
    if (holidayDetailInput && holidayDetailInput.trim() !== "") {
      const formattedDate = currentSelectedDate.format("DD-MM-YYYY");
      const newHolidayEntry = {
        date: formattedDate,
        detail: holidayDetailInput.trim(),
      };

      // This check is now redundant here as it's done in handleOpenDialog,
      // but keeping it doesn't harm and adds an extra layer of safety.
      if (!selectDay.find(entry => entry.date === formattedDate)) {
        setSelectDay((prev) => [...prev, newHolidayEntry]);
      } else {
        toast.warn("This date is already added for confirmation.", {
          position: "top-right",
        });
      }
      handleCloseDialog();
    } else {
      toast.error("Please provide a reason for the holiday.", {
        position: "top-right",
      });
    }
  };

  const handleCancelClick = (index) => {
    setSelectDay((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmClick = async () => {
    if (selectDay.length > 0) {
      const holidayListForApi = selectDay.map((entry) => ({
        date: dayjs(entry.date, "DD-MM-YYYY").format("YYYY-MM-DD"),
        detail: entry.detail,
      }));
      try {
        await axios.post(
          `http://localhost:4000/v1/api/holiday`,
          {
            holidayList: holidayListForApi,
          }
        );
        setSelectDay([]);
        toast.success("Holidays Added Successfully!", {
          position: "top-right",
        });
        getrecentUpdates(); // Refresh the list after successful addition
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to confirm holidays.",
          {
            position: "top-right",
          }
        );
      }
    } else {
      toast.info("No dates selected to confirm.", { position: "top-right" });
    }
  };

  const handleProvedDelete = async (dateToDelete) => {
    try {
      await axios.delete(
        "http://localhost:4000/v1/api/holiday",
        {
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            date: dateToDelete,
          },
        }
      );
      toast.warning("Holiday Deleted Successfully!", {
        position: "top-right",
      });
      getrecentUpdates(); // Refresh the list
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete holiday.",
        {
          position: "top-right",
        }
      );
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
        gap: "20px",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          borderRadius: "12px",
          transition: "box-shadow 0.3s ease",
          "&:hover": { boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)" },
        }}
      >
        <Typography
          variant="h5"
          sx={{ marginBottom: "20px", textAlign: "center", fontWeight: "bold" }}
        >
          Select a Date
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticDatePicker
            value={currentSelectedDate}
            onChange={handleDateChange}
            disablePast
            slots={{
              actionBar: () => null,
            }}
          />
        </LocalizationProvider>
        <Box
          sx={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <Tooltip title="Add the selected date" arrow>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenDialog} // Opens dialog
              sx={{
                width: "100%",
              }}
            >
              Add Date
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Holiday Detail</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the reason or detail for the holiday on{" "}
            {currentSelectedDate.format("DD-MM-YYYY")}.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="detail"
            label="Reason/Detail"
            type="text"
            fullWidth
            variant="standard"
            value={holidayDetailInput}
            onChange={(e) => setHolidayDetailInput(e.target.value)}
            onKeyPress={(ev) => { // Optional: Allow submit on Enter key
              if (ev.key === 'Enter') {
                handleAddHolidayWithDetail();
                ev.preventDefault();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddHolidayWithDetail}>Add</Button>
        </DialogActions>
      </Dialog>

      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          borderRadius: "12px",
          transition: "box-shadow 0.3s ease",
          "&:hover": { boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)" },
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <Typography
          variant="h5"
          sx={{ marginBottom: "20px", textAlign: "center", fontWeight: "bold" }}
        >
          Approved Holiday List
        </Typography>
        {recentUpdates.length === 0 ? (
          <Typography>No approved holidays for this year.</Typography>
        ) : (
          <ul style={{ padding: "0 10px", listStyleType: "disc" }}>
            {recentUpdates.map((update, index) => (
              <li
                key={index}
                style={{
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between", // Changed for better spacing
                  padding: "8px", // Added padding
                  backgroundColor: "#f5f5f5",
                  borderRadius: "5px",
                }}
              >
                <span>
                  {update.date} - {update.detail}
                </span>
                <Tooltip title="Delete this holiday" arrow>
                  <span
                    className="latest-delete-btn"
                    onClick={() => handleProvedDelete(update.date)}
                    style={{ cursor: "pointer", color: "red" }} // Added style for delete icon
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24" // Adjusted size
                      height="24" // Adjusted size
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM8 9h8v10H8zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"
                      />
                    </svg>
                  </span>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </Paper>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          // This Box will span across columns on 'md' and larger screens if gridColumn is set
          gridColumn: { xs: "1", md: "1 / -1" }, // Span all columns on medium screens and up
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            borderRadius: "12px",
            transition: "box-shadow 0.3s ease",
            "&:hover": { boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)" },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <Typography
              variant="h5"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Confirm Dates
            </Typography>
            {selectDay.length > 0 && (
              <Tooltip title="Confirm selected dates" arrow>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleConfirmClick}
                  sx={{
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#388e3c" },
                  }}
                >
                  Confirm Dates
                </Button>
              </Tooltip>
            )}
          </Box>
          {selectDay.length === 0 ? (
            <Typography>No dates selected yet.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Detail</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectDay.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.detail}</TableCell>
                      <TableCell>
                        <Tooltip title="Remove this date" arrow>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleCancelClick(index)}
                            sx={{
                              textTransform: "none",
                              "&:hover": { backgroundColor: "#ffd1d1" },
                            }}
                          >
                            Remove
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
