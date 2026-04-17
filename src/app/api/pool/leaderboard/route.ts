import { NextRequest, NextResponse } from "next/server";
import { getWeekInfo, getStandings, getPick, getAllPicks } from "@/lib/pool";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const weekParam = searchParams.get("week");
  const userId = searchParams.get("userId") || "";

  const current = getWeekInfo();
  const weekId = weekParam || current.id;

  const [standings, picks, myPick] = await Promise.all([
    getStandings(weekId),
    getAllPicks(weekId),
    userId ? getPick(weekId, userId) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    week: weekParam ? { id: weekId } : current,
    standings: standings.slice(0, 25),
    totalEntries: picks.length,
    myPick,
  });
}
