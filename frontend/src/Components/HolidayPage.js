import * as React from "react";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { Button, dialogClasses } from "@mui/material";
import { useState } from "react";

export default function ResponsiveDatePickers() {
  const obj = new Date();
  // current date
  const [currentDate, setCurrentDate] = useState(
    `${obj.getFullYear()}-${obj.getMonth() + 1}-${obj.getDate()}`
  );

  // current date
  const [selectedDate, setSelectedDate] = React.useState(dayjs(currentDate)); // Default date

  const handleDateChange = (newValue) => {
    setSelectedDate(newValue); // Update the selected date state
  };

  const handleOkClick = () => {
    const today = dayjs().startOf("day"); // Start of today for accurate comparison
    if (selectedDate.isBefore(today)) {
      console.log(
        "Error: Selected date is in the past. Please select a current or future date."
      );
    } else {
      console.log("Selected Date:", selectedDate.format("DD-MM-YYYY")); // Log the selected date
    }
  };

  const handleCancelClick = () => {
    console.log("Action cancelled"); // No action triggered
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


      <div
        className=" "
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticDatePicker
            value={selectedDate}
            onChange={handleDateChange}
            slots={{
              actionBar: () => null, // Disables OK and Cancel buttons
            }}
          />

          <div style={{ marginTop: "20px" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOkClick}
              style={{ marginRight: "10px" }}
            >
              OK
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
          </div>
          <div style={{ marginTop: "20px" }}>
            <p>
              <strong>Selected Date:</strong>{" "}
              {selectedDate.format("YYYY-MM-DD")}
            </p>
          </div>
          {/* </DemoContainer> */}
        </LocalizationProvider>
      </div>


        
        

    </div>
  );
}
