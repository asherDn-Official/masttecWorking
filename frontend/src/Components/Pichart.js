import * as React from "react";
import Box from "@mui/material/Box";
import { PieChart } from "@mui/x-charts/PieChart";

export default function CustomPieChart({ data }) {
  const {
    total,
    present,
    absent,
    late,
    sunday,
    paidLeave,
    unPaidLeave,
    holiday,
    cOff,
    weekOff,
    leave,
  } = data;

  const attendanceData = [
    // { label: "Total", value: total },
    { label: "Present", value: present },
    { label: "Absent", value: absent },
    { label: "Late", value: late },
    { label: "Sunday", value: sunday },
    { label: "Paid Leave", value: paidLeave },
    { label: "Unpaid Leave", value: unPaidLeave },
    { label: "Holiday", value: holiday },
    { label: "C-Off", value: cOff },
    { label: "Week Off", value: weekOff },
    { label: "Leave", value: leave },
  ];

  const valueFormatter = (item) => `${item.value}`;

  return (
    <Box sx={{ width: "100%" }}>
      <PieChart
        height={400}
        series={[
          {
            data: attendanceData,
            innerRadius: 120,
            arcLabel: (params) => params.label ?? "",
            arcLabelMinAngle: 5,
            valueFormatter,
          },
        ]}
      />
    </Box>
  );
}
