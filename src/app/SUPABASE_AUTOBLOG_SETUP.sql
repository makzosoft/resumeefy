-- Resumeefy AutoBlog: use Supabase Cron instead of Vercel Cron.
-- This allows 10 scheduled runs per day even when Vercel is on Hobby.
-- 1. Enable pg_cron and pg_net in Supabase Dashboard > Database > Extensions.
-- 2. Replace the two placeholders below with your production Vercel URL and CRON_SECRET.
-- 3. Run this file in the Supabase SQL Editor.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid)
from cron.job
where jobname = 'resumeefy-autoblog-10x';

select cron.schedule(
  'resumeefy-autoblog-10x',
  '0 0,3,6,9,12,14,17,19,21,23 * * *',
  $$
    select net.http_post(
      url := 'https://YOUR-VERCEL-DOMAIN.vercel.app/api/blog?action=autopublish',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_CRON_SECRET'
      ),
      body := jsonb_build_object('source', 'supabase_cron', 'scheduled_at', now()),
      timeout_milliseconds := 10000
    );
  $$
);

-- Verify:
-- select jobid, jobname, schedule, active from cron.job where jobname='resumeefy-autoblog-10x';
-- select * from cron.job_run_details order by start_time desc limit 20;
