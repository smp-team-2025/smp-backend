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
        const name =
          row["Name (ursprünglicher Name)"] ||
          row["Name (Original Name)"] ||
          row["User Name"] ||
          row["Name"] ||
          "";

        if (!name || !name.trim()) {
          return;
        }

        const email =
          row["E-Mail"] ||
          row["E-mail"] ||
          row["Email"] ||
          undefined;

        const joinTime =
          row["Beitrittszeit"] ||
          row["Join Time"] ||
          undefined;

        const leaveTime =
          row["Austrittszeit"] ||
          row["Leave Time"] ||
          undefined;

        const durationMinRaw =
          row["Dauer (Minuten)"] ||
          row["Duration (Minutes)"] ||
          undefined;

        rows.push({
          name: name.trim(),
          email,
          joinTime,
          leaveTime,
          durationMin: durationMinRaw ? Number(durationMinRaw) : undefined,
        });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}