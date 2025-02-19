import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log(SUPABASE_URL);
console.log(SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
