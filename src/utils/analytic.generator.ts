import mongoose, { Document, Model } from "mongoose";

interface Monthdata {
  month: string;
  count: number;
}

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: Monthdata[] }> {
  const last12Months:Monthdata[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for (let i = 12; i >= 0; i--) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28
    );
   
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28
    );
    
    const monthYear = endDate.toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    // console.log('month year', monthYear)
    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });
    last12Months.push({ month: monthYear, count });
  }
//   console.log(last12Months)
  return {last12Months}  ;
}
