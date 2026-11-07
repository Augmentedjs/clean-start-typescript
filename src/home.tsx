import { useState } from "react";
import { Button, Stack, Typography } from "@mui/material";

const Home = () => {
  const [count, setCount] = useState(0);

  return (
    <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
      <Typography variant="h3" component="h1">Hello and welcome!</Typography>
      <Typography>Start building with React, TypeScript and Material UI.</Typography>
      <Button variant="contained" onClick={() => setCount(value => value + 1)}>
        Clicked {count} {count === 1 ? "time" : "times"}
      </Button>
    </Stack>
  );
};

export default Home;
