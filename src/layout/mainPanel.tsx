import { Container } from "@mui/material";
import { Outlet } from "react-router-dom";

const MainPanel = () => (
  <Container component="main" id="main-panel" maxWidth="md" sx={{ py: 6 }}>
    <Outlet />
  </Container>
);

export default MainPanel;
