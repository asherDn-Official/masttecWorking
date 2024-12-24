import React, { useState } from "react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import axios from "axios";
import { useEffect } from "react";
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
} from "@mui/material";

export default function ResponsiveDatePickers() {
  const [selectDay, setSelectDay] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [recentUpdates, setRecentUpdates] = useState([]);

  // get meathod
  async function getrecentUpdates() {
    try {
      const response = await axios.get(
        `http://localhost:4000/v1/api/holiday/2024`
      );
      setRecentUpdates(response.data.holidays);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    // get the data Approved Holiday List
    getrecentUpdates();
  }, []);

  // Handle date change in the calendar
  const handleDateChange = (newValue) => {
    setSelectedDate(newValue);
  };

  // Add date to the selected dates list
  const handleOkClick = () => {
    const today = dayjs().startOf("day");
    if (selectedDate.isBefore(today)) {
      alert(
        "Error: Selected date is in the past. Please select a future date."
      );
    } else {
      const formattedDate = selectedDate.format("DD-MM-YYYY");
      if (!selectDay.includes(formattedDate)) {
        setSelectDay((prev) => [...prev, formattedDate]);
      }
    }
  };

  // Remove a date from the selected dates list
  const handleCancelClick = (index) => {
    const removedDate = selectDay[index];
    setSelectDay((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm the selected dates
  const handleConfirmClick = async () => {
    if (selectDay.length > 0) {
      const formattedDates = selectDay.map((date) =>
        dayjs(date, "DD-MM-YYYY").format("YYYY-MM-DD")
      );

      const response = await axios.post(
        `http://localhost:4000/v1/api/holiday`,
        {
          holidayList: formattedDates,
        }
      );
      // handle conform data console
      // console.log("date posted succesfully", response.data);

      setSelectDay([]);

      // GET THE ALL THE DATA Approved Holiday List
      getrecentUpdates();
    } else {
      alert("No dates selected to confirm.");
    }
  };

  // Delete Holiday
  const handleProvedDelete = async (date) => {
    try {
      const response = await axios.delete(
        "http://localhost:4000/v1/api/holiday",
        {
          headers: {
            "Content-Type": "application/json", // Specify JSON content type
          },
          data: {
            date, // Your body content
          },
        }
      );

      console.log(response.data);
    } catch (error) {
      console.log(error);
    }

    // GET THE ALL THE DATA
    getrecentUpdates();
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
      {/* Calendar Section */}
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
            value={selectedDate}
            onChange={handleDateChange}
            disablePast
            slots={{
              actionBar: () => null, // Disables OK and Cancel buttons
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
              onClick={handleOkClick}
              sx={{
                width: "100%",
                "& .MuiPickersCalendar-root": {
                  fontSize: "6.5rem",
                },
                "& .MuiPickersDay-root": {
                  fontSize: "6.5rem",
                  width: "3rem",
                  height: "3rem",
                  lineHeight: "3rem",
                },
                "& .MuiTypography-root": {
                  fontSize: "6.5rem",
                },

                "& .MuiPickersCalendarHeader-root": {
                  padding: "10px",
                },
              }}
            >
              Add Date
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      {/* Recent Updates Section */}
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          borderRadius: "12px",
          transition: "box-shadow 0.3s ease",
          "&:hover": { boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)" },
          maxHeight: "400px", // Set a maximum height for the updates section
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
          <Typography>No recent updates.</Typography>
        ) : (
          <ul style={{ padding: "0 10px", listStyleType: "disc" }}>
            {recentUpdates.map((update, index) => (
              <li
                key={index}
                style={{
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "5px",
                }}
              >
                {update}
                <span
                  className=" latest-delete-btn"
                  onClick={() => handleProvedDelete(update)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM8 9h8v10H8zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"
                    />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Paper>

      {/* Selected Dates and Confirm Button Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          justifyContent: "space-between",
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
            sx={{
              marginBottom: "20px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Confirm Date
            {/* Confirm Button beside the Selected Dates */}
            {selectDay.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
              </Box>
            )}
          </Typography>
          {selectDay.length === 0 ? (
            <Typography>No dates selected yet.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectDay.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item}</TableCell>
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
