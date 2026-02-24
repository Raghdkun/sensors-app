<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Snapshot Capture
|--------------------------------------------------------------------------
|
| Runs every minute via `php artisan schedule:run`.
| The command itself checks each store's individual interval
| and only captures when the schedule is due.
|
| On cPanel (Bluehost), set one cron entry:
|   * * * * * cd /home/<cpaneluser>/sensor-app && php artisan schedule:run >> /dev/null 2>&1
|
*/
Schedule::command('snapshots:capture')->everyMinute();
