import 'dotenv/config';
import cron from 'node-cron';
import { createServer } from './server';
import { launchBot, checkAndBroadcast } from './bot';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = createServer();
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// launch bot
launchBot();

// Run check every minute
cron.schedule('* * * * *', async () => {
  console.log('Running signal check at', new Date().toISOString());
  await checkAndBroadcast();
});
