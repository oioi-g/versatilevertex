import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import RegisterPage from "./Pages/RegisterPage";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";
import LikedPage from "./Pages/LikedPage";
import UserBoardsPage from "./Pages/UserBoardsPage";
import BoardDetailsPage from "./Pages/BoardDetailsPage";
import UserProfilePage from "./Pages/UserProfilePage";
import ChangeDetailsPage from "./Pages/ChangeDetailsPage";
import ViewDraftsPage from "./Pages/ViewDraftsPage";
import DraftDetailsPage from "./Pages/DraftDetailsPage";
import ViewUserPage from "./Pages/ViewUserPage";
import CollageDetailsPage from "./Pages/CollageDetailsPage";
import FAQsPage from "./Pages/FAQsPage";
import AboutUsPage from "./Pages/AboutUsPage";
import UserDashboardPage from "./Pages/UserDashboardPage";
import UserDesignChallengesPage from "./Pages/UserDesignChallengesPage";
import AdminViewSubmissionsPage from "./Pages/AdminViewSubmissionsPage";
import CreateChallengePage from "./Pages/CreateChallengePage";
import AdminViewReportsPage from "./Pages/AdminViewReportsPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage";
import FeedbackPage from "./Pages/FeedbackPage";
import AdminViewFeedbacksPage from "./Pages/AdminViewFeedbacksPage";
import Footer from "./Components/Footer";
import Header from "./Components/Header";
import { Box, ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#214224",
    },
    secondary: {
      main: "#500545",
    },
    background: {
      default: "#f0f0f0",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'TanPearl', sans-serif"
  }
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout />
      </Router>
    </ThemeProvider>
  );
};

const MainLayout = () => {
  const location = useLocation();

  const hideFooter = location.pathname === "/" || location.pathname === "/loginpage" || location.pathname === "/forgotpasswordpage";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Header />
      </Box>
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/loginpage" element={<LoginPage />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/likedpage" element={<LikedPage />} />
          <Route path="/userboardspage" element={<UserBoardsPage />} />
          <Route path="/userboardspage/:boardId" element={<BoardDetailsPage />} />
          <Route path="/userprofilepage" element={<UserProfilePage />} />
          <Route path="/changedetailspage" element={<ChangeDetailsPage />} />
          <Route path="/viewdraftspage" element={<ViewDraftsPage />} />
          <Route path="/draftdetailspage/:draftId" element={<DraftDetailsPage />} />
          <Route path="/user/:userId" element={<ViewUserPage />} />
          <Route path="/collagedetailspage/:collageId" element={<CollageDetailsPage />} />
          <Route path="/faqspage" element={<FAQsPage />} />
          <Route path="/aboutuspage" element={<AboutUsPage />} />
          <Route path="/userdashboardpage" element={<UserDashboardPage />} />
          <Route path="/userdesignchallengespage" element={<UserDesignChallengesPage />} />
          <Route path="/admin/submissionspage/:challengeId" element={<AdminViewSubmissionsPage />} />
          <Route path="/admin/createchallengepage" element={<CreateChallengePage />} />
          <Route path="/admin/viewreportspage" element={<AdminViewReportsPage />} />
          <Route path="/forgotpasswordpage" element={<ForgotPasswordPage />} />
          <Route path="/feedbackpage" element={<FeedbackPage />} />
          <Route path="/admin/viewfeedbackspage" element={<AdminViewFeedbacksPage />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </Box>
  );
};

export default App;