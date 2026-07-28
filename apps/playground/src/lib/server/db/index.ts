import { openDatabase } from "@hyperkernel/sqlite";
import { env } from "$env/dynamic/private";

export const db = openDatabase(env.DATABASE_URL);
