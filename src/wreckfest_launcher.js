const fs = require('fs');

console.log(`
GOG Wreckfest LAN fix launcher.
This launcher fixes up GOG's botched LAN support for Wreckfest.

It is based on DLLs from https://gitlab.com/Mr_Goldberg/goldberg_emulator/-/jobs/4247811310/artifacts/download
See https://gitlab.com/Mr_Goldberg/goldberg_emulator/blob/master/README.md for more information.

The LAN player profile is set up to have 100 million credits and XP to allow unlocking all cars
and upgrades for casual LAN play.

What do you want to do?

1) Play Wreckfest in LAN patched mode.
2) Play Wreckfest in original GOG installed mode. (play single-player career mode, no LAN play)
X) Quit
`);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function rng(low, high) { return (Math.floor(Math.random() * (high-low+1)) + low).toString(); }
function generate_random_user_id() {
  let id = rng(1, 9);
  for(let i = 0; i < 16; ++i) id += rng(0, 9);
  return id;
}

function file_exists(path) {
  try {
    fs.statSync(path);
    return true;
  } catch (e) {}
  return false;
}

function backup_and_replace(path) {
  let bkp = `${path}.original_backup`;
  if (!file_exists(bkp)) fs.copyFileSync(path, bkp);
  let emulated = `${path}.goldberg_emulator`;
  fs.copyFileSync(emulated, path);
}

function restore_from_backup(path) {
  let bkp = `${path}.original_backup`;
  if (file_exists(bkp)) fs.copyFileSync(bkp, path);
}

function launch_wreckfest() {
  console.log('Launching Wreckfest...');
  require('child_process').exec(`"${__dirname}/Wreckfest_x64.exe"`, function callback(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
}

function ask_player_name() {
  let old_name = '';
  try {
    old_name = fs.readFileSync(`${__dirname}/1/settings/account_name.txt`);
  } catch(e) {}

  let prompt = 'Enter your player name for LAN? ';
  if (old_name.length > 0) prompt += `(press Enter to reuse previous name "${old_name}") `;

  readline.question(prompt, name => {
    if (name.length == 0) name = old_name;
    if (name.length == 0) {
      console.log('Name cannot be empty!');
      return ask_player_name();
    }
    if (name.length > 31) {
      console.log(`Max length for name is 31 characters! (Truncates to "${name.substr(0, 31)}")`);
      return ask_player_name();      
    }
    readline.close();
    backup_and_replace(`${__dirname}/steam_api.dll`);
    backup_and_replace(`${__dirname}/steam_api64.dll`);
    fs.writeFileSync(`${__dirname}/1/settings/account_name.txt`, name);
    fs.writeFileSync(`${__dirname}/1/settings/user_steam_id.txt`, generate_random_user_id());
    launch_wreckfest();
  });
}

readline.question('? ', mode => {
  if (mode == 1) {
    ask_player_name();
  } else if (mode == 2) {
    readline.close();
    restore_from_backup(`${__dirname}/steam_api.dll`);
    restore_from_backup(`${__dirname}/steam_api64.dll`);
    launch_wreckfest();
  } else {
    readline.close();    
  }
});
