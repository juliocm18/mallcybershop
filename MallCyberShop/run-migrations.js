const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection details
const supabaseUrl = 'https://mtmikpoblfslzhastcyj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key, not anon key

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    // Path to migrations directory
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    
    // Get all migration files sorted by name
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute the SQL directly
      const { error } = await supabase.from('_migrations_log').insert({
        name: file,
        executed_at: new Date().toISOString(),
        success: true
      }).select().single();
      
      // Execute the SQL using REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'X-Client-Info': 'supabase-js/2.x'
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error running migration ${file}:`, errorData);
        throw new Error(`Migration failed: ${JSON.stringify(errorData)}`);
      }
      
      console.log(`Successfully ran migration: ${file}`);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
