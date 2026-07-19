import { syncRead } from './sync-read';
import { syncReading } from './sync-reading';
import { syncUpNext } from './sync-up-next';

const syncBooks = async (sections: string[]) => {
  const selected = sections.length ? sections : ['read', 'reading', 'up-next'];

  if (selected.includes('read')) {
    console.log('Syncing read books...');
    await syncRead();
  }
  if (selected.includes('reading')) {
    console.log('Syncing currently reading...');
    await syncReading();
  }
  if (selected.includes('up-next')) {
    console.log('Syncing up next...');
    await syncUpNext();
  }
};

syncBooks(process.argv.slice(2));
