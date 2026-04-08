import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      TLDV_API_KEY: process.env.TLDV_API_KEY ? "set" : "missing",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "set" : "missing",
      NOTION_API_KEY: process.env.NOTION_API_KEY ? "set" : "missing",
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID ? "set" : "missing",
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    },
  });
}
