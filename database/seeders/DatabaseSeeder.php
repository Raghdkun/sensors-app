<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! User::where('email', 'admin@pnefoods.com')->exists()) {
            User::factory()->create([
                'name'              => 'Admin',
                'email'             => 'admin@pnefoods.com',
                'password'          => Hash::make('Pizza2213!!'),
                'email_verified_at' => now(),
            ]);
        }
    }
}
