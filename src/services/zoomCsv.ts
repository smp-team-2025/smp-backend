import fs from "fs";
import csv from "csv-parser";

export type ZoomCsvRow = {
  name: string;
  email?: string;
  joinTime?: string;
  leaveTime?: string;
  durationMin?: number;
};

export async function parseZoomCsv(filePath: string): Promise<ZoomCsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: ZoomCsvRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push({
          name: row["Name (Original Name)"] || row["User Name"],
          email: row["E-mail"] || undefined,
          joinTime: row["Join Time"],
          leaveTime: row["Leave Time"],
          durationMin: Number(row["Duration (Minutes)"]) || undefined,
        });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}