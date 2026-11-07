import { Container, Typography } from "@mui/material";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error: unknown = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error ? error.message : "An unexpected error has occurred.";

  return (
    <Container component="main" id="error-page" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1">Oops!</Typography>
      <Typography role="alert">{message}</Typography>
    </Container>
  );
};

export default ErrorPage;
