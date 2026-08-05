// app/api/leaderboard/route.ts
//
// The previous version of this file was a copy-paste of the per-user
// submissions route: it required a `userId` param and returned that one
// user's raw submissions under `submissions` — but every page in the app
// (problems list, leaderboard page, profile page) calls GET /api/leaderboard
// with no params and expects { success, leaderboard: [{ username, solved,
// streak }] } back. This is a full, correct rewrite of that missing feature.
import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Submission from "@/app/api/models/submission.models";
import User from "@/app/api/models/user.models";

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const dateSet = new Set(dates);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const check = new Date();
    check.setDate(check.getDate() - i);
    if (dateSet.has(check.toDateString())) streak++;
    else break;
  }
  return streak;
}

export async function GET() {
  try {
    await connectDB();

    const [users, acceptedSubmissions] = await Promise.all([
      User.find({}, "_id username").lean(),
      Submission.find({ status: "Accepted" }, "user problem createdAt").lean(),
    ]);

    const byUser = new Map<
      string,
      { solvedProblemIds: Set<string>; activityDates: string[] }
    >();

    for (const sub of acceptedSubmissions) {
      const userId = sub.user.toString();
      if (!byUser.has(userId)) {
        byUser.set(userId, { solvedProblemIds: new Set(), activityDates: [] });
      }
      const entry = byUser.get(userId)!;
      entry.solvedProblemIds.add(sub.problem.toString());
      entry.activityDates.push(new Date(sub.createdAt).toDateString());
    }

    const leaderboard = users
      .map((u: any) => {
        const entry = byUser.get(u._id.toString());
        return {
          username: u.username,
          solved: entry ? entry.solvedProblemIds.size : 0,
          streak: entry ? calculateStreak(entry.activityDates) : 0,
        };
      })
      .filter((e) => e.solved > 0)
      .sort((a, b) => b.solved - a.solved || b.streak - a.streak);

    return NextResponse.json({ success: true, leaderboard });
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to compute leaderboard." },
      { status: 500 }
    );
  }
}
