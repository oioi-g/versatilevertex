import React, { useState } from "react";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

const ReportDialog = ({ open, onClose, onReport, content }) => {
  const [reportReason, setReportReason] = useState("");

  const handleSubmit = () => {
    onReport(content, reportReason);
    onClose();
    setReportReason("");
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontFamily: "'TanPearl', sans-serif", color: "#214224" }}>
        Report {content?.isCollage ? "Collage" : "Image"}
      </DialogTitle>

      <DialogContent>
        <TextField margin="dense" placeholder={`Reason for reporting this ${content?.isCollage ? "collage" : "image"}`} type="text" fullWidth variant="outlined" multiline rows={4} value={reportReason} onChange={(e) => setReportReason(e.target.value)} sx={{ mt: 2, width: '100%' }} />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: "'TanPearl', sans-serif" }}>
          Cancel
        </Button>

        <Button onClick={handleSubmit} disabled={!reportReason} sx={{ fontFamily: "'TanPearl', sans-serif" }}>
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;