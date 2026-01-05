import { app } from "./app";
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});